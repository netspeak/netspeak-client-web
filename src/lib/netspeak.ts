import { Metadata } from "grpc-web";
import { NetspeakServiceClient } from "./generated/NetspeakServiceServiceClientPb";
import {
	SearchRequest,
	PhraseConstraints,
	CorporaRequest,
	Phrase as ServicePhrase,
} from "./generated/NetspeakService_pb";
import { LRUCache } from "./lru-cache";
import { assertNever, noop } from "./util";

/**
 * Normalizes the given query such that two identical queries have the same string representation.
 */
export function normalizeQuery(query: string | undefined | null): string {
	// special values
	if (!query) return "";

	// normalize white spaces
	return query.replace(/[\s\uFEFF\xA0]+/g, " ").trim();
}

export interface Corpus {
	/** The unique key (or id) of the corpus. */
	readonly key: string;
	/** The english name of the corpus. */
	readonly name: string;
	/** The ISO 639-1 name of the language of the corpus. */
	readonly language: string;
}
export interface CorporaInfo {
	readonly corpora: Corpus[];
}
export interface NetspeakSearchRequest {
	query: string;
	corpus: string;
	maxfreq?: number;
	nmax?: number;
	nmin?: number;
	topk?: number;
}
export interface NetspeakSearchOptions {
	/**
	 * Whether the completeness of the resulting phrases should be explicitly checked. This cannot be done if `topk` is set to its maximum allowed value.
	 */
	checkComplete?: boolean;
	/**
	 * If the top-k mode is `"fill"`, then the API will guarantee that there are no further phrases if less than k phrases were returned. The fill mode requires that `request.topk` is set and that `options.outputType` is not `"raw"`. This might result in multiple request being made.
	 */
	topkMode?: "default" | "fill";
}
export enum NetspeakApiKind {
	/** Enum to select the api type */
	neural = "neural",
	ngram = "ngram",
}

export interface ReadonlyNetspeakSearchResult {
	/** The phrases returned by the API. */
	readonly phrases: readonly Phrase[];
	readonly complete?: boolean | undefined;
	/** A list of unknown words returned by the API. */
	readonly unknownWords: readonly string[];
}
export interface NetspeakSearchResult extends ReadonlyNetspeakSearchResult {
	phrases: Phrase[];
	complete?: boolean | undefined;
	unknownWords: string[];
}

export class Netspeak {
	corpusCaching = true;

	private _client: NetspeakServiceClient;
	private _cache = new LRUCache<Promise<ReadonlyNetspeakSearchResult>>(100);
	private _cachedCorpus: Readonly<CorporaInfo> | undefined = undefined;

	private constructor(hostname: string) {
		this._client = new NetspeakServiceClient(hostname);
	}

	/**
	 * Queries phrases from the Netspeak API using the given request.
	 *
	 * The returned phrase array will also have an optional `complete` property.
	 * It indicates whether the phrase array is complete, so that no additional phrases can be obtained by increasing `topk` or deceasing `maxfreq`.
	 * If the value is not set or `undefined`, it is not certain whether there are still phrases matching the query.
	 *
	 * @param request A request specifying the the options of the Netspeak API.
	 * @param options
	 */
	search(
		request: Readonly<NetspeakSearchRequest>,
		options?: Readonly<NetspeakSearchOptions>
	): Promise<ReadonlyNetspeakSearchResult> {
		// fill mode
		if (options?.topkMode === "fill") {
			return this._fillSearch(request, { ...options });
		} else {
			const key = JSON.stringify(request);
			const cached = this._cache.get(key);
			if (cached !== undefined) {
				return cached;
			} else {
				const uncached = this._uncachedSearch(request);
				uncached.then(res => {
					// only cache successful responses
					this._cache.add(key, Promise.resolve(res));
				}, noop);
				return uncached;
			}
		}
	}

	private _uncachedSearch(request: Readonly<NetspeakSearchRequest>): Promise<ReadonlyNetspeakSearchResult> {
		try {
			const req = this._toSearchRequest(request);

			const query = req.getQuery();
			const corpus = req.getCorpus();

			const meta: Metadata = {
				"netspeak-tracking-id": getTrackingId(),
			};

			return this._client.search(req, meta).then(resp => {
				if (resp.hasError()) {
					// error
					const error = resp.getError()!;
					throw new NetspeakError(error.getKind(), error.getMessage());
				} else {
					// success
					const result = resp.getResult()!;

					const searchResult: NetspeakSearchResult = {
						phrases: result.getPhrasesList().map(p => {
							const words = p.getWordsList().map(w => {
								return new Word(w.getText(), w.getTag());
							});
							return new Phrase(words, p.getFrequency(), query, corpus);
						}),
						unknownWords: result.getUnknownWordsList(),
					};

					return searchResult;
				}
			});
		} catch (error) {
			return Promise.reject(error);
		}
	}
	private _toSearchRequest(request: Readonly<NetspeakSearchRequest>): SearchRequest {
		const r = new SearchRequest();
		r.setQuery(request.query);
		r.setCorpus(request.corpus);
		if (request.topk !== undefined) {
			r.setMaxPhrases(request.topk);
		}

		const constraints = new PhraseConstraints();
		if (request.nmax !== undefined) {
			constraints.setWordsMax(request.nmax);
		}
		if (request.nmin !== undefined) {
			constraints.setWordsMin(request.nmin);
		}
		if (request.maxfreq !== undefined) {
			constraints.setFrequencyMax(request.maxfreq);
		}
		r.setPhraseConstraints(constraints);

		return r;
	}

	/**
	 * Queries phrases from the Netspeak API using the given request.
	 *
	 * This version of search guarantees that if not request.topk phrases are returned that there are no further phrases.
	 *
	 * To guarantees this, there might be as much as request.topk requests to the Netspeak API.
	 *
	 * @private
	 * @param request A request specifying the the options of the Netspeak API.
	 * @param options
	 * @returns
	 */
	private _fillSearch(
		request: Readonly<NetspeakSearchRequest>,
		options: NetspeakSearchOptions
	): Promise<NetspeakSearchResult> {
		// copy request
		const req = { ...request };

		try {
			// check topk
			if (typeof req.topk !== "number") {
				throw new TypeError("request.topk has to be a number.");
			}

			// prepare
			delete options.topkMode;

			const goal = req.topk;

			const result: NetspeakSearchResult & { complete: boolean } = {
				phrases: [],
				complete: false,
				unknownWords: [],
			};
			const unknownWordsSet: Record<string, true> = {};

			/**
			 * A "recursive" function to continue loading phrases until a certain number of phases has been loaded or
			 * there are no more phrases left.
			 */
			const fill = (): Promise<NetspeakSearchResult & { complete: boolean }> => {
				req.topk = goal - result.phrases.length + 1; // + 1 to check for completeness

				return this.search(req, options).then(({ phrases, unknownWords }) => {
					// append new phrases
					result.phrases.push(...phrases);

					// add new unknown words
					unknownWords.forEach(word => {
						if (!unknownWordsSet[word]) {
							unknownWordsSet[word] = true;
							result.unknownWords.push(word);
						}
					});

					// no new phrases
					if (phrases.length === 0) {
						result.complete = true;
						return result;
					}

					// queried more than necessary -> done & incomplete
					if (result.phrases.length > goal) {
						result.complete = false;
						result.phrases.splice(goal, goal - result.phrases.length);
						return result;
					}

					// there are still phrases left to query

					// adjust maxFreq
					const newMaxFreq = phrases[phrases.length - 1].frequency;
					req.maxfreq = req.maxfreq === newMaxFreq ? newMaxFreq - 1 : newMaxFreq;

					return fill();
				});
			};

			return fill();
		} catch (error) {
			return Promise.reject(error);
		}
	}

	/**
	 * Queries all available corpora from the Netspeak API.
	 */
	queryCorpora(): Promise<Readonly<CorporaInfo>> {
		if (this.corpusCaching && this._cachedCorpus) {
			// cached
			return Promise.resolve(this._cachedCorpus);
		} else {
			return this._client.getCorpora(new CorporaRequest(), null).then(resp => {
				const info: CorporaInfo = {
					corpora: resp.getCorporaList().map(c => {
						return {
							key: c.getKey(),
							name: c.getName(),
							language: c.getLanguage(),
						};
					}),
				};

				if (this.corpusCaching) {
					this._cachedCorpus = info;
				}

				return info;
			});
		}
	}

	/**
	 * The ngram host of the Netspeak API.
	 */
	static get ngramHostname(): string {
		return "https://ngram.api.netspeak.org";
	}
	/**
	 * The host for the neural netspeak API.
	 */
	static get neuralHostname(): string {
		return "https://neural.api.netspeak.org";
	}

	/**
	 * Get an instance calling different hosts depending on the apiType
	 */
	static getNetspeakClient(apiKind: NetspeakApiKind = NetspeakApiKind.ngram): Netspeak {
		switch (apiKind) {
			case NetspeakApiKind.neural:
				return (neuralNetspeakInstance ??= new Netspeak(Netspeak.neuralHostname));
			case NetspeakApiKind.ngram:
				return (ngramNetspeakInstance ??= new Netspeak(Netspeak.ngramHostname));
			default:
				assertNever(apiKind);
		}
	}
}

let ngramNetspeakInstance: Netspeak | undefined = undefined;
let neuralNetspeakInstance: Netspeak | undefined = undefined;

export class NetspeakError extends Error {
	constructor(errorCode: number | string, message: string) {
		super("Netspeak error: " + errorCode + ": " + message);
	}
}
export class NetspeakInvalidQueryError extends NetspeakError {
	constructor(message: string) {
		super(1, "Invalid Query: " + message);
	}
}

export const WordTypes = ServicePhrase.Word.Tag;
// eslint-disable-next-line no-redeclare
export type WordTypes = ServicePhrase.Word.Tag;

export class Word {
	/**
	 * @param text The text of the word.
	 * @param type The type of operator the word matches.
	 */
	constructor(public readonly text: string, public readonly type: WordTypes = WordTypes.WORD) {}

	/**
	 * Returns the name of the given word type
	 * or undefined if the given type does not equal any known word type.
	 *
	 * @param type The word type.
	 * @returns The name.
	 */
	static nameOfType(type: WordTypes): string {
		for (const name in WordTypes) {
			if (Object.prototype.hasOwnProperty.call(WordTypes, name)) {
				if ((WordTypes[name] as any) === type) {
					return name;
				}
			}
		}
		throw new Error(`Could not find name for value ${type}.`);
	}
}

/**
 * A phrase is phrase list of words that match phrase query.
 */
export class Phrase {
	readonly text: string;
	readonly id: string;

	/**
	 * Creates an instance of Phrase.
	 *
	 * @param words The array of words creating the phrase.
	 * @param frequency The absolute frequency of the phrase.
	 * @param query The query this phase matches.
	 * @param corpus The corpus from which the phrases where retrieved.
	 */
	constructor(
		public readonly words: readonly Word[],
		public readonly frequency: number,
		public readonly query: string,
		public readonly corpus: string
	) {
		this.text = this.words.map(w => w.text || "").join(" ");
		this.id = this.corpus + "\n" + this.text;
	}
}

/**
 * Returns a random tracking ID.
 */
function getTrackingId(): string {
	let id = sessionStorage.getItem("netspeak-id");
	if (id === null) {
		id = randomHex(32);
		sessionStorage.setItem("netspeak-id", id);
	}
	return id;
}
function randomHex(length: number): string {
	let s = "";
	for (let i = 0; i < length; i++) {
		const number = Math.floor(Math.random() * 16);
		s += number.toString(16);
	}
	return s.toLowerCase();
}
