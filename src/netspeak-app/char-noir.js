import { LRUCache } from "./lru-cache.js";

/**
 * @typedef CharNoirRequest
 * @property {string} query
 * @property {string[]} [index] list of indices to search
 * @property {number} from result pagination begin
 * @property {number} size number of results per page
 * @property {boolean} [explain=false] return additional scoring information
 * @property {boolean} [pretty=false]
 */

/**
 * @typedef CharNoirSearchOptions
 * @property {string} [baseUrl=this.defaultBaseUrl] The base URL of the ChatNoir API.
 * @property {boolean} [caching=true] Whether the queried corpora will be cached.
 */

/**
 * @typedef ChatNoirSimpleSearchResponse
 * @property {object} meta global result meta information
 * @property {number} meta.query_time query time in milliseconds
 * @property {number} meta.total_results number of total hits
 * @property {string[]} meta.indices list of indices that were searched
 * @property {ChatNoirSimpleSearchResponseItem[]} results list of search results
 */

/**
 * @typedef ChatNoirSimpleSearchResponseItem
 * @property {number} score ranking score of this result
 * @property {string} uuid Webis UUID of this document
 * @property {string} index index the document was retrieved from
 * @property {string | null} trec_id TREC ID of the result if available (null otherwise)
 * @property {string} target_hostname web host this document was crawled from
 * @property {string} target_uri full web URI
 * @property {number | null} page_rank page rank of this document if available (null otherwise)
 * @property {number | null} spam_rank spam rank of this document if available (null otherwise)
 * @property {string} title document title with highlights
 * @property {string} snippet document body snippet with highlights
 * @property {string | null} explanation additional scoring information if explain was set to true
 */

/**
 * The base class of the ChatNoir API.
 */
export class ChatNoir {

	/**
	 * Creates an instance of ChatNoir.
	 *
	 * @param {string} apiKey The default ChatNoir API key.
	 */
	constructor(apiKey) {
		this.apiKey = apiKey;
		this.baseUrl = ChatNoir.defaultBaseUrl;
		this.defaultIndex = ChatNoir.defaultIndexes;
		/** @type {LRUCache<Promise<Response>>} */
		this._cache = new LRUCache();
		this.caching = true;
	}

	/**
	 * The simple search operation of the ChatNoir API.
	 *
	 * @param {CharNoirRequest} request The request details passed to the API.
	 * @returns {Promise<ChatNoirSimpleSearchResponse>}
	 */
	search(request) {
		try {
			if (!request) throw new Error("request cannot be " + request);

			// copy request and add defaults
			const req = Object.assign({}, request);
			this._addDefaults(req);

			// construct URL
			let url = this.baseUrl;
			url += "_search?q=" + encodeURIComponent(req.query);
			url += "&apikey=" + encodeURIComponent(this.apiKey);
			["index", "from", "size", "explain", "pretty"].forEach(p => {
				if (!(p in req)) return;
				let v = req[p];

				if (v === true) {
					url += "&" + p;
				} else if (v === false) {
					// noop
				} else {
					url += "&" + p + "=" + encodeURIComponent(String(v));
				}
			});

			// fetch data
			let fetched;
			if (this.caching && this._cache.contains(url)) {
				// console.log("cache hit");
				fetched = this._cache.get(url);
			} else {
				fetched = fetch(url);
				if (this.caching) {
					this._cache.add(url, fetched);
				}
			}

			return fetched.then(res => res.json());
		} catch (error) {
			return Promise.reject(error);
		}
	}

	/**
	 * Adds the default values to the given request.
	 *
	 * @param {CharNoirRequest} request The request.
	 * @returns {Object} The request.
	 */
	_addDefaults(request) {
		if (!request.index) request.index = this.defaultIndex;
	}

	/**
	 * The default base URL of the CharNoir API.
	 *
	 * @readonly
	 * @type {string}
	 */
	static get defaultBaseUrl() {
		return "https://webis16.medien.uni-weimar.de/chatnoir2/api/v1/";
	}

	/**
	 * The default indexes of the CharNoir API.
	 *
	 * @readonly
	 * @type {string[]}
	 */
	static get defaultIndexes() {
		return ["cw09", "cw12", "cc1511"];
	}

}
