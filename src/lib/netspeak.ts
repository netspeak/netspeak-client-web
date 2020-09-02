import { jsonp } from "./jsonp";
import { constructQueryParams } from "./url";

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
	key: string;
	/** The english name of the corpus. */
	name: string;
	/** The ISO 639-1 name of the language of the corpus. Only available for Netspeak >= 4. */
	language?: string;
}
export interface CorporaInfo {
	/** The key of the default corpus. */
	default: string | undefined;
	corpora: Corpus[];
}
export interface NetspeakSearchRequest {
	query: string;
	corpus?: string;
	format?: "json";
	maxfreq?: number;
	maxregexmatches?: number;
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
export interface NetspeakSearchResult {
	/** The phrases returned by the API. */
	phrases: Phrase[];
	complete?: boolean | undefined;
	/** A list of unknown words returned by the API. */
	unknownWords: string[];
}

export class Netspeak {
	baseUrl = Netspeak.defaultBaseUrl;
	defaultCorpus = Netspeak.defaultCorpus;
	corpusCaching = true;

	private _cachedCorpus: Promise<Readonly<CorporaInfo>> | undefined = undefined;

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
	): Promise<NetspeakSearchResult> {
		// fill mode
		if (options?.topkMode === "fill") {
			return this._fillSearch(request, { ...options });
		}

		try {
			// copy request
			const req = { ...request };

			// configure request
			req.format = "json";
			if (!req.corpus) {
				req.corpus = this.defaultCorpus;
			}
			// TODO: proper handling of lower-case indexes
			if (req.corpus === "web-en") {
				req.query = req.query.toLowerCase();
			}

			// get URL
			const url = this.baseUrl + "search" + constructQueryParams(req);

			return jsonp<any>(url).then(json => {
				const query = req.query;
				const corpus = req.corpus!;

				// for information on how the JSON object is structured see www.netspeak.org

				const errorCode = json["9"];
				if (errorCode) {
					// json["9"]:  error code for any value != 0
					// json["10"]: error message
					const errorMessage = json["10"];
					if (errorCode === 1) {
						throw new NetspeakInvalidQueryError(errorMessage);
					} else {
						throw new NetspeakError(errorCode, errorMessage);
					}
				}

				// json["4"]: [ // array of phrases
				//     {
				//         "1": internal id (int),
				//         "2": absolute frequency (int),
				//         "3": [ // array of words
				//             {
				//                 "1": type of word (int),
				//                 "2": the word (string)
				//             }, ...
				//         ]
				//     }, ...
				// ];
				const rawPhrases: {
					"1": number;
					"2": number;
					"3": { "1": number; "2": string }[];
				}[] = json["4"] || [];

				const phrases = rawPhrases.map(phrase => {
					const words = phrase["3"].map(w => new Word(w["2"], w["1"]));
					return new Phrase(words, phrase["2"], query, corpus);
				});

				const unknownWords: string[] = json["5"] || [];

				return {
					phrases,
					unknownWords,
				};
			});
		} catch (error) {
			return Promise.reject(error);
		}
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
							unknownWords.push(word);
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
		// cached
		if (this.corpusCaching && this._cachedCorpus) {
			return this._cachedCorpus;
		}

		const result = jsonp<any>(this.baseUrl + "corpus").then(json => {
			if ("default" in json && "corpora" in json) {
				// Netspeak 4
				return json as CorporaInfo;
			} else {
				// Netspeak 3

				const corpora: CorporaInfo = {
					default: undefined,
					corpora: [],
				};

				for (const corpus of json) {
					// corpus = { key: String, name: String, isDefault: Boolean }

					if (corpus.isDefault && corpora.default === undefined) corpora.default = corpus.key;
					delete corpus.isDefault;

					corpora.corpora.push(corpus);
				}

				return corpora;
			}
		});

		if (this.corpusCaching) {
			this._cachedCorpus = result;
		}

		return result;
	}

	/**
	 * The default base URL of the Netspeak API.
	 */
	static get defaultBaseUrl(): string {
		return "https://api.netspeak.org/netspeak4/";
	}

	/**
	 * The default corpus specified by the Netspeak API.
	 */
	static get defaultCorpus(): string {
		return "web-en";
	}

	static get instance(): Netspeak {
		return (defaultNetspeakInstance = defaultNetspeakInstance || new Netspeak());
	}
}

let defaultNetspeakInstance: Netspeak | undefined = undefined;

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

/**
 * The different types of operators that matched a given word.
 */
export enum WordTypes {
	WORD = 0,
	Q_MARK = 1,
	ASTERISK = 2,
	DICT_SET = 3,
	ORDER_SET = 4,
	OPTION_SET = 5,
	PLUS = 6,
	REGEX = 7,
	ORDER_SET_REGEX = 8,
	OPTION_SET_REGEX = 9,
}

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
		return WordTypes[type];
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
