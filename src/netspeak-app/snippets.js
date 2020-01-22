import { textContent, normalizeSpaces } from "./util.js";


/**
 * @typedef Snippet
 * @property {string} text The clean text content of the snippet.
 * @property {string} url The source of the snippet.
 *
 * @callback SnippetSupplier
 * A generic supplier of snippets.
 *
 * If `false` is returned, the supplier will not supply any additional items.
 * @returns {Promise<Snippet[] | false>}
 *
 * @typedef SnippetBackend
 * @property {(phrase: string, count: number) => SnippetSupplier} getSupplier
 */

export class Snippets {

	/**
	 * @typedef SnippetBackendConfig
	 * @property {SnippetBackend} backend
	 * @property {(count: number) => number} [getCount]
	 * @property {number} [parallel=1] The number of parallel suppliers for the given backend.
	 * @property {number} [timeout] The timeout after which a supplier from the backend will be declared dead.
	 */
	constructor() {
		/** @type {SnippetBackendConfig[]} */
		this.backends = [];
		this.defaultTimeout = 5000;
	}

	/**
	 *
	 * @param {string} phrase
	 * @param {number} [count]
	 * @returns {SnippetSupplier}
	 */
	getSupplier(phrase, count = 6) {
		const suppliers = this._createSuppliers(phrase, count);
		const filter = this._createSnippetFilter(phrase);

		/** Whether all suppliers are empty */
		let empty = false;
		/** @type {Snippet[]} */
		let buffer = [];
		/**
		 * @type {ResolveFn[]}
		 *
		 * @typedef {(value: Snippet[] | false) => void} ResolveFn
		 */
		const pendingResolves = [];


		/**
		 * @param {ResolveFn} resolve
		 */
		function resolveWhenEmpty(resolve) {
			if (buffer.length > count) {
				resolve(buffer.splice(0, count));
			} else if (buffer.length) {
				const b = buffer;
				buffer = [];
				resolve(b);
			} else {
				resolve(false);
			}
		}

		let waitingForSuppliers = false;
		function callSuppliers() {
			if (waitingForSuppliers) return;
			waitingForSuppliers = true;

			/** The total number of snippets returned by the suppliers this round. */
			let nonEmptySuppliers = 0;

			Promise.all(suppliers.map(supplier => {
				return supplier().then(snippets => {
					if (snippets) {
						// After each supplier resolves, we add all of its snippets to the buffer and check if we can
						// resolve some pending resolve functions.

						nonEmptySuppliers++;
						snippets.forEach(s => {
							if (filter(s)) {
								buffer.push(s);
							}
						});

						while (buffer.length >= count && pendingResolves.length) {
							const resolve = pendingResolves.splice(0, 1)[0];
							resolve(buffer.splice(0, count));
						}
					}
				});
			})).then(() => {
				waitingForSuppliers = false;

				if (nonEmptySuppliers === 0) {
					// the suppliers are all empty
					empty = true;
					// resolve all pending resolve functions and clear the array
					pendingResolves.forEach(resolve => resolveWhenEmpty(resolve));
					pendingResolves.length = 0;
				} else {
					// there are still some resolve functions left, so we start again
					if (pendingResolves.length) callSuppliers();
				}
			});
		}

		return () => {
			return new Promise(resolve => {
				if (buffer.length >= count) {
					// there is enough in the buffer
					resolve(buffer.splice(0, count));
				} else if (empty) {
					resolveWhenEmpty(resolve);
				} else {
					pendingResolves.push(resolve);
					callSuppliers();
				}
			});
		};
	}

	/**
	 * Creates a list of suppliers from the current backend config.
	 *
	 * @param {string} phrase
	 * @param {number} count
	 */
	_createSuppliers(phrase, count) {
		/** @type {SnippetSupplier[]} */
		const suppliers = [];

		this.backends.forEach(config => {/** @type {number | undefined} */
			let supplierCount = undefined;
			if (config.getCount) {
				supplierCount = config.getCount(count);
			} else {
				supplierCount = count;
			}

			let supplier = config.backend.getSupplier(phrase, supplierCount);
			supplier = this._makeTimeoutSupplier(supplier, config.timeout || this.defaultTimeout);
			supplier = this._makeNonRejectingSupplier(supplier);

			for (let i = config.parallel || 1; i > 0; i--) {
				suppliers.push(supplier);
			}
		});

		return suppliers;
	}

	/**
	 * Adds a timeout to the given supplier.
	 *
	 * If the given supplier takes longer than the specified timeout, it's assumed that the supplier could not find
	 * more snippets, so an empty array will be returned.
	 *
	 * @param {SnippetSupplier} supplier
	 * @param {number} timeout
	 * @returns {SnippetSupplier}
	 */
	_makeTimeoutSupplier(supplier, timeout) {
		if (timeout === Infinity) return supplier;

		let dead = false;

		return () => {
			if (dead) {
				return Promise.resolve(false);
			}

			/** @type {Promise<false>} */
			const timeoutPromise = new Promise(resolve => {
				setTimeout(() => {
					dead = true;
					resolve(false);
				}, timeout);
			});

			return Promise.race([supplier(), timeoutPromise]);
		};
	}

	/**
	 * Returns a new supplier based on the given supplier which will return `false` instead of rejecting.
	 *
	 * @param {SnippetSupplier} supplier
	 * @returns {SnippetSupplier}
	 */
	_makeNonRejectingSupplier(supplier) {
		return () => supplier().catch(e => {
			console.log(e);
			return false;
		});
	}

	/**
	 *
	 * @param {string} phrase
	 * @returns {(snippet: Snippet) => boolean}
	 */
	_createSnippetFilter(phrase) {
		phrase = normalizeSpaces(phrase.toLowerCase());

		const pastExamples = new Set([""]);

		return snippet => {
			const text = snippet.text.toLowerCase();

			// The text has to contain the phrase.
			if (text.indexOf(phrase) === -1) return false;

			// The basic idea behind this id is that most duplicate examples are equal character for character,
			// so a simple (and fast) hash lookup is sufficient.
			// To also filter duplicates which are technically different but don't look very different to
			// humans, some additional transformation are performed.
			const id = text.replace(/\d+/g, "0");

			if (pastExamples.has(id)) return false;
			pastExamples.add(id);
			return true;
		};
	}

}

/**
 * A snippet backend for Netspeak's internal snippet API based on ChatNoir.
 *
 * @see https://www.chatnoir.eu/doc/api/
 */
export class NetspeakSnippetsBackend {

	/**
	 * @param {string} phrase
	 * @param {number} count
	 * @returns {SnippetSupplier}
	 */
	getSupplier(phrase, count) {
		phrase = normalizeSpaces(phrase);

		let internalPage = 0;

		// whether the snippet API doesn't have any more examples
		let noFurtherExamples = false;

		return () => {
			if (noFurtherExamples) {
				return Promise.resolve(false);
			}

			/**@type {NetspeakSnippetsRequest} */
			const request = {
				query: phrase,
				size: count,
				from: count * internalPage++
			};

			return this.search(request).then(res => {
				if (res.results.length === 0) {
					noFurtherExamples = true;
					return false;
				}

				/** @type {Snippet[]} */
				const snippets = [];

				res.results.forEach(({ snippet, target_uri }) => {
					snippets.push({ text: normalizeSpaces(textContent(snippet)), url: target_uri });
				});

				return snippets;
			});
		};
	}

	/**
	 * The simple search operation of the Snippets API.
	 *
	 * @param {NetspeakSnippetsRequest} request The request details passed to the API.
	 * @returns {Promise<NetspeakSnippetsResponse>}
	 *
	 * @typedef NetspeakSnippetsRequest
	 * @property {string} query
	 * @property {string[]} [index] list of indices to search
	 * @property {number} from result pagination begin
	 * @property {number} size number of results per page
	 *
	 * @typedef NetspeakSnippetsResponse
	 * @property {object} meta global result meta information
	 * @property {number} meta.query_time query time in milliseconds
	 * @property {number} meta.total_results number of total hits
	 * @property {string[]} meta.indices list of indices that were searched
	 * @property {NetspeakSnippetsResponseItem[]} results list of search results
	 *
	 * @typedef NetspeakSnippetsResponseItem
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
	search(request) {
		try {
			if (!request) throw new Error("request cannot be " + request);

			// copy request and add defaults
			const req = Object.assign({}, request);

			// construct URL
			let url = "https://snippets.netspeak.org/";
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
			return fetch(url).then(res => res.json());
		} catch (error) {
			return Promise.reject(error);
		}
	}

}

/**
 * A snippet backend for Google Book's public search API.
 *
 * @see https://developers.google.com/books/docs/v1/using
 */
export class GoogleBooksSnippetBackend {

	/**
	 * @param {string} phrase
	 * @param {number} count
	 * @returns {SnippetSupplier}
	 */
	getSupplier(phrase, count) {
		// The API only supports up to 40 results
		// https://developers.google.com/books/docs/v1/using#maxResults
		const maxResults = Math.min(count, 40);
		const q = encodeURIComponent(`"${normalizeSpaces(phrase)}"`);

		let startIndex = 0;
		let done = false;

		return () => {
			if (done) {
				return Promise.resolve(false);
			}

			const currentIndex = startIndex;
			startIndex += maxResults;

			// Note: The following type definitions are incomplete
			/**
			 * @type {Promise<ErrorJson | GoogleBooksJson>}
			 *
			 * @typedef ErrorJson
			 * @property {ErrorJsonObject} error
			 * @typedef ErrorJsonObject
			 * @property {number} code
			 * @property {string} message
			 *
			 * @typedef GoogleBooksJson
			 * @property {string} kind
			 * @property {number} totalItems
			 * @property {GoogleBooksJsonItem[] | undefined} items
			 * @typedef GoogleBooksJsonItem
			 * @property {string} kind
			 * @property {string} id
			 * @property {string} etag
			 * @property {string} selfLink
			 * @property {GoogleBooksJsonItemVolumeInfo} volumeInfo
			 * @property {GoogleBooksJsonItemSearchInfo} searchInfo
			 * @typedef GoogleBooksJsonItemVolumeInfo
			 * @property {string} title
			 * @property {string[]} authors
			 * @property {string} publishedDate
			 * @property {string | undefined} [description]
			 * @property {string} language
			 * @property {string} previewLink
			 * @property {string} infoLink
			 * @property {string} canonicalVolumeLink
			 * @typedef GoogleBooksJsonItemSearchInfo
			 * @property {string} textSnippet
			 */
			const promise = fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&startIndex=${currentIndex}&maxResults=${maxResults}`).then(res => res.json());

			return promise.then(json => {
				if ("error" in json) {
					throw new Error(json.error.message);
				}

				const items = json.items;
				if (!items) {
					done = true;
					return false;
				}

				/** @type {Snippet[]} */
				const snippets = [];

				items.forEach(item => {
					const url = item.volumeInfo.previewLink;

					// we use 3 parts of every result
					if (item.volumeInfo) {
						if (item.volumeInfo.title)
							snippets.push({ text: normalizeSpaces(textContent(item.volumeInfo.title)), url });
						if (item.volumeInfo.description)
							snippets.push({ text: normalizeSpaces(textContent(item.volumeInfo.description)), url });
					}
					if (item.searchInfo && item.searchInfo.textSnippet)
						snippets.push({ text: normalizeSpaces(textContent(item.searchInfo.textSnippet)), url });
				});

				return snippets;
			});
		};
	}

}


export const DEFAULT_SNIPPETS = new Snippets();
DEFAULT_SNIPPETS.backends.push(
	{
		backend: new NetspeakSnippetsBackend(),
		parallel: 3,
		getCount: () => 33
	},
	{
		backend: new GoogleBooksSnippetBackend(),
		parallel: 2,
		getCount: () => 20
	}
);
