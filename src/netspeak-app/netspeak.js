import { jsonp } from "./jsonp.js";

/**
 * Normalizes the given query such that two identical queries have the same string representation.
 *
 * @param {string | undefined | null} query
 * @returns {string}
 */
export function normalizeQuery(query) {
	// special values
	if (!query) return "";

	// normalize white spaces
	return query.replace(/[\s\uFEFF\xA0]+/g, " ").trim();
}


/**
 * @typedef Corpus
 * @property {string} key The unique key (or id) of the corpus.
 * @property {string} name The english name of the corpus.
 * @property {string} [language] The ISO 639-1 name of the language of the corpus. Only available for Netspeak >= 4.
 */

/**
 * @typedef CorporaInfo
 * @property {string | undefined} default The key of the default corpus.
 * @property {Corpus[]} corpora
 */

/**
 * @typedef NetspeakSearchRequest
 * @property {string} query
 * @property {string} [corpus]
 * @property {"json"} [format="json"]
 * @property {number} [maxfreq]
 * @property {number} [maxregexmatches]
 * @property {number} [nmax]
 * @property {number} [nmin]
 * @property {number} [topk]
 */

/**
 * @typedef NetspeakSearchOptions
 * @property {boolean} [checkComplete=false] Whether the completeness of the resulting phrases should be explicitly checked. This cannot be done if `topk` is set to its maximum allowed value.
 * @property {"default" | "fill"} [topkMode="default"] If the top-k mode is `"fill"`, then the API will guarantee that there are no further phrases if less than k phrases were returned. The fill mode requires that `request.topk` is set and that `options.outputType` is not `"raw"`. This might result in multiple request being made.
 */

/**
 * @typedef NetspeakSearchResult
 * @property {Phrase[]} phrases The phrases returned by the API.
 * @property {boolean | undefined} [complete]
 * @property {string[]} unknownWords A list of unknown words returned by the API.
 */


export class Netspeak {

	/**
	 * Creates an instance of Netspeak.
	 */
	constructor() {
		this.baseUrl = Netspeak.defaultBaseUrl;
		this.defaultCorpus = Netspeak.defaultCorpus;

		this.corpusCaching = true;
		/**
		 * @private
		 * @type {Promise<Readonly<CorporaInfo>> | undefined}
		 */
		this._cachedCorpus = undefined;
	}

	/**
	 * Queries phrases from the Netspeak API using the given request.
	 *
	 * The returned phrase array will also have an optional `complete` property.
	 * It indicates whether the phrase array is complete, so that no additional phrases can be obtained by increasing `topk` or deceasing `maxfreq`.
	 * If the value is not set or `undefined`, it is not certain whether there are still phrases matching the query.
	 *
	 * @param {Readonly<NetspeakSearchRequest>} request A request specifying the the options of the Netspeak API.
	 * @param {Readonly<NetspeakSearchOptions>} [options]
	 * @returns {Promise<NetspeakSearchResult>}
	 */
	search(request, options) {
		const opts = /** @type {NetspeakSearchOptions} */(Object.assign({}, options));

		// fill mode
		if (opts.topkMode === "fill") {
			return this._fillSearch(request, opts);
		}

		try {
			// copy request
			const req = /** @type {NetspeakSearchRequest} */(Object.assign({}, request));

			// configure request
			req.format = "json";
			if (!req.corpus) {
				req.corpus = this.defaultCorpus;
			}

			// get URL
			const url = this.getSearchUrl(req, this.baseUrl);

			return jsonp(url).then(json => {
				const query = req.query;
				const corpus = req.corpus;

				// for information on how the JSON object is structured see www.netspeak.org

				if (json["9"]) {
					// json["9"]:  error code for any value != 0
					// json["10"]: error message
					throw `NetspeakError: ${json["9"]}: ${json["10"]}`;
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
				/** @type {{ '1': number, '2': number, '3': { '1': number, '2': string }[] }[]} */
				const rawPhrases = json["4"] || [];

				const phrases = rawPhrases.map(phrase => {
					const words = phrase["3"].map(w => new Word(w["2"], w["1"]));
					return new Phrase(words, phrase["2"], query, corpus);
				});

				/** @type {string[]} */
				const unknownWords = json["5"] || [];

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
	 * @param {Readonly<NetspeakSearchRequest>} request A request specifying the the options of the Netspeak API.
	 * @param {NetspeakSearchOptions} options
	 * @returns {Promise<NetspeakSearchResult>}
	 */
	_fillSearch(request, options) {
		// copy request
		const req = /** @type {NetspeakSearchRequest} */ (Object.assign({}, request));

		try {
			// check topk
			if (typeof req.topk !== 'number') {
				throw new TypeError("request.topk has to be a number.");
			}

			// prepare
			delete options.topkMode;

			const goal = req.topk;

			/** @type {NetspeakSearchResult & { complete: boolean }} */
			const result = {
				phrases: [],
				complete: false,
				unknownWords: []
			};
			/** @type {Record<string, true>} */
			const unknownWordsSet = {};

			/**
			 * A "recursive" function to continue loading phrases until a certain number of phases has been loaded or
			 * there are no more phrases left.
			 *
			 * @returns {Promise<NetspeakSearchResult & { complete: boolean }>}
			 */
			const fill = () => {
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
	 * Returns the search URL for the Netspeak API with the given request.
	 *
	 * @param {NetspeakSearchRequest} request The request for the Netspeak API.
	 * @param {string} [baseUrl] The base URL of the Netspeak API.
	 * @returns {string} The search URL.
	 */
	getSearchUrl(request, baseUrl = this.baseUrl) {
		let url = baseUrl + "search?query=" + encodeURIComponent(request.query);

		// add the other options
		["format", "corpus", "callback", "maxfreq", "maxregexmatches", "nmax", "nmin", "topk"].forEach(name => {
			if (name in request) {
				url += "&" + name + "=" + encodeURIComponent(String(request[name]));
			}
		});

		return url;
	}

	/**
	 * Queries all available corpora from the Netspeak API.
	 *
	 * @returns {Promise<Readonly<CorporaInfo>>}
	 */
	queryCorpora() {
		// cached
		if (this.corpusCaching && this._cachedCorpus) {
			return this._cachedCorpus;
		}

		const result = jsonp(this.baseUrl + "corpus").then(json => {
			if ("default" in json && "corpora" in json) {
				// Netspeak 4
				return /** @type {CorporaInfo} */ (json);
			} else {
				// Netspeak 3

				/** @type {CorporaInfo} */
				const corpora = {
					default: undefined,
					corpora: []
				};

				for (let corpus of json) {
					// corpus = { key: String, name: String, isDefault: Boolean }

					if (corpus.isDefault && corpora.default === undefined)
						corpora.default = corpus.key;
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
	 *
	 * @readonly
	 * @type {string}
	 */
	static get defaultBaseUrl() {
		return "https://api.netspeak.org/netspeak4/";
	}

	/**
	 * The default corpus specified by the Netspeak API.
	 *
	 * @readonly
	 * @type {string}
	 */
	static get defaultCorpus() {
		return "web-en";
	}

	/**
	 * @returns {Netspeak}
	 */
	static getInstance() {
		return defaultNetspeakInstance = defaultNetspeakInstance || new Netspeak();
	}

}

let defaultNetspeakInstance;

export class Word {

	/**
	 * @param {string} text The text of the word.
	 * @param {number} [type=Word.Types.WORD] The type of operator the word matches.
	 */
	constructor(text, type = Word.Types.WORD) {
		this.text = text;
		this.type = type;
	}

	/**
	 * Returns the name of the given word type
	 * or undefined if the given type does not equal any known word type.
	 *
	 * @param {number} type The word type.
	 * @returns {string | undefined} The name.
	 */
	static nameOfType(type) {
		return nameOfTypeMap.get(type);
	}

}

/**
 * The different types of operators that matched a given word.
 *
 * @enum {number}
 */
Word.Types = {
	WORD: 0,
	Q_MARK: 1,
	ASTERISK: 2,
	DICT_SET: 3,
	ORDER_SET: 4,
	OPTION_SET: 5,
	PLUS: 6,
	REGEX: 7,
	ORDER_SET_REGEX: 8,
	OPTION_SET_REGEX: 9,
};

/** @type {Map<number, string>} */
const nameOfTypeMap = new Map();
Object.keys(Word.Types).forEach(name => {
	nameOfTypeMap.set(Word.Types[name], name);
});

/**
 * A phrase is phrase list of words that match phrase query.
 */
export class Phrase {

	/**
	 * Creates an instance of Phrase.
	 *
	 * @param {readonly Word[]} words The array of words creating the phrase.
	 * @param {number} frequency The absolute frequency of the phrase.
	 * @param {string} query The query this phase matches.
	 * @param {string} corpus The corpus from which the phrases where retrieved.
	 */
	constructor(words, frequency, query, corpus) {
		this.words = words;
		this.text = words.map(w => w.text || "").join(" ");
		this.frequency = frequency;
		this.query = query;
		this.corpus = corpus;
		this.id = this.corpus + "\n" + this.text;
	}

}

/**
 * A collection of phrases.
 *
 * A phrase is identified by its text.
 * If two different phrases with the same text are added, only the one added first will be kept.
 *
 * The collection will automatically be sorted by frequency.
 *
 * @extends {Iterable<Phrase>}
 */
export class PhraseCollection {

	/**
	 * Creates an instance of PhraseCollection.
	 */
	constructor() {
		/** @type {Phrase[]} */
		this._array = [];
		/** @type {Object<string, Phrase>} */
		this._map = {};
		this._modified = false;
	}

	/**
	 * Creates a new PhraseCollection from the given array.
	 *
	 * @param {Phrase[]} phrases The phrases of the collection.
	 * @returns {PhraseCollection} The collection.
	 */
	static from(phrases) {
		let c = new PhraseCollection();
		c.addAll(phrases);
		return c;
	}

	/**
	 * Returns the number of phrases in the collection.
	 *
	 * @readonly
	 * @type {number}
	 */
	get length() {
		return this._array.length;
	}

	/**
	 * Returns the maximum frequency of all phrases in the collection.
	 *
	 * This assumes that the frequencies of phrases in the collection are not modified outside of the collection.
	 * To invalided the cached total frequency, add or remove phrases or set the totalFrequency = undefined.
	 *
	 * @readonly
	 * @type {number}
	 */
	get maxFrequency() {
		let max = this.at(0);
		if (!max || typeof max.frequency !== "number") return NaN;
		return max.frequency;
	}

	/**
	 * Returns the total frequency of all phrases in the collection.
	 *
	 * This assumes that the frequencies of phrases in the collection are not modified outside of the collection.
	 * To invalided the cached total frequency, add or remove phrases or set the totalFrequency = undefined.
	 *
	 * @readonly
	 * @type {number}
	 */
	get totalFrequency() {
		if (this._total === undefined) {
			this._total = 0;

			const added = {};
			const isAdded = (words = []) => {
				const len = words.length;
				if (len == 0) return false;

				// check for all subsets of words
				for (let count = 1; count <= len; count++) {
					for (let offset = 0; offset <= len - count; offset++) {
						let sub = count == 1 ? words[offset] : words.slice(offset, offset + count).join(" ");
						if (sub in added) return true;
					}
				}

				// not added
				added[words.join(" ")] = true;
				return false;
			};

			for (let i = 0; i < this.length; i++) {
				const p = this.at(i);
				if (!isAdded(p.words.map(w => w.text || ""))) this._total += p.frequency;
			}
		}

		return this._total;
	}

	_getSorted() {
		if (this._modified) {
			this._array.sort((a, b) => b.frequency - a.frequency);
			this._modified = false;
		}
		return this._array;
	}

	_modify() {
		this._modified = true;
		this._total = undefined;
	}

	/**
	 * Adds the given phrases to the collection.
	 *
	 * @param {Phrase[]} phrases The phrases.
	 * @returns {number} The number of phrases add to the collection.
	 */
	add(...phrases) {
		return this.addAll(phrases);
	}

	/**
	 * Adds the given phrases to the collection.
	 *
	 * @param {Iterable<Phrase>} phrases The phrases.
	 * @returns {number} The number of phrases add to the collection.
	 */
	addAll(phrases) {
		let added = 0;
		for (const phrase of phrases) {
			const text = phrase.text;
			if (!(text in this._map)) {
				this._map[text] = phrase;
				this._array.push(phrase);
				this._modify();
				added++;
			}
		}
		return added;
	}

	/**
	 * Removes the given phrases from the collection.
	 *
	 * @param {(Phrase | string)[]} phrases The phrases or text of the phrases to remove.
	 * @returns {Phrase[]} The phrases removed.
	 */
	remove(...phrases) {
		const removed = [];
		const texts = {};

		for (const phrase of phrases) {
			if (phrase instanceof Phrase && (phrase.text in this._map)) {
				delete this._map[phrase.text];
				texts[phrase.text] = true;
				removed.push(phrase);
			} else if (typeof phrase === "string" && phrase in this._map) {
				removed.push(this._map[phrase]);
				texts[phrase] = true;
				delete this._map[phrase];
			}
		}

		let offset = 0;
		for (let i = 0; i < this._array.length; i++) {
			let p = this._array[i];
			if (p.text in texts) {
				offset++;
				continue;
			}
			this._array[i - offset] = this._array[i];
		}
		this._array.splice(this._array.length - offset);

		this._modify();

		return removed;
	}

	/**
	 * Returns the phrase with the given text of undefined if there is no phrase with the given text in the collection.
	 *
	 * @param {string} text The text.
	 * @returns {Phrase} The phrase of undefined.
	 */
	get(text) {
		return this._map[text];
	}

	/**
	 * Returns the phrase at the given index.
	 *
	 * @param {number} index The index.
	 * @returns {Phrase} The phrase of undefined.
	 */
	at(index) {
		return this._getSorted()[index];
	}

	/**
	 * Returns whether the given phrase or text of a phrase is in the collection.
	 *
	 * @param {Phrase | string} phrase
	 * @returns {boolean} Whether the given phrase or text of a phrase is in the collection.
	 */
	includes(phrase) {
		if (typeof phrase === "string") {
			if (phrase in this._map) return true;
		} else {
			if (phrase && phrase.text in this._map) return true;
		}
		return false;
	}

	/**
	 * Performs a specific action for each element of the collection.
	 *
	 * @param {(phrase: Phrase, index: number, collection: PhraseCollection) => void} callbackFn The callback function.
	 * @param {any} [thisArg=undefined] The this argument of the callback function.
	 */
	forEach(callbackFn, thisArg = undefined) {
		this._getSorted().forEach((p, i) => callbackFn.call(thisArg, p, i, this));
	}

	/**
	 * Returns an array copy of the collection.
	 *
	 * @returns {Phrase[]} The array copy.
	 */
	toArray() {
		return this._getSorted().slice(0);
	}

	[Symbol.iterator]() {
		return this.toArray()[Symbol.iterator]();
	}

}
