import { textContent, normalizeSpaces, constructQueryParams } from "./util";

export interface Snippet {
	/**
	 * The clean text content of the snippet.
	 */
	readonly text: string;
	/**
	 * URLs which link to the source of the snippet.
	 * It's possible to declare more than one URL to provide mirror links and alternative sources.
	 */
	readonly urls: Record<string, string>;
}

/**
 * A generic supplier of snippets.
 *
 * If `false` is returned, the supplier will not supply any additional items.
 */
export type SnippetSupplier = () => Promise<Snippet[] | false>;

export interface SnippetBackend {
	getSupplier: (phrase: string, count: number) => SnippetSupplier;
}

type ResolveFn = (value: Snippet[] | false) => void;

/**
 * Creates a new snippet supplier which returns snippets from all given suppliers favouring faster suppliers.
 *
 * @param suppliers
 * @returns
 */
function unfairSupplierCombination(suppliers: SnippetSupplier[]): SnippetSupplier {
	suppliers = [...suppliers];
	const pendingSuppliers: boolean[] = [];
	const pendingResolves: ResolveFn[] = [];
	const cached: Snippet[][] = [];

	function resolvePendingResolves(): void {
		if (suppliers.length === 0) {
			pendingResolves.forEach(resolve => {
				const fromCache = cached.pop();
				if (fromCache) {
					resolve(fromCache);
				} else {
					resolve(false);
				}
			});
			pendingResolves.length = 0;
		} else {
			let fromCache;
			while (pendingResolves.length && (fromCache = cached.pop())) {
				const resolve = pendingResolves.splice(0, 1)[0];
				resolve(fromCache);
			}
			if (pendingResolves.length) {
				callSuppliers();
			}
		}
	}

	function callSuppliers(): void {
		for (let i = 0; i < suppliers.length; i++) {
			const pending = pendingSuppliers[i];
			if (!pending) {
				pendingSuppliers[i] = true;
				const supplier = suppliers[i];

				supplier()
					.then(
						snippets => {
							if (snippets) {
								cached.push(snippets);
							}
							return !snippets;
						},
						e => {
							console.log(e);
							return true;
						}
					)
					.then(empty => {
						const index = suppliers.indexOf(supplier);
						if (empty) {
							suppliers.splice(index, 1);
							pendingSuppliers.splice(index, 1);
						} else {
							pendingSuppliers[index] = false;
						}

						resolvePendingResolves();
					});
			}
		}
	}

	return () => {
		return new Promise<Snippet[] | false>(resolve => {
			pendingResolves.push(resolve);
			resolvePendingResolves();
		});
	};
}

/**
 * Creates a new snippet supplier which will always return the exact amount of snippets until the given supplier runs
 * out of snippets.
 *
 * @param supplier
 * @param count
 * @returns
 */
function exactSupplier(supplier: SnippetSupplier, count: number): SnippetSupplier {
	/** Whether all suppliers are empty */
	let empty = false;
	const buffer: Snippet[] = [];
	const pendingResolves: ResolveFn[] = [];
	let waitingForSupplier = false;

	function resolvePendingResolves(): void {
		if (empty) {
			pendingResolves.forEach(resolve => {
				if (buffer.length) {
					resolve(buffer.splice(0, Math.min(count, buffer.length)));
				} else {
					resolve(false);
				}
			});
			pendingResolves.length = 0;
		} else {
			while (buffer.length >= count && pendingResolves.length) {
				const resolve = pendingResolves.splice(0, 1)[0];
				resolve(buffer.splice(0, count));
			}
			if (pendingResolves.length) {
				callSuppliers();
			}
		}
	}

	function callSuppliers(): void {
		if (waitingForSupplier) return;
		waitingForSupplier = true;

		supplier()
			.then(
				snippets => {
					waitingForSupplier = false;

					if (snippets) {
						snippets.forEach(s => buffer.push(s));
					} else {
						empty = true;
					}
				},
				e => {
					console.error(e);

					waitingForSupplier = false;
					empty = true;
				}
			)
			.then(() => {
				resolvePendingResolves();
			});
	}

	return () => {
		return new Promise<Snippet[] | false>(resolve => {
			pendingResolves.push(resolve);
			resolvePendingResolves();
		});
	};
}

/**
 * Adds a timeout to the given supplier.
 *
 * If the given supplier takes longer than the specified timeout, it's assumed that the supplier could not find
 * more snippets, so an empty array will be returned.
 *
 * @param supplier
 * @param timeout
 * @returns
 */
function timeoutSupplier(supplier: SnippetSupplier, timeout: number): SnippetSupplier {
	if (timeout === Infinity) return supplier;

	let dead = false;

	return () => {
		if (dead) {
			return Promise.resolve(false);
		}

		let raceIsOver = false;
		const timeoutPromise = new Promise<false>(resolve => {
			setTimeout(() => {
				if (!raceIsOver) {
					dead = true;
					resolve(false);
				}
			}, timeout);
		});

		return Promise.race([supplier(), timeoutPromise]).then(
			x => {
				raceIsOver = true;
				return x;
			},
			x => {
				raceIsOver = true;
				throw x;
			}
		);
	};
}

/**
 * Returns a new supplier based on the given supplier which will return `false` instead of rejecting.
 */
function nonRejectingSupplier(supplier: SnippetSupplier): SnippetSupplier {
	let rejected = false;
	return () => {
		if (rejected) return Promise.resolve(false);
		return supplier().catch(e => {
			console.log(e);
			rejected = true;
			return false;
		});
	};
}

function filterSupplier(supplier: SnippetSupplier, filterFn: (snippet: Snippet) => boolean): SnippetSupplier {
	return () => {
		return supplier().then(snippets => {
			if (snippets) {
				return snippets.filter(filterFn);
			}
			return false;
		});
	};
}
function mapSupplier(supplier: SnippetSupplier, mapFn: (snippet: Snippet) => Snippet): SnippetSupplier {
	return () => {
		return supplier().then(snippets => {
			if (snippets) {
				return snippets.map(mapFn);
			}
			return false;
		});
	};
}

const phraseReCache = new Map<string, RegExp>();
export function getPhraseRegex(phrase: string): RegExp {
	phrase = normalizeSpaces(phrase);
	let value = phraseReCache.get(phrase);
	if (value === undefined) {
		let source = phrase.replace(/[\\/(){}[\]|?+*^$.]/g, "\\$&").replace(/\s+/g, "\\s*");
		if (/^\w/.test(phrase)) {
			source = "\\b" + source;
		}
		if (/\w$/.test(phrase)) {
			source = source + "\\b";
		}
		value = RegExp(source, "i");
		phraseReCache.set(phrase, value);
	}
	return value;
}

export interface SnippetBackendConfig {
	backend: SnippetBackend;
	getCount?: (count: number) => number;
	/** The number of parallel suppliers for the given backend. */
	parallel?: number;
	/** The timeout after which a supplier from the backend will be declared dead. */
	timeout?: number;
}
export class Snippets {
	backends: SnippetBackendConfig[] = [];
	defaultTimeout = 5000;

	getSupplier(phrase: string, count = 6): SnippetSupplier {
		let supplier = unfairSupplierCombination(this._createSuppliers(phrase, count));
		supplier = mapSupplier(supplier, this._removeUrlsInText);
		supplier = filterSupplier(supplier, this._createRelevantSnippetFilter(phrase));

		return exactSupplier(supplier, count);
	}

	/**
	 * Creates a list of suppliers from the current backend config.
	 *
	 * @param phrase
	 * @param count
	 */
	private _createSuppliers(phrase: string, count: number): SnippetSupplier[] {
		const suppliers: SnippetSupplier[] = [];

		this.backends.forEach(config => {
			let supplierCount: number | undefined = undefined;
			if (config.getCount) {
				supplierCount = config.getCount(count);
			} else {
				supplierCount = count;
			}

			let supplier = config.backend.getSupplier(phrase, supplierCount);
			supplier = timeoutSupplier(supplier, config.timeout || this.defaultTimeout);
			supplier = nonRejectingSupplier(supplier);

			let parallel = config.parallel;
			if (parallel === undefined) parallel = 1;
			for (let i = parallel; i > 0; i--) {
				suppliers.push(supplier);
			}
		});

		return suppliers;
	}

	private _createRelevantSnippetFilter(phrase: string): (snippet: Snippet) => boolean {
		const testRe = getPhraseRegex(phrase);

		const pastExamples = new Set([""]);

		return snippet => {
			const text = snippet.text.toLowerCase();

			// The text has to contain the phrase.
			if (!testRe.test(text)) return false;

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

	private _removeUrlsInText(snippet: Snippet): Snippet {
		const text = snippet.text.replace(URL_REGEX, "[…]");

		return { text, urls: snippet.urls };
	}
}

const URL_REGEX = /(?:https?\s*:\s*\/\s*\/\s*(?:www\s*\.\s*)?|www\s*\.\s*)(?:\w|\s*[-@:%.+~#=]\s*){1,256}\s*\.\s*[a-z0-9()]{1,6}\b[-\w()@:%+.~#/?&=]*/gi;

interface NetspeakSnippetsRequest {
	query: string;
	/** list of indices to search */
	index?: string[];
	/** result pagination begin */
	from: number;
	/** number of results per page */
	size: number;
}
interface NetspeakSnippetsResponse {
	/** global result meta information */
	meta: {
		/** query time in milliseconds */
		query_time: number;
		/** number of total hits */
		total_results: number;
		/** list of indices that were searched */
		indices: string[];
	};
	/** list of search results */
	results: NetspeakSnippetsResponseItem[];
}
interface NetspeakSnippetsResponseItem {
	/** ranking score of this result */
	score: number;
	/** Webis UUID of this document */
	uuid: string;
	/** index the document was retrieved from */
	index: string;
	/** TREC ID of the result if available (null otherwise) */
	trec_id: string | null;
	/** web host this document was crawled from */
	target_hostname: string;
	/** full web URI */
	target_uri: string;
	/** page rank of this document if available (null otherwise) */
	page_rank: number | null;
	/** spam rank of this document if available (null otherwise) */
	spam_rank: number | null;
	/** document title with highlights */
	title: string;
	/** document body snippet with highlights */
	snippet: string;
	/** additional scoring information if explain was set to true */
	explanation: string | null;
}

/**
 * A snippet backend for Netspeak's internal snippet API based on ChatNoir.
 *
 * @see https://www.chatnoir.eu/doc/api/
 */
export class NetspeakSnippetsBackend implements SnippetBackend {
	getSupplier(phrase: string, count: number): SnippetSupplier {
		phrase = normalizeSpaces(phrase);

		let internalPage = 0;

		// whether the snippet API doesn't have any more examples
		let noFurtherExamples = false;

		return () => {
			if (noFurtherExamples) {
				return Promise.resolve(false);
			}

			const request: NetspeakSnippetsRequest = {
				query: phrase,
				size: count,
				from: count * internalPage++,
			};

			return this.search(request).then(res => {
				if (res.results.length === 0) {
					noFurtherExamples = true;
					return false;
				}

				const snippets: Snippet[] = [];

				res.results.forEach(({ snippet, uuid, index }) => {
					const urls = {
						ChatNoir: `https://www.chatnoir.eu/cache?uuid=${uuid}&index=${encodeURIComponent(index)}&plain`,
					};
					snippets.push({ text: normalizeSpaces(textContent(snippet)), urls });
				});

				return snippets;
			});
		};
	}

	/**
	 * The simple search operation of the Snippets API.
	 *
	 * @param request The request details passed to the API.
	 * @returns
	 */
	search(request: NetspeakSnippetsRequest): Promise<NetspeakSnippetsResponse> {
		try {
			if (!request) throw new Error("request cannot be " + request);

			// construct URL
			const url = "https://snippets.netspeak.org/_search" + constructQueryParams(request);

			// fetch data
			return fetch(url).then(res => res.json());
		} catch (error) {
			return Promise.reject(error);
		}
	}
}

interface ErrorJson {
	error: ErrorJsonObject;
}
interface ErrorJsonObject {
	code: number;
	message: string;
}

interface GoogleBooksJson {
	kind: string;
	totalItems: number;
	items: GoogleBooksJsonItem[] | undefined;
}
interface GoogleBooksJsonItem {
	kind: string;
	id: string;
	etag: string;
	selfLink: string;
	volumeInfo: GoogleBooksJsonItemVolumeInfo;
	searchInfo: GoogleBooksJsonItemSearchInfo;
}
interface GoogleBooksJsonItemVolumeInfo {
	title: string;
	authors: string[];
	publishedDate: string;
	description?: string | undefined;
	language: string;
	previewLink: string;
	infoLink: string;
	canonicalVolumeLink: string;
}
interface GoogleBooksJsonItemSearchInfo {
	textSnippet: string;
}
/**
 * A snippet backend for Google Book's public search API.
 *
 * @see https://developers.google.com/books/docs/v1/using
 */
export class GoogleBooksSnippetBackend implements SnippetBackend {
	getSupplier(phrase: string, count: number): SnippetSupplier {
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
			const promise: Promise<ErrorJson | GoogleBooksJson> = fetch(
				`https://www.googleapis.com/books/v1/volumes?q=${q}&startIndex=${currentIndex}&maxResults=${maxResults}`
			).then(res => res.json());

			return promise.then(json => {
				if ("error" in json) {
					throw new Error(json.error.message);
				}

				const items = json.items;
				if (!items) {
					done = true;
					return false;
				}

				const snippets: Snippet[] = [];

				items.forEach(item => {
					const urls = { "Google Books": item.volumeInfo.previewLink };

					// we use 3 parts of every result
					if (item.volumeInfo) {
						if (item.volumeInfo.title)
							snippets.push({
								text: normalizeSpaces(textContent(item.volumeInfo.title)),
								urls,
							});
						if (item.volumeInfo.description)
							snippets.push({
								text: normalizeSpaces(textContent(item.volumeInfo.description)),
								urls,
							});
					}
					if (item.searchInfo && item.searchInfo.textSnippet)
						snippets.push({
							text: normalizeSpaces(textContent(item.searchInfo.textSnippet)),
							urls,
						});
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
		getCount: () => 33,
	},
	{
		backend: new GoogleBooksSnippetBackend(),
		parallel: 1,
		getCount: () => 20,
	}
);
