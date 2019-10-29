import { LRUCache } from "./lru-cache.js";

/**
 * @typedef SnippetsRequest
 * @property {string} query
 * @property {string[]} [index] list of indices to search
 * @property {number} from result pagination begin
 * @property {number} size number of results per page
 */

/**
 * @typedef CharNoirSearchOptions
 * @property {string} [baseUrl=this.defaultBaseUrl] The base URL of the Snippets API.
 * @property {boolean} [caching=true] Whether the queried corpora will be cached.
 */

/**
 * @typedef SnippetsResponse
 * @property {object} meta global result meta information
 * @property {number} meta.query_time query time in milliseconds
 * @property {number} meta.total_results number of total hits
 * @property {string[]} meta.indices list of indices that were searched
 * @property {SnippetsResponseItem[]} results list of search results
 */

/**
 * @typedef SnippetsResponseItem
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
 * The base class of the snippets API.
 */
export class Snippets {

	constructor() {
		this.baseUrl = Snippets.defaultBaseUrl;
		/** @type {LRUCache<Promise<Response>>} */
		this._cache = new LRUCache();
		this.caching = true;
	}

	/**
	 * The simple search operation of the Snippets API.
	 *
	 * @param {SnippetsRequest} request The request details passed to the API.
	 * @returns {Promise<SnippetsResponse>}
	 */
	search(request) {
		try {
			if (!request) throw new Error("request cannot be " + request);

			// copy request and add defaults
			const req = Object.assign({}, request);

			// construct URL
			let url = this.baseUrl;
			url += "_search?query=" + encodeURIComponent(req.query);
			["index", "from", "size"].forEach(p => {
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
				// cache hit
				fetched = this._cache.get(url);
			} else {
				fetched = fetch(url).then(res => res.json());
				if (this.caching) {
					this._cache.add(url, fetched);
				}
			}

			return fetched;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	/**
	 * The default base URL of the snippets API.
	 *
	 * @readonly
	 * @type {string}
	 */
	static get defaultBaseUrl() {
		return "https://snippets.netspeak.org/";
	}

	/**
	 * @returns {Snippets}
	 */
	static getInstance() {
		return defaultSnippetsInstance = defaultSnippetsInstance || new Snippets();
	}

}

let defaultSnippetsInstance;
