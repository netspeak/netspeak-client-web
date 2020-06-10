import { html, NetspeakElement, registerElement } from "./netspeak-element.js";
import { Netspeak, PhraseCollection, Word, normalizeQuery, NetspeakInvalidQueryError, NetspeakError } from "./netspeak.js";
import { appendNewElements, createNextFrameInvoker, createClipboardButton, encode } from "./util.js";
import { NetspeakNavigator } from "./netspeak-navigator.js";
import "./netspeak-example-queries.js";
import { DEFAULT_SNIPPETS } from "./snippets.js";
import { NetworkError } from "./jsonp.js";


/**
 * @typedef QueryPhrasesOptions
 * @property {"append" | "overwrite"} [options.appendMode="overwrite"] How the queried phrases will be integrated into the existing ones. "append": All of the new phrases will be added. "overwrite": All already queried phrases will be removed and the newly queried will be added.
 * @property {number} [options.topk=this.initialLimit] The maximum number of phrases queried.
 * @property {number} [options.maxfreq=2**64-1] The maximum frequency a phrase is allowed to have.
 * @property {boolean} [options.focusInput=false] Whether the input box will be focused after the phrases were displayed.
 * @property {import("./netspeak.js").NetspeakSearchOptions} [options.searchOptions={}] The search option passed to Netspeak.search.
 */


const sharedStyles = html`
	<style>

		table,
		tbody,
		tr,
		td {
			margin: 0;
			padding: 0;
			border-spacing: 0;
		}

		button {
			background-color: transparent;
			border: none;
			margin: 0;
			padding: 0;
		}

		:not(.btn-img)>.btn-img {
			background-image: none !important;
			background-color: transparent;
			border: none;
			cursor: pointer;
			display: inline-block;
			margin: 0;
			opacity: .5;
			padding: var(--icon-padding, 4px);
			position: relative;
		}

		:not(.btn-img)>.btn-img:hover,
		:not(.btn-img)>.btn-img.selected {
			opacity: .8;
		}

		.btn-img>span.btn-img {
			background-position: center;
			background-repeat: no-repeat;
			background-size: contain;
			display: inline-block;
			margin: 0;
			padding: 0;
			width: var(--icon-size, 16px);
			height: var(--icon-size, 16px);
		}

		.btn-img>span.btn-text {
			display: inline-block;
			line-height: var(--icon-size, 16px);
			padding: 0;
			vertical-align: top;
		}

	</style>
`;

/**
 * The Netspeak search bar can query and display phrases queried using the Netspeak API.
 */
export class NetspeakSearchBar extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-search-bar'; }
	static get properties() {
		return {

			query: {
				type: String,
				value: "",
				observer: '_queryChanged',
			},

			corpus: {
				type: String,
				value: Netspeak.defaultCorpus,
				notify: true,
			},

			initialLimit: {
				type: Number,
				value: 40,
			},

			readonly: {
				type: Boolean,
				value: false,
			},

			slowSearch: {
				type: Boolean,
				value: false,
			},

			initialExamplesLimit: {
				type: Number,
				value: 6,
			},

			historyHidden: {
				type: Boolean,
				value: false,
				notify: true,
				observer: '_historyHiddenChanged',
			},

			infoVisibleByDefault: {
				type: Boolean,
				value: false,
				notify: true
			},

		};
	}
	static get template() {
		return html`
		${sharedStyles}

		<style>
			:host {
				--border-color: #BBB;
				--left-right-padding: 0;
				--left-right-border-style: solid;

				display: block;
				font-size: 1em;
				border-color: var(--border-color);
				border-style: solid var(--left-right-border-style) none var(--left-right-border-style);
				border-width: 1px;
			}

			/*
			 * INPUT
			 */

			#box {
				display: block;
				padding: 0 var(--left-right-padding);
				border-bottom: 1px solid var(--border-color);
				font-family: var(--input-font-family, inherit);
			}

			#box table,
			#box table td:first-child {
				width: 100%;
			}

			#box input {
				background-color: transparent;
				border: none;
				display: block;
				box-sizing: border-box;
				width: 100%;
				padding: .5em;
				font-family: var(--input-font-family, inherit);
				font-size: 110%;
			}

			#box input::-ms-clear {
				display: none;
			}

			#box button.btn-img {
				padding-top: .5em;
				padding-bottom: .5em;
			}

			#box #example-queries-button>* {
				background-image: url("/src/img/i.svg");
			}

			#box #clear-button>* {
				background-image: url("/src/img/x.svg");
			}

			#box #history-button>* {
				background-image: url("/src/img/history.svg");
			}

			/*
			 * DROP DOWN
			 */

			#drop-down {
				position: absolute;
				background-color: white;
				box-shadow: 0 2px 1px 0 rgba(0, 0, 0, 0.2);
				border: 1px solid var(--border-color);
				width: 15em;
				margin-left: -15em;
				z-index: 10;
				font-size: 1em;
			}

			#drop-down .option,
			#drop-down .status {
				padding: .5em 1em;
				border-bottom: 1px solid var(--border-color);
				cursor: pointer;
			}

			#drop-down .status {
				font-style: italic;
				cursor: unset;
			}

			#drop-down .option:nth-child(2n) {
				background-color: #F8F8F8;
			}

			#drop-down .option:hover {
				background-color: #EEE;
			}

			#drop-down .option:last-child,
			#drop-down .status:last-child {
				border-bottom: none;
			}

			/*
			 * WRAPPER
			 */

			#result-wrapper {
				border-bottom: 1px solid var(--border-color);
				font-family: var(--result-font-family, inherit);
			}

			/*
			 * ERRORS
			 */

			div#errors {
				display: block;
				border-bottom: 1px solid var(--border-color);
			}

			div#errors>p {
				background-color: #EAA;
				color: #300;
				display: block;
				padding: 1em;
				margin: 0;
				word-break: break-word;
			}

			/*
			 * WARNINGS
			 */

			div#warnings {
				display: table;
				box-sizing: border-box;
				width: 100%;

				background-color: #EDA;
				border-bottom: 1px solid var(--border-color);
			}

			div#warnings>p {
				color: #420;
				display: block;
				margin: 1em;
				word-break: break-word;
			}

			div#warnings span.suggestion:hover {
				cursor: pointer;
				text-decoration: underline;
			}

			/*
			 * EXAMPLE QUERIES
			 */

			netspeak-example-queries {
				border-bottom: 1px solid var(--border-color);
			}

			/*
			 * NO PHRASES FOUND
			 */

			#no-phrases-found-container {
				border-bottom: 1px solid var(--border-color);

				display: block;
				font-family: var(--result-font-family, inherit);
				color: #444;
				padding: 0 var(--left-right-padding);
			}

			#no-phrases-found-container p {
				font-style: italic;
				padding: .3em .5em;
				margin: 0;
			}

			/*
			 * PRELOAD IMAGES
			 */

			#img-pre-loader {
				/* this is a simple trick to preload images */
				background-image: url('/src/img/loading.svg'), url('/src/img/load-more.svg'), url("/src/img/plus.svg"), url("/src/img/minus.svg"), url("/src/img/pin.svg");
			}
		</style>

		<div id="box">
			<table>
				<tr>
					<td>
						<input type="text" id="query-input" value="{{query}}" on-change="_queryInputChange" on-keyup="_queryInputKeyUp" />
					</td>
					<td>
						<button class="btn-img" id="example-queries-button" on-click="_toggleExampleQueriesVisibility">
							<span class="btn-img"></span>
						</button>
					</td>
					<td>
						<button class="btn-img" id="clear-button" on-click="clear">
							<span class="btn-img"></span>
						</button>
					</td>
					<td>
						<button class="btn-img" id="history-button" on-click="_historyButtonClick">
							<span class="btn-img"></span>
						</button>
					</td>
				</tr>
			</table>
		</div>

		<div id="errors" style="display: none"></div>
		<div id="warnings" style="display: none"></div>

		<netspeak-example-queries corpus$="{{corpus}}"></netspeak-example-queries>

		<div id="result-wrapper" style="display: none">
			<netspeak-search-bar-result-list></netspeak-search-bar-result-list>
		</div>

		<div id="no-phrases-found-container" style="display: none">
			<p id="no-phrases-found">No phrases found.</p>
		</div>

		<div id="img-pre-loader"></div>
		`;
	}

	/**
	 * The queried phrases of the search bar.
	 *
	 * @type {PhraseCollection}
	 */
	get queriedPhrases() {
		return this._queriedPhrases;
	}

	/**
	 * The history of the current search bar. The item with the highest index is the most recent.
	 *
	 * The history is limited to 1024 items.
	 *
	 * @readonly
	 * @type {Object[]}
	 */
	get history() {
		if (!this._history) this._history = [];

		const limit = 1024;
		if (this._history.length > limit)
			this._history.splice(0, this._history.length - limit);

		return this._history;
	}


	/**
	 * Creates a new instance of NetspeakSearchBar.
	 *
	 */
	constructor() {
		super();

		this.netspeakApi = Netspeak.getInstance();

		this._queriedPhrases = new PhraseCollection();
		this._queryCount = 0;

		// for typing purposes
		/** @type {string} */
		this.query = this.query;
		/** @type {string} */
		this.corpus = this.corpus;
		/** @type {number} */
		this.initialLimit = this.initialLimit;
		/** @type {boolean} */
		this.readonly = this.readonly;
		/** @type {boolean} */
		this.slowSearch = this.slowSearch;
		/** @type {number} */
		this.initialExamplesLimit = this.initialExamplesLimit;
		/** @type {boolean} */
		this.historyHidden = this.historyHidden;
		/** @type {boolean} */
		this.infoVisibleByDefault = this.infoVisibleByDefault;
	}

	/**
	 * The method called after the element was added to the DOM.
	 */
	connectedCallback() {
		super.connectedCallback();

		/** @type {HTMLInputElement} */
		this._queryInputElement = this.shadowRoot.querySelector("#query-input");
		/** @type {HTMLButtonElement} */
		this._exampleQueriesButton = this.shadowRoot.querySelector("#example-queries-button");
		/** @type {HTMLButtonElement} */
		this._clearButton = this.shadowRoot.querySelector("#clear-button");
		/** @type {HTMLButtonElement} */
		this._historyButton = this.shadowRoot.querySelector("#history-button");

		/** @type {import("./netspeak-example-queries").NetspeakExampleQueries} */
		this._exampleQueries = this.shadowRoot.querySelector("netspeak-example-queries");
		/** @type {NetspeakSearchBarResultList} */
		this._resultList = this.shadowRoot.querySelector("netspeak-search-bar-result-list");
		/** @type {NetspeakSearchBarResultList} */
		this._noPhraseFoundContainer = this.shadowRoot.querySelector("#no-phrases-found-container");

		this._queryInputElement.onblur = () => {
			// this is a hack to ignore inputs from blur event.
			// blur events are dispatched after the input event, so in the exactly wrong order.
			// to combat this, we will set a flag of 3ms after which it is reset.
			// input event will be delayed by 1ms to hopefully see the blur flag.
			this._inputBlurred = true;
			setTimeout(() => {
				this._inputBlurred = false;
			}, 3);
		};

		this._historyHiddenChanged(this.historyHidden);
		this._resultList.addEventListener("load-more", () => this._loadMoreItems());
		this._exampleQueries.addEventListener("query-selected", e => {
			// @ts-ignore
			this.query = e.detail.query;
		});
		this._setExampleQueriesVisibility(this.infoVisibleByDefault);
	}

	/**
	 * Fires a new event with the given name and values.
	 *
	 * The event will be dispatched from this instance.
	 *
	 * @param {string} name The name of the event.
	 * @param {string} newValue The new value.
	 * @param {string} oldValue The old value.
	 * @param {boolean} [cancelable=false] Whether the event can be cancelled.
	 * @returns {boolean} Whether the event was cancelled.
	 */
	dispatchChangeEvent(name, newValue, oldValue, cancelable = false) {
		return this.dispatchEvent(new CustomEvent(name, {
			detail: {
				newValue: newValue,
				oldValue: oldValue,
			},
			bubbles: false,
			cancelable: cancelable,
		}));
	}

	_queryChanged(newValue, oldValue) {
		if (this._queryChanging)
			throw Error("You cannot modify the query during a query change event");
		this._queryChanging = true;

		try {
			const focusInput = Boolean(this._focusInput);
			this._focusInput = false;

			// hide examples if they weren't used
			if (this._exampleQueries && this._exampleQueries.clickCounter === 0) {
				this._setExampleQueriesVisibility(false);
			}

			this.dispatchChangeEvent("queryChange", newValue, oldValue);

			this.queryPhrases({ focusInput: focusInput });
		} finally {
			this._queryChanging = false;
		}
	}
	_queryInputChange(e) {
		if (this.readonly) return;

		const query = e.target.value;
		const counter = this._queryCount;

		setTimeout(() => {
			if (this._queryCount !== counter) {
				// too slow
				return;
			}
			if (this._inputBlurred) {
				// blurred
				return;
			}

			this._focusInput = true;
			if (query != this.query) {
				this.query = query;
			} else {
				this.queryPhrases();
			}
		}, 1);
	}
	_queryInputKeyUp(e) {
		if (this.slowSearch || this.readonly) return;

		const newQuery = e.target.value;

		if (normalizeQuery(newQuery) === normalizeQuery(this.query)) return;

		this._focusInput = true;
		this.query = newQuery;

		this._addToHistory({ query: newQuery, corpus: this.corpus }, true);
	}

	/**
	 * Queries phrases using the Netspeak API adding them to or overwriting the phrases queried before.
	 *
	 * @param {Readonly<QueryPhrasesOptions>} [options={}]
	 *
	 * @typedef QueryPhrasesState
	 * @property {string} query
	 * @property {string} corpus
	 * @property {boolean} focusInput
	 * @property {import("./netspeak").NetspeakSearchRequest} [request]
	 */
	queryPhrases(options = {}) {
		this._queryCount++;

		/** @type {QueryPhrasesState} */
		const state = {
			query: this.query,
			corpus: this.corpus,
			focusInput: !!this._focusInput
		};

		const query = normalizeQuery(this.query);
		const corpus = this.corpus;

		/** @type {Promise<import("./netspeak.js").NetspeakSearchResult>} */
		let searchResult;
		if (!query || !corpus) {
			// this optimization will also catch the first empty query from the polymer query change event.
			searchResult = Promise.resolve({
				phrases: [],
				unknownWords: []
			});
		} else {
			// add to history
			this._addToHistory({ query, corpus }, true);

			/** @type {import("./netspeak").NetspeakSearchRequest} */
			const request = {
				// TODO: find a better way to lowercase queries
				// TODO: remove this hack
				query: corpus === "web-en" ? query.toLowerCase() : query,
				corpus,
			};
			state.request = request;

			const addToRequest = (prop, defaultValue = undefined) => {
				if (options[prop] != undefined) request[prop] = options[prop];
				else if (defaultValue !== undefined) request[prop] = defaultValue;
			};
			addToRequest("topk", this.initialLimit);
			addToRequest("maxfreq");

			const searchOptions = options.searchOptions || {};

			// a more expensive search for the first query
			if (!this._hadFirstQuery) {
				this._hadFirstQuery = true;
				if (!("topkMode" in searchOptions)) {
					searchOptions.topkMode = "fill";
				}
			}

			searchResult = this.netspeakApi.search(request, searchOptions);
		}

		const append = options.appendMode == "append";

		searchResult.then(result => {
			this._onSearchSuccess(result, state, append);
		}).catch(reason => {
			this._onSearchError(reason, state, append);
		});
	}

	/**
	 * @param {import("./netspeak").NetspeakSearchResult} result
	 * @param {QueryPhrasesState} state
	 * @param {boolean} append
	 */
	_onSearchSuccess(result, state, append = false) {
		if (this.query !== state.query || this.corpus !== state.corpus) return; // too late

		let newPhrases = result.phrases.length;
		/** @type {string[]} */
		this.unknownWords = result.unknownWords;
		this.errorMessage = "";
		if (append) {
			newPhrases = this._queriedPhrases.addAll(result.phrases);
		} else {
			this._queriedPhrases = PhraseCollection.from(result.phrases);
		}

		this._resultList.showLoadMore = !result.complete && newPhrases > 0;

		this.update(state.focusInput);
	}
	/**
	 * @param {string | Error} message
	 * @param {QueryPhrasesState} state
	 * @param {boolean} append
	 * @param {number} delay
	 */
	_onSearchError(message, state, append = false, delay = 1000) {
		if (this.query !== state.query || this.corpus !== state.corpus) return; // too late

		// delay
		if (delay > 0) {
			setTimeout(() => this._onSearchError(message, state, append, 0), delay);
			return;
		}

		// disable load more
		this._resultList.showLoadMore = false;

		console.error(message, state);

		this.errorMessage = message;
		this.unknownWords = [];
		this.update(state.focusInput);
	}

	update(focusInput = false) {
		// declare variables
		const queriedPhrases = this.queriedPhrases;

		this._resultList.phrases = queriedPhrases.toArray();

		// wrapper
		/** @type {HTMLDivElement} */
		const wrapper = this.shadowRoot.querySelector("#result-wrapper");

		// output unknown words
		/** @type {HTMLElement} */
		const warnings = this.shadowRoot.querySelector("#warnings");
		this.unknownWords = (this.unknownWords || []).filter(Boolean);
		if (this.unknownWords.length > 0) {
			warnings.style.display = null;
			this._updateWarnings(warnings, this.unknownWords);
		} else {
			warnings.style.display = "none";
		}

		// output errors
		/** @type {HTMLElement} */
		const errors = this.shadowRoot.querySelector("#errors");
		if (this.errorMessage) {
			errors.style.display = null;
			this._updateErrorMessage(errors, this.errorMessage);

			// the wrapper should stay as is
		} else {
			errors.style.display = "none";

			// wrapper
			wrapper.style.display = !this._resultList.isEmpty ? "block" : "none";
		}

		// show "no phrase found" message
		if (this._resultList.phrases.length === 0 && !this._resultList.showLoadMore && this.query) {
			this._noPhraseFoundContainer.style.display = null;
		} else {
			this._noPhraseFoundContainer.style.display = "none";
		}

		if (focusInput && this._queryInputElement) {
			this._queryInputElement.focus();
		}
	}
	/**
	 * @param {HTMLElement} container
	 * @param {readonly string[]} unknownWords Must be non-empty
	 */
	_updateWarnings(container, unknownWords) {
		container.innerHTML = '';
		this.localMessage("unknown-word", "Unknown word ${word}.").then(unknownWordMessage => {
			unknownWordMessage = encode(unknownWordMessage);
			unknownWords.forEach(word => {
				const p = appendNewElements(container, "P");
				p.innerHTML = unknownWordMessage.replace(/\$\{word\}/g, () => {
					return `<em>${word}</em>`;
				});
			});
		});
	}
	/**
	 * @param {HTMLElement} container
	 * @param {string | Error} details
	 */
	_updateErrorMessage(container, details) {
		container.innerHTML = '';

		/** @type {Promise<string>} */
		let message;
		if (details instanceof NetspeakInvalidQueryError) {
			message = this.localMessage("invalid-query-error",
				`Your input is not a valid Netspeak query.
				<br><br>
				More information about the Netspeak query syntax can be found
				<a href="https://netspeak.org/help.html#how" target="_blank">here</a>.`
			);
		} else if (details instanceof NetspeakError) {
			// we got an error from the server which isn't a query error. This means that the user is not at fault
			// but can't really say anything about what went wrong because the Netspeak server might have failed for
			// any number of reasons.
			message = this.localMessage("unknown-server-error",
				`An error occurred in Netspeak.`
			);
		} else if (details instanceof NetworkError) {
			// (see jsonp.js for more info on what errors are available)
			if (navigator.onLine) {
				message = this.localMessage("netspeak-unreachable-error",
					`The Netspeak server failed to respond. Please retry in a few minutes.`
				);
			} else {
				message = this.localMessage("no-connection-error",
					`No response form the Netspeak server. Please make sure you have a stable internet connection.`
				);
			}
		} else {
			// everything that isn't a networking error or an error from Netspeak itself
			// is assumed to be caused by the web interface itself. We can't really give any detailed error message
			// here because this state will only be reached if the web interface has a bug.
			message = this.localMessage("client-error",
				`An error occurred. Please report this to <a href="https://netspeak.org/help.html?lang=en#contact">the maintainers of Netspeak</a> should the error occur repeatedly.`
			);
		}

		Promise.all([
			message,
			this.localMessage("full-details", "Full details"),
		]).then(([errorMessage, fullDetails]) => {
			appendNewElements(container, "P").innerHTML = `${errorMessage}
				<br>
				<br>
				<details><summary>${encode(fullDetails)}</summary>
					<p>${encode(String(details))}</p>
				</details>`;
		});
	}

	_loadMoreItems() {
		/** @type {QueryPhrasesOptions} */
		const options = {
			appendMode: "append",
			topk: this.initialLimit,
			searchOptions: {
				topkMode: "fill"
			}
		};

		// max frequency
		if (this.queriedPhrases && this.queriedPhrases.length > 0) {
			options.maxfreq = this.queriedPhrases.at(this.queriedPhrases.length - 1).frequency;
		}

		this.queryPhrases(options);
	}


	/**
	 * Clears the current query and removes all queried and pinned phrases.
	 *
	 */
	clear() {
		this._resultList.clear();
		this._queriedPhrases = new PhraseCollection();
		this.query = "";
	}


	_toggleExampleQueriesVisibility() {
		const visible = this._exampleQueries.style.display !== "none";
		this._setExampleQueriesVisibility(!visible);
	}

	_setExampleQueriesVisibility(visible) {
		if (visible) {
			this._exampleQueries.style.display = null;
			this._exampleQueriesButton.classList.add("selected");
		} else {
			this._exampleQueries.style.display = "none";
			this._exampleQueriesButton.classList.remove("selected");
		}
	}


	addToHistory() {
		this._addToHistory({ query: this.query, corpus: this.corpus });
	}

	_addToHistory(item, delayed = false) {
		if (!item) throw Error("item has to be defined");

		window.clearTimeout(this._addToHistoryTimeout);
		if (delayed) {
			this._addToHistoryTimeout = window.setTimeout(() => {
				this._addToHistory(item);
			}, 1000);
			return;
		}

		const copy = {
			query: item.query,
			corpus: item.corpus,
			time: new Date().getTime(),
		};

		// ignore empty queries
		if (copy.query !== undefined && copy.query !== null) {
			if (copy.query === "") return;
			if (!normalizeQuery(copy.query)) return;
		}

		if (!copy.query) throw Error("item.query has to be defined");
		if (!copy.corpus) throw Error("item.corpus has to be defined");

		copy.query = copy.query.trim();

		const history = this.history;

		// remove less recent entries
		for (let i = history.length - 1; i >= 0; i--) {
			const it = history[i];
			if (!it || (it.query == copy.query && it.corpus == copy.corpus)) {
				history.splice(i, 1);
			}
		}

		history.push(copy);
	}

	_historyHiddenChanged(newValue) {
		if (!this._historyButton) return;

		this._historyButton.parentElement.style.display = newValue ? "none" : null;
	}

	_historyButtonClick() {
		this._toggleHistoryDropDown();
	}

	_toggleHistoryDropDown(show = undefined) {
		if (this.historyHidden || !this._historyButton) return;

		const container = this._historyButton.parentElement;
		if (show === undefined) show = !container.hasAttribute("history-visible");

		if (show) {
			container.setAttribute("history-visible", "");

			// current history
			const history = this.history.filter(i => i.corpus === this.corpus).reverse();
			const historyLimit = 10;
			if (history.length > historyLimit) history.splice(historyLimit, history.length - historyLimit);

			const positioner = appendNewElements(container, "DIV#drop-down-positioner");
			positioner.style.paddingLeft = this._historyButton.clientWidth + "px";
			const dd = appendNewElements(positioner, "BUTTON#drop-down");
			dd.onblur = () => {
				container.removeAttribute("history-visible");
				dd.parentElement.remove();
			};

			// new option function
			const newOpt = (query) => {
				const opt = appendNewElements(dd, "DIV.option");
				opt.textContent = query;
				opt.onclick = () => {
					this._toggleHistoryDropDown(false);
					this.query = query;
				};
			};

			history.forEach(i => newOpt(i.query));
			if (history.length == 0) {
				const opt = appendNewElements(dd, "DIV.status");
				this.localMessage("no-history", "No query history").then(msg => {
					opt.textContent = msg;
				});
			}

			dd.focus();
		} else {
			container.removeAttribute("history-visible");
			// @ts-ignore
			container.querySelector("#drop-down").blur();
		}
	}

}

/**
 * The result list of the Netspeak search bar.
 *
 * This element will handle everything that is contained in the result list including:
 *
 * - Formatting the result phrases
 * - Notifying that more phrases are requested
 * - Pinning phrases
 * - Querying and displaying examples
 */
class NetspeakSearchBarResultList extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return "netspeak-search-bar-result-list"; }
	static get properties() {
		return {
			"showLoadMore": {
				type: Boolean,
				notify: true
			},
			"phrases": {
				type: Array,
				notify: true
			},
			"formatter": {
				type: PhraseFormatter,
				notify: true
			}
		};
	}
	static get template() {
		return html`
		${sharedStyles}

		<style>

			*::-moz-selection {
				text-shadow: none !important;
				background-color: rgba(32, 64, 255, .8);
				color: #FFF;
			}
			*::selection {
				text-shadow: none !important;
				background-color: rgba(32, 64, 255, .8);
				color: #FFF;
			}


			#result-list>div {
				background-color: var(--item-background-color);
				width: 100%;
				padding: 0;
			}

			#result-list>div:nth-child(2n) {
				--item-background-color: #F7F7F7;
			}
			#result-list>div:nth-child(2n+1) {
				--item-background-color: #FFF;
			}
			#result-list>div[options-visible],
			#result-list>div:hover {
				--item-background-color: #e2ebf1;
			}


			/**
			 * div.phrase-container
			 */

			#result-list .phrase-container {
				background-repeat: no-repeat;
				background-position: calc(100% + 1px) -2px;
				background-image: url("/src/img/frequency-bar.png");

				cursor: pointer;
				padding: 0 var(--left-right-padding);
				width: 100%;
				box-sizing: border-box;
			}
			#result-list .phrase-container::after {
				content: "";
				clear: both;
				display: block;
			}


			#result-list span.text,
			#result-list span.freq {
				text-shadow: 0 1px 1px #FFF;
				padding: .3em .5em;
			}

			#result-list span.text {
				float: left;
			}
			#result-list [pinned] span.text {
				font-weight: bold;
			}

			#result-list span.freq {
				float: right;
				text-align: right;
			}

			#result-list span.freq>span.percentage {
				display: inline-block;
				padding-left: .5em;
				width: 4em;
			}

			#result-list span.text span {
				color: #333;
			}

			#result-list span.text span.asterisk,
			#result-list span.text span.q-mark,
			#result-list span.text span.plus,
			#result-list span.text span.regex {
				color: #c5000b;
			}

			#result-list span.text span.option-set,
			#result-list span.text span.order-set,
			#result-list span.text span.dict-set,
			#result-list span.text span.option-set-regex,
			#result-list span.text span.order-set-regex {
				color: #2d7db3;
			}


			/**
			 * div.options
			 */

			#result-list .options {
				background: rgb(247, 247, 247);
				border-bottom: 1px solid #CCC;
				border-top: 1px solid #CCC;
				color: #444;

				position: relative;
			}
			#result-list>div:last-child .options {
				border-bottom: none;
			}


			/*
			 * div.buttons
			 */

			#result-list .options .buttons {
				text-align: right;
				margin: .25em var(--left-right-padding);
			}

			#result-list .pinned>span.btn-img {
				background-image: url("/src/img/pin.svg");
			}
			#result-list [pinned] .pinned {
				opacity: 1;
			}

			#result-list .copy>span.btn-img {
				background-image: url("/src/img/copy.svg");
			}


			/*
			 * EXAMPLES
			 */

			#result-list .loading {
				cursor: default;
				opacity: 1;
			}
			#result-list .loading>span.btn-img {
				animation-name: show-via-opacity;
				animation-duration: 1s;
				background-image: url("/src/img/loading.svg");
			}
			@keyframes show-via-opacity {
				from {
					opacity: 0;
				}

				20% {
					opacity: 0;
				}

				to {
					opacity: 100%;
				}
			}

			#result-list .options .examples-container {
				padding: 0 1em 1em 1em;
			}
			#result-list .options .examples-list {
				font-size: 90%;
				word-break: break-word;
			}
			#result-list .options .load-more-examples {
				text-align: center;
			}

			#result-list .options .examples-list .source {
				padding-left: .25em;
			}

			#result-list .options .examples-list .source a {
				color: inherit;
				opacity: .7;
				text-decoration: none;
			}
			#result-list .options .examples-list .source a:hover {
				text-decoration: underline;
			}

			#result-list .options .load-more {
				cursor: pointer;
				display: block;
				position: relative;
				width: 100%;
			}

			#result-list .options .load-more>* {
				margin-left: auto;
				margin-top: auto;
			}


			/*
			 * LOAD MORE
			 */

			#load-more-button {
				border-top: 1px solid var(--border-color);
				cursor: pointer;
				position: relative;
				margin: 0;
				padding: 0;
				display: block;
				width: 100%;
			}

			#load-more-button:hover,
			#load-more-button[disabled] {
				background-color: #EEE;
			}

			/* These are for both the result list load-more button and the examples load-more buttons */

			*:hover:not([disabled]) > span.load-more-img {
				opacity: 1;
			}
			span.load-more-img {
				opacity: .5;
				display: block;
				width: 4em;
				height: 2em;
				padding: 0;
				margin: auto;
				background-position: center;
				background-size: contain;
				background-repeat: no-repeat;
				background-image: url('/src/img/load-more.svg');
			}

		</style>

		<div id="result-list"></div>

		<button id="load-more-button" style="display: none;">
			<span class="load-more-img"></span>
		</button>
		`;
	}

	get isEmpty() {
		return this.pinnedPhrases.size + this.phrases.length === 0;
	}

	constructor() {
		super();

		this.showLoadMore = false;
		this.examplePageSize = 6;

		/** @type {Phrase[]} */
		this.phrases = [];
		/** @type {Map<string, Phrase>} */
		this.pinnedPhrases = new Map();

		this.snippets = DEFAULT_SNIPPETS;
		this.formatter = PhraseFormatter.getInstance();

		this.invalidate = createNextFrameInvoker(() => this._render());

		this.addEventListener("phrases-changed", () => this.invalidate());
		this.addEventListener("formatter-changed", () => this.invalidate());
	}

	connectedCallback() {
		super.connectedCallback();

		/** @type {HTMLElement} */
		this._resultList = this.shadowRoot.querySelector("#result-list");
		/** @type {HTMLElement} */
		this._loadMore = this.shadowRoot.querySelector("#load-more-button");

		this.addEventListener("show-load-more-changed", () => {
			if (this._loadMore) {
				this._loadMore.style.display = this.showLoadMore ? "block" : "none";
				this._loadMore.removeAttribute("disabled");
			}
		});
		this._loadMore.addEventListener("click", () => {
			this._loadMore.setAttribute("disabled", "");
			this.dispatchEvent(new CustomEvent("load-more", {
				bubbles: false,
				cancelable: false,
			}));
		});
	}


	clear() {
		this.phrases = [];
		this.pinnedPhrases.clear();
		this.showLoadMore = false;
		this.invalidate();
	}

	_render() {
		if (!this.isConnected) return;

		// re-enable load more button
		this._loadMore.removeAttribute("disabled");

		const collection = new NewPhraseCollection(this._getAllPhrasesToRender());

		// update or delete current DOM elements
		const existingElementPhraseIdsSet = new Set();
		for (let i = this._resultList.children.length - 1; i >= 0; i--) {
			const element = /** @type {HTMLElement} */ (this._resultList.children[i]);
			const elementPhrase = this._getResultElementPhrase(element);
			if (!elementPhrase) {
				// delete
				element.remove();
				continue;
			}

			const mapEntry = collection.byId(elementPhrase.id);
			if (mapEntry) {
				// update
				existingElementPhraseIdsSet.add(elementPhrase.id);
				this._setResultElementPinned(element, elementPhrase);
				this._setResultElementStats(element, elementPhrase, collection);
			} else {
				// delete
				element.remove();
			}
		}

		// insert new DOM elements
		for (const phrase of collection) {
			if (!existingElementPhraseIdsSet.has(phrase.id)) {
				const element = this._createResultElement(phrase, collection);
				this._setResultElementPinned(element, phrase);
				this._insertResultElement(element, phrase);
			}
		}
	}

	/**
	 * Create a new result element for the given phrase.
	 *
	 * @param {Phrase} phrase
	 * @param {NewPhraseCollection} collection
	 * @returns {HTMLElement}
	 */
	_createResultElement(phrase, collection) {
		const element = document.createElement("div");
		this._setResultElementPhrase(element, phrase);

		const phraseContainer = appendNewElements(element, "div.phrase-container");
		phraseContainer.addEventListener("click", () => {
			this._toggleResultElementOptions(element);
		});

		appendNewElements(phraseContainer, "div", "span.text");
		appendNewElements(phraseContainer, "span.freq");

		this._setResultElementStats(element, phrase, collection);
		return element;
	}

	_toggleResultElementPinned(element) {
		const phrase = this._getResultElementPhrase(element);
		if (this.pinnedPhrases.has(phrase.id)) {
			this.pinnedPhrases.delete(phrase.id);
		} else {
			this.pinnedPhrases.set(phrase.id, phrase);
		}
		this._setResultElementPinned(element, phrase);
	}

	/**
	 * @param {HTMLElement} element
	 */
	_toggleResultElementOptions(element) {
		/** @type {HTMLElement} */
		const options = element.querySelector(".options");
		if (!options) {
			this._addResultElementOptions(element);
			element.setAttribute("options-visible", "");
		} else {
			const visible = options.style.display !== "none";
			if (visible) {
				options.style.display = "none";
				element.removeAttribute("options-visible");
			} else {
				options.style.display = "block";
				element.setAttribute("options-visible", "");
			}
		}
	}

	/**
	 * @param {HTMLElement} element
	 */
	_addResultElementOptions(element) {
		const phrase = this._getResultElementPhrase(element);

		const options = appendNewElements(element, "DIV.options");

		// buttons
		const buttons = appendNewElements(options, "div.buttons");



		// pin button
		const copyBtn = appendNewElements(buttons, "SPAN.btn-img.copy");
		//copyBtn.onclick = () => console.log(`Copy "${phrase.text}"`);
		appendNewElements(copyBtn, "SPAN.btn-img");
		const copyText = appendNewElements(copyBtn, "SPAN.btn-text");

		const setTextToCopy = () => this.localMessage("copy", "Copy").then(msg => {
			copyText.textContent = msg;
		});
		const setTextToCopied = () => this.localMessage("copied", "Copied").then(msg => {
			copyText.textContent = msg;
		});
		setTextToCopy();

		const text = phrase.text;
		createClipboardButton(copyBtn, () => {
			setTextToCopied();
			setTimeout(() => setTextToCopy(), 3000);
			return text;
		});

		// pin button
		const pinningBtn = appendNewElements(buttons, "SPAN.btn-img.pinned");
		pinningBtn.onclick = () => this._toggleResultElementPinned(element);
		appendNewElements(pinningBtn, "SPAN.btn-img");
		const pinningText = appendNewElements(pinningBtn, "SPAN.btn-text");
		this.localMessage("pin", "Pin").then(msg => {
			pinningText.textContent = msg;
		});

		// examples
		this._addResultElementOptionsExamples(options, phrase);
	}

	/**
	 * @param {HTMLElement} options
	 * @param {Phrase} phrase
	 */
	_addResultElementOptionsExamples(options, phrase) {
		const examplesContainer = appendNewElements(options, "DIV.examples-container");
		const examplesList = appendNewElements(examplesContainer, "div.examples-list");

		const loadMoreExamplesContainer = appendNewElements(examplesContainer, "div.load-more-examples");

		// loading icon
		const loadingIcon = appendNewElements(loadMoreExamplesContainer, "SPAN.btn-img.loading");
		appendNewElements(loadingIcon, "SPAN.btn-img");

		// load more button
		const button = appendNewElements(loadMoreExamplesContainer, "BUTTON.load-more");
		appendNewElements(button, "SPAN.load-more-img");
		button.addEventListener('click', () => loadMoreExamples());


		// load examples function
		const exampleSupplier = this.snippets.getSupplier(phrase.text, this.examplePageSize);
		const emphasize = this._createEmphasizer(phrase.text, 200);
		let didSupplyExamples = false;

		const loadMoreExamples = () => {
			loadingIcon.style.display = null;
			button.style.display = "none";

			const examplePromise = exampleSupplier();
			examplePromise.then(examples => {
				if (examples === false) {
					loadingIcon.style.display = "none";
					button.style.display = "none";

					const p = appendNewElements(examplesList, "DIV", "P");
					const i = appendNewElements(p, "I");
					if (didSupplyExamples) {
						this.localMessage("no-further-examples-found", "No further examples found.").then(msg => {
							i.textContent = msg;
						});
					} else {
						this.localMessage("no-examples-found", "No examples found.").then(msg => {
							i.textContent = msg;
						});
					}
				} else {
					loadingIcon.style.display = "none";
					button.style.display = null;

					for (const example of examples) {
						didSupplyExamples = true;

						// add paragraph
						const p = appendNewElements(examplesList, "DIV", "P");
						p.innerHTML = emphasize(example.text);

						// add source(s) of the example
						for (const name in example.urls) {
							const element = example.urls[name];

							const span = appendNewElements(p, "SPAN.source");
							span.appendChild(document.createTextNode("["));

							const a = appendNewElements(span, "A");
							a.setAttribute("href", element);
							a.setAttribute("target", "_blank");
							a.textContent = name;

							span.appendChild(document.createTextNode("]"));
						}
					}
				}
			}).catch(e => {
				console.error(e);

				loadingIcon.style.display = "none";
				button.style.display = "none";

				const p = appendNewElements(examplesList, "DIV", "P");
				this.localMessage("failed-to-load-examples", "Failed to load examples.").then(msg => {
					p.textContent = msg;
				});
			});
		};
		// load examples right now.
		loadMoreExamples();
	}

	/**
	 * Creates a function which given some plain text will return HTML code where the given phrase is emphasized.
	 *
	 * @param {string} phrase
	 * @param {number} context The number of characters allowed around the phrase.
	 * @returns {(text: string) => string}
	 */
	_createEmphasizer(phrase, context) {
		const emphasisRE = new RegExp(phrase.replace(/[\\/(){}[\]|?+*^$.]/g, "\\$&") + "|(<)|(&)", "ig");

		return text => {
			/** @type {number | undefined} */
			let index;
			text.replace(emphasisRE, (m, lt, amp, i) => {
				if (lt || amp) return "";
				index = i;
				return "";
			});

			if (index != undefined) {
				if (text.length > index + context) {
					text = text.substr(0, index + context).replace(/\s+\S*$/, " ...");
				}
				if (index > context) {
					text = text.substr(index - context).replace(/^\S*\s+/, "... ");
				}
			}

			return text.replace(emphasisRE, (m, lt, amp, index) => {
				if (lt) return "&lt;";
				if (amp) return "&amp;";
				index = index;
				return `<strong>${encode(m)}</strong>`;
			});
		};
	}

	/**
	 * @param {HTMLElement} element
	 * @param {Phrase} phrase
	 */
	_setResultElementPinned(element, phrase) {
		if (this.pinnedPhrases.has(phrase.id)) {
			element.setAttribute("pinned", "");
		} else {
			element.removeAttribute("pinned");
		}
	}

	/**
	 * Sets the values of all statistics of the given result DOM element.
	 *
	 * @param {HTMLElement} element
	 * @param {Phrase} phrase
	 * @param {NewPhraseCollection} collection
	 */
	_setResultElementStats(element, phrase, collection) {
		/** @type {HTMLDivElement} */
		const phraseContainer = element.querySelector(".phrase-container");

		const relativeFreq = phrase.frequency / collection.maxFrequency;
		phraseContainer.style.backgroundSize = `${relativeFreq * .618 * 100}% 130%`;

		const text = this.formatter.formatText(phrase, collection);
		const freq = this.formatter.formatFrequency(phrase, collection);
		const percent = this.formatter.formatPercentage(phrase, collection);

		phraseContainer.querySelector(".text").innerHTML = text;
		phraseContainer.querySelector(".freq").innerHTML = `${freq}<span class="percentage">${percent}</span>`;
	}

	/**
	 * Inserts the given element into the result list.
	 *
	 * @param {HTMLElement} element
	 * @param {Phrase} phrase
	 */
	_insertResultElement(element, phrase) {
		if (this._resultList.children.length === 0) {
			this._resultList.appendChild(element);
		} else {
			// we usually append the element, so it's fast to search linearly from back to front
			// than more complex methods such as binary search

			const getFrequency = element => this._getResultElementPhrase(element).frequency;

			for (let i = this._resultList.children.length - 1; i >= 0; i--) {
				const child = this._resultList.children[i];
				if (phrase.frequency <= getFrequency(child)) {
					this._resultList.insertBefore(element, child.nextSibling);
					return;
				}
			}

			// if get here, the element has to be inserted as the first node
			this._resultList.insertBefore(element, this._resultList.firstChild);
		}
	}

	/**
	 * Returns all phrases which have to be displayed in the order in which they have to be displayed.
	 *
	 * @returns {Phrase[]}
	 */
	_getAllPhrasesToRender() {
		/** @type {Phrase[]} */
		const phrases = [];
		const includedTexts = new Set();

		/**
		 * Adds all of the given phrases to the list of rendered phrases.
		 *
		 * This will excluded already added phrases such that only the one will be displayed.
		 *
		 * @param {Iterable<Phrase>} phrasesToAdd
		 */
		function addAllPhrases(phrasesToAdd) {
			for (const phrase of phrasesToAdd) {
				if (!includedTexts.has(phrase.id)) {
					phrases.push(phrase);
					includedTexts.add(phrase.id);
				}
			}
		}
		addAllPhrases(this.phrases);
		addAllPhrases(this.pinnedPhrases.values());

		// sort by frequency (desc)
		phrases.sort((a, b) => b.frequency - a.frequency);

		return phrases;
	}

	/**
	 * @param {HTMLElement} element
	 * @returns {Phrase | undefined}
	 */
	_getResultElementPhrase(element) {
		return /** @type {any} */(element).__phrase;
	}
	/**
	 * @param {HTMLElement} element
	 * @param {Phrase} phrase
	 */
	_setResultElementPhrase(element, phrase) {
		/** @type {any} */(element).__phrase = phrase;
	}
}


/** @typedef {import('./netspeak').Phrase} Phrase */

/**
 * A PhraseFormatter converts phrases into HTML source code.
 */
export class PhraseFormatter {

	/**
	 * Creates an instance of PhraseFormatter.
	 */
	constructor() {
		this.local = NetspeakNavigator.currentLanguage;
	}

	/**
	 * Formats the frequency of the given phrase.
	 *
	 * @param {Phrase} phrase The phrase.
	 * @param {NewPhraseCollection} collection The phrase collection.
	 * @returns {string} The formatted string.
	 */
	formatFrequency(phrase, collection) {
		if (this._frequencyFormatter === undefined)
			this._frequencyFormatter = new Intl.NumberFormat(this.local, {
				style: "decimal",
			});
		const formatter = this._frequencyFormatter;

		let freq = phrase.frequency;

		// floor to 2 significant digits if the frequency has more than 3 digits
		if (freq >= 1000) {
			let log = Math.ceil(Math.log10(freq));
			let factor = Math.pow(10, log - 2);
			freq = Math.floor(freq / factor) * factor;
		}

		return formatter.format(freq);
	}

	/**
	 * Formats the frequency percentage of the given phrase.
	 *
	 * @param {Phrase} phrase The phrase.
	 * @param {NewPhraseCollection} collection The phrase collection.
	 * @returns {string} The formatted string.
	 */
	formatPercentage(phrase, collection) {
		this._smallPercentageFormatter = this._smallPercentageFormatter || new Intl.NumberFormat(this.local, {
			style: "percent",
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		});
		this._largePercentageFormatter = this._largePercentageFormatter || new Intl.NumberFormat(this.local, {
			style: "percent",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		});

		const ratio = phrase.frequency / collection.totalFrequency;

		// this just means that if the rounded percentage is >= 10.0% then we'll use the other formatter
		const useLarge = Math.round(ratio * 1000) >= 100;
		const formatter = useLarge ? this._largePercentageFormatter : this._smallPercentageFormatter;

		return formatter.format(ratio);
	}

	/**
	 * Formats the phrase text of the given phrase.
	 *
	 * @param {Phrase} phrase The phrase.
	 * @param {NewPhraseCollection} collection The phrase collection.
	 * @returns {string} The formatted string.
	 */
	formatText(phrase, collection) {
		let html = "";

		/**
		 * @param {string} str
		 */
		let append = (str) => {
			if (html === "") html += str;
			else html += " " + str;
		};

		phrase.words.forEach(w => {
			let classes = [];

			// is operator
			if (w.type != Word.Types.WORD) {
				classes.push("operator");
			}

			// add type
			classes.push(String(Word.nameOfType(w.type)).toLowerCase().replace(/[^a-z]+/, "-"));

			append('<span class="' + classes.reduce((x, y) => x + " " + y) + '">' + w.text + '</span>');
		});

		return html;
	}

	/**
	 * Returns the default PhraseFormatter used by the NetspeakSearchBar.
	 *
	 * @returns {PhraseFormatter} A formatter.
	 */
	static getInstance() {
		return DEFAULT_PHRASE_FORMATTER;
	}
}

class NewPhraseCollection {

	/**
	 * @param {readonly Phrase[]} phrases
	 */
	constructor(phrases) {
		this.phrases = phrases;
		this._map = new Map(phrases.map(p => [p.id, p]));

		this.maxFrequency = phrases.reduce((max, curr) => Math.max(max, curr.frequency), 0);
		this.totalFrequency = phrases.reduce((total, curr) => total + curr.frequency, 0);
	}

	/**
	 * Returns the phrase with the given id of `undefined`.
	 *
	 * @param {string} id
	 * @returns {Phrase | undefined}
	 */
	byId(id) {
		return this._map.get(id);
	}

	[Symbol.iterator]() {
		return this.phrases[Symbol.iterator]();
	}

}

const DEFAULT_PHRASE_FORMATTER = new PhraseFormatter();


registerElement(NetspeakSearchBar);
registerElement(NetspeakSearchBarResultList);
