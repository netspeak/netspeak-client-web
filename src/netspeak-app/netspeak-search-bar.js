import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { Netspeak, PhraseCollection, Word, normalizeQuery } from "./netspeak.js";
import { Snippets } from "./snippets";
import { newElement, appendNewElements, textContent } from "./util.js";


/**
 * @typedef QueryPhrasesOptions
 * @property {"append" | "overwrite"} [options.appendMode="overwrite"] How the queried phrases will be integrated into the existing ones. "append": All of the new phrases will be added. "overwrite": All already queried phrases will be removed and the newly queried will be added.
 * @property {number} [options.topk=this.initialLimit] The maximum number of phrases queried.
 * @property {number} [options.maxfreq=2**64-1] The maximum frequency a phrase is allowed to have.
 * @property {boolean} [options.focusInput=false] Whether the input box will be focused after the phrases were displayed.
 * @property {import("./netspeak.js").NetspeakSearchOptions} [options.searchOptions={}] The search option passed to Netspeak.search.
 */

/**
 * The Netspeak search bar can query and display phrases queried using the Netspeak API.
 *
 * @customElement
 * @polymer
 */
export class NetspeakSearchBar extends PolymerElement {
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
				observer: '_corpusChanged',
			},

			initialLimit: {
				type: Number,
				value: 30,
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

		};
	}
	static get template() {
		return html`
		<style>
			:host {
				display: block;
				font-size: 1em;
			}

			table,
			tbody,
			tr,
			td {
				margin: 0;
				padding: 0;
				border-spacing: 0;
			}

			/*
			 * BUTTONS
			 */

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
				display: block;
				margin: 0;
				opacity: .5;
				padding: var(--icon-padding, 4px);
				position: relative;
			}

			:not(.btn-img)>.btn-img:hover {
				opacity: .8;
			}

			.btn-img>span.btn-img {
				background-position: center;
				background-repeat: no-repeat;
				background-size: contain;
				display: block;
				margin: auto;
				padding: 0;
				width: var(--icon-size, 16px);
				height: var(--icon-size, 16px);
			}

			/*
			 * INPUT
			 */

			#box {
				display: block;
				border: 1px solid #BBB;
				border-bottom: none;
				box-shadow: 0 2px 1px 0 rgba(0, 0, 0, 0.2);
				margin: var(--input-margin, 0 0 .25em 0);
				font-family: var(--input-font-family, inherit);
			}

			#box table,
			#box table td:first-child {
				width: 100%;
			}

			#box input {
				border: none;
				display: block;
				box-sizing: border-box;
				width: 100%;
				padding: .5em;
				font-family: var(--input-font-family, inherit);
				font-size: 100%;
			}

			#box input::-ms-clear {
				display: none;
			}

			#box button.btn-img {
				padding-top: .5em;
				padding-bottom: .5em;
				display: table;
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

			#drop-down-positioner {}

			#drop-down {
				position: absolute;
				background-color: white;
				box-shadow: 0 2px 1px 0 rgba(0, 0, 0, 0.2);
				border: 1px solid #BBB;
				width: 15em;
				margin-left: -15em;
				z-index: 10;
				font-size: 1em;
			}

			#drop-down .option {
				padding: .5em 1em;
				border-bottom: 1px solid #BBB;
				cursor: pointer;
			}

			#drop-down .option:nth-child(2n) {
				background-color: #F8F8F8;
			}

			#drop-down .option:hover {
				background-color: #EEE;
			}

			#drop-down .option:last-child {
				border-bottom: none;
			}

			/*
			 * WRAPPER
			 */

			#result-wrapper {
				border-top: var(--result-border-top, 1px solid #BBB);
				border-right: var(--result-border-right, 1px solid #BBB);
				border-bottom: var(--result-border-bottom, 1px solid #BBB);
				border-left: var(--result-border-left, 1px solid #BBB);
				font-family: var(--result-font-family, inherit);
			}

			/*
			 * ERRORS
			 */

			div#errors {
				display: block;
			}

			div#errors>p {
				background-color: #EAA;
				color: #300;
				display: block;
				padding: 1em 2em;
				margin: 0;
			}

			/*
			 * RESULT
			 */

			#result-list>div {
				background-color: #FFF;
				border-top: var(--result-item-border, 1px solid #DDD);
			}

			#result-list>div:first-child {
				border-top: none;
			}

			#result-list>div:nth-child(2n) {
				background-color: #F8F8F8;
			}

			#result-list>div:hover {
				background-color: #EEE;
			}

			#result-list table {
				margin: var(--result-item-data-margin, 0);
				display: block;
			}

			#result-list table td:first-child {
				width: 100%;
				background-repeat: no-repeat;
				background-position-x: 100%;
				background-image: url("/src/img/frequency-bar.svg");
			}

			#result-list span.text,
			#result-list span.freq {
				text-shadow: 0 1px 1px #FFF;
				padding: var(--result-item-data-text-padding, .25em .5em);
			}

			#result-list span.text {
				float: left;
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

			/*
			 * SYNTAX HIGHLIGHTING
			 */

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

			/*
			 * PIN
			 */

			#result-list .pinned>span.btn-img {
				background-image: url("/src/img/pin.svg");
			}

			#result-list [pinned] .pinned {
				opacity: 1;
			}

			/*
			 * EXAMPLES
			 */

			#result-list .examples>span.btn-img {
				background-image: url("/src/img/plus.svg");
			}

			#result-list [options-visible] .examples>span.btn-img {
				background-image: url("/src/img/minus.svg");
			}

			#result-list .loading {
				cursor: default;
				opacity: 1;
			}

			#result-list .loading>span.btn-img {
				background-image: url("/src/img/loading.svg");
			}


			#result-list div.options {
				display: none;
				padding: 1em;
				background-color: #EEE;
				box-shadow: 0 4px 32px rgba(0, 0, 0, .1) inset;
			}

			#result-list [options-visible] div.options {
				display: block;
			}


			#result-list div.options .example {
				font-size: 80%;
				word-break: break-word;
			}

			#result-list div.options .example em {
				font-weight: bold;
			}

			#result-list div.options .example a {
				color: inherit;
				opacity: .7;
				padding: 0 .5em;
			}

			#result-list div.options .example a::after {
				content: "\\21F1";
				display: inline-block;
				transform: rotate(90deg);
			}

			#result-list div.options .load-more {
				cursor: pointer;
				display: block;
				position: relative;
				width: 100%;
			}

			#result-list div.options .load-more>* {
				margin-left: auto;
				margin-top: auto;
			}

			/*
			 * LOAD MORE
			 */

			#load-more-container {
				border-top: 1px solid #BBB;
				cursor: pointer;
				position: relative;
				margin: 0;
				padding: 0;
				display: block;
				width: 100%;
			}

			#load-more-container:hover {
				background-color: #EEE;
			}

			*:hover>span.load-more-img {
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

		<div id="result-wrapper" style="display: none">

			<div id="errors"></div>

			<div id="result-list"> </div>

			<button id="load-more-container" style="display: block;" on-click="_loadMoreClick">
				<span class="load-more-img"></span>
			</button>

		</div>

		<div id="img-pre-loader"></div>
		`;
	}

	/**
	 * The pinned phrases of the search bar.
	 *
	 * @type {PhraseCollection}
	 */
	get pinnedPhrases() {
		return this._pinnedPhrases;
	}
	set pinnedPhrases(value) {
		if (Array.isArray(value))
			value = PhraseCollection.from(value);
		else if (!(value instanceof PhraseCollection))
			throw new TypeError("The value of pinnedPhrases has to be either an array or a PhraseCollection.");

		this._pinnedPhrases = value;
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
	 * The client used to query data provided by the Netspeak API.
	 *
	 * @type {Netspeak}
	 */
	get netspeakApi() {
		return this._netspeakApi;
	}

	/**
	 * The client used to query data provided by the ChatNoir API.
	 *
	 * @type {Snippets}
	 */
	get snippetsApi() {
		return this._snippetsApi;
	}

	/**
	 * The phrase formatter used.
	 *
	 * @type {PhraseFormatter}
	 */
	get phraseFormatter() {
		return this._phraseFormatter || PhraseFormatter.getDefault();
	}
	set phraseFormatter(value) {
		this._phraseFormatter = value;
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

		this._connected = false;

		this._netspeakApi = new Netspeak();
		this._snippetsApi = new Snippets();

		this._pinnedPhrases = new PhraseCollection();
		this._queriedPhrases = new PhraseCollection();

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

		// for debugging
		window.bar = this;
	}

	/**
	 * The method called after the element was added to the DOM.
	 *
	 */
	connectedCallback() {
		super.connectedCallback();

		this._connected = true;
		/** @type {HTMLInputElement} */
		this._queryInputElement = this.shadowRoot.querySelector("#query-input");
		/** @type {HTMLButtonElement} */
		this._clearButton = this.shadowRoot.querySelector("#clear-button");
		/** @type {HTMLButtonElement} */
		this._historyButton = this.shadowRoot.querySelector("#history-button");

		this._historyHiddenChanged(this.historyHidden);
	}

	/**
	 * The method called after the element was removed from the DOM.
	 *
	 */
	disconnectedCallback() {
		super.disconnectedCallback();

		this._connected = false;
		this._queryInputElement = this._clearButton = this._historyButton = undefined;
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

	_corpusChanged(newValue, oldValue) {
		this.dispatchChangeEvent("corpusChange", newValue, oldValue);
	}

	_queryChanged(newValue, oldValue) {
		if (this._queryChanging)
			throw Error("You cannot modify the query during a query change event");
		this._queryChanging = true;

		try {
			const focusInput = Boolean(this._focusInput);
			this._focusInput = false;

			this.dispatchChangeEvent("queryChange", newValue, oldValue);

			this.queryPhrases({ focusInput: focusInput });
		} finally {
			this._queryChanging = false;
		}
	}
	_queryInputChange(e) {
		if (this.readonly) return;

		const query = e.target.value;

		this._focusInput = true;
		if (query != this.query) this.query = query;
		else this.queryPhrases();
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
	 * @param {QueryPhrasesOptions} [options={}]
	 */
	queryPhrases(options = {}) {
		const searchOptions = options.searchOptions || {};

		// request
		const request = {
			query: this.query,
			corpus: this.corpus,
			focusInput: !!options.focusInput,
		};

		// add to history
		if (request.query && request.corpus) this._addToHistory({ query: request.query, corpus: request.corpus }, true);

		const addToRequest = (prop, defaultValue = undefined) => {
			if (options[prop] != undefined) request[prop] = options[prop];
			else if (defaultValue !== undefined) request[prop] = defaultValue;
		};
		addToRequest("topk", this.initialLimit);
		addToRequest("maxfreq");


		// a more expensive search for the first query
		if (!this._hadFirstQuery) {
			this._hadFirstQuery = true;
			if (!("topkMode" in searchOptions)) {
				searchOptions.topkMode = "fill";
			}
		}

		const append = options.appendMode == "append";

		let searchResult;
		if (!normalizeQuery(request.query)) {
			// note that this optimization will also catch the first empty query from the polymer query change event.
			searchResult = Promise.resolve(/** @type {import("./netspeak").NetspeakSearchResult} */([]));
		} else {
			searchResult = this.netspeakApi.search(request, searchOptions);
		}

		searchResult.then(phrases => {
			this._onSearchSuccess(phrases, request, append);
		}).catch(reason => {
			this._onSearchError(reason, request, append);
		});
	}

	/**
	 *
	 * @param {import("./netspeak").NetspeakSearchResult} phrases
	 * @param {{ query: string, corpus: string, focusInput: boolean }} request
	 * @param {boolean} append
	 */
	_onSearchSuccess(phrases, request, append = false) {
		if (this.query !== request.query) return; // too late

		let newPhrases = phrases.length;
		this.errorMessage = "";
		if (append) {
			newPhrases = this._queriedPhrases.addAll(phrases);
		} else {
			this._queriedPhrases = PhraseCollection.from(phrases);
		}

		// show load more ?
		const showLoadMore = !phrases.complete && newPhrases > 0;
		this.shadowRoot.querySelector("#load-more-container").style.display = showLoadMore ? "block" : "none";

		this.update(request.focusInput);
	}
	/**
	 *
	 * @param {string | Error} message
	 * @param {{ query: string, corpus: string, focusInput: boolean }} request
	 * @param {boolean} append
	 * @param {number} delay
	 */
	_onSearchError(message, request, append = false, delay = 1000) {
		if (this.query !== request.query) return; // too late

		// delay
		if (delay > 0) {
			setTimeout(() => this._onSearchError(message, request, append, 0), delay);
			return;
		}

		// disable load more
		this.shadowRoot.querySelector("#load-more-container").style.display = "none";

		console.error(message, request);

		this.errorMessage = message;
		if (!append) this._queriedPhrases = new PhraseCollection();
		this.update(request.focusInput);
	}

	update(focusInput = false) {
		// declare variables
		const pinnedPhrases = this.pinnedPhrases;
		const queriedPhrases = this.queriedPhrases;
		const pinning = true;

		const phrases = new PhraseCollection();
		if (pinning)
			phrases.addAll(pinnedPhrases);
		phrases.addAll(queriedPhrases);

		// formatter
		let formatter = this.phraseFormatter;

		// iterate through all phrases
		/** @type {HTMLElement[]} */
		const children = [];
		phrases.forEach((p, i) => {
			const e = newElement("DIV");

			e.setAttribute("text", p.text);
			e.setAttribute("freq", String(p.frequency));
			e.setAttribute("query", p.query);
			e.setAttribute("corpus", p.corpus);
			if (pinnedPhrases.includes(p))
				e.setAttribute("pinned", "");

			const tr = appendNewElements(e, "TABLE", "TBODY", "TR");

			const td = appendNewElements(tr, "TD");
			const relativeFreq = p.frequency / phrases.maxFrequency;
			td.style.backgroundSize = (relativeFreq * .618 * 100) + "% 100%";

			appendNewElements(td, "DIV", "SPAN.text").innerHTML = formatter.formatText(p, phrases);
			const freq = appendNewElements(td, "SPAN.freq");
			freq.innerHTML = formatter.formatFrequency(p, phrases);
			appendNewElements(freq, "SPAN.percentage").innerHTML = formatter.formatPercentage(p, phrases);

			const examplesBtn = appendNewElements(tr, "TD", "SPAN.btn-img.examples");
			examplesBtn.onclick = () => this._toggleItemOptions(e);
			appendNewElements(examplesBtn, "SPAN.btn-img");

			if (pinning) {
				const pinningBtn = appendNewElements(tr, "TD", "SPAN.btn-img.pinned");
				pinningBtn.onclick = () => this._toggleItemPinned(e);
				appendNewElements(pinningBtn, "SPAN.btn-img");
			}

			children.push(e);
		});

		// wrapper
		/** @type {HTMLDivElement} */
		const wrapper = this.shadowRoot.querySelector("#result-wrapper");
		let showWrapper = children.length > 0;

		// output result
		/** @type {HTMLDivElement} */
		const resList = this.shadowRoot.querySelector("#result-list");

		// copy options
		resList.querySelectorAll("div[text][options-visible]").forEach(e => {
			const text = e.getAttribute("text");
			const corpus = e.getAttribute("corpus");
			if (!text || !corpus) return;

			const child = children.find(c => c.getAttribute("text") == text && c.getAttribute("corpus") == corpus);
			if (!child) return;

			const options = e.querySelector("div.options");
			if (!options) return;

			e.removeChild(options);
			child.appendChild(options);
			child.setAttribute("options-visible", "");
		});

		// output the result
		resList.innerHTML = '';
		children.forEach(c => resList.appendChild(c));


		// output errors
		/** @type {HTMLElement} */
		const errors = this.shadowRoot.querySelector("#errors");
		errors.innerHTML = '';
		if (this.errorMessage) {
			appendNewElements(errors, "P").innerHTML = String(this.errorMessage);
			showWrapper = true;
		}

		// wrapper
		wrapper.style.display = showWrapper ? "block" : "none";

		if (focusInput && this._queryInputElement) {
			this._queryInputElement.focus();
		}
	}


	/**
	 * Toggles the pinned status of phrase phrase given an item of the result list.
	 *
	 * @param {HTMLElement} resultListItem The item representing the phrase.
	 */
	_toggleItemPinned(resultListItem) {
		const text = resultListItem.getAttribute("text");

		if (this.pinnedPhrases.includes(text)) {
			this.pinnedPhrases.remove(text);
			resultListItem.removeAttribute("pinned");
		} else {
			const p = this.queriedPhrases.get(text);
			if (p) {
				this.pinnedPhrases.add(p);
				resultListItem.setAttribute("pinned", '');
			}
		}
	}


	/**
	 * Adds the option panel to the given result list item.
	 *
	 * @param {HTMLElement} resultListItem The item representing the phrase.
	 */
	_toggleItemOptions(resultListItem) {
		if (resultListItem.hasAttribute("options-visible")) {
			resultListItem.removeAttribute("options-visible");
		} else {
			resultListItem.setAttribute("options-visible", "");
			if (!resultListItem.querySelector("div.options")) {
				const e = appendNewElements(resultListItem, "DIV.options");

				const text = resultListItem.getAttribute("text");
				const corpus = resultListItem.getAttribute("corpus");
				const wrapper = appendNewElements(e, "DIV");

				this._loadExamples(wrapper, text, corpus);
			}
		}
	}

	/**
	 * @param {HTMLElement} e
	 * @param {string} text
	 * @param {string} corpus
	 * @param {number} [page]
	 * @param {number} [pageSize]
	 */
	_loadExamples(e, text, corpus, page = 0, pageSize = this.initialExamplesLimit) {
		// add loading
		appendNewElements(e, "SPAN.btn-img.loading", "SPAN.btn-img");

		// fetch
		this.snippetsApi.search({ query: text, size: pageSize, from: page * pageSize }).then(res => {
			this._showExamples(e, {
				text, corpus, page, pageSize,
				examples: res.results.map(r => {
					const snippet = r.snippet + "...";
					const source = r.target_uri;
					return { snippet: snippet, source: source };
				})
			});
		});
	}
	/**
	 *
	 * @param {HTMLElement} e
	 * @param {Examples} examples
	 *
	 * @typedef Examples
	 * @property {string} text
	 * @property {string} corpus
	 * @property {number} page
	 * @property {number} pageSize
	 * @property {{ snippet: string, source: string }[]} examples
	 */
	_showExamples(e, examples) {
		// remove loading
		e.querySelector("SPAN.btn-img.loading").remove();

		// no examples found
		if (examples.examples.length == 0) return;

		// snippets that are added already
		/** @type {string[]} */
		const existingSnippets = [];
		e.querySelectorAll("p.example").forEach(p => existingSnippets.push(p.textContent || ''));

		// add examples
		let added = 0;
		this._filterExamples(examples, existingSnippets).forEach(example => {
			const p = appendNewElements(e, "DIV", "P.example");
			p.innerHTML = example.snippet;
			appendNewElements(p, "A").setAttribute("href", example.source);
			added++;
		});

		// load more
		const text = examples.text;
		const corpus = examples.corpus;
		const nextPage = examples.page + 1;
		const pageSize = examples.pageSize;

		// load more if none were displayed
		if (added < 1) {
			this._loadExamples(e, text, corpus, nextPage, pageSize);
			return;
		}

		// add button
		const btn = appendNewElements(e, "BUTTON.load-more");
		appendNewElements(btn, "SPAN.load-more-img");

		btn.addEventListener('click', () => {
			btn.remove();
			this._loadExamples(e, text, corpus, nextPage, pageSize);
		});
	}
	/**
	 * This filters the given examples.
	 *
	 * Some examples will be duplicates and some don't even include the phrase we're searching for.
	 * This method will return a list in which none of this useless examples are included.
	 *
	 * @param {Examples} examples
	 * @param {string[]} [existingSnippets] A list of snippets which have already been displayed.
	 */
	_filterExamples(examples, existingSnippets = []) {
		const res = [];
		const text = examples.text.toLowerCase();

		// make a hash set
		const snippetSet = new Set(existingSnippets.map(s => s.toLowerCase()));

		for (let example of examples.examples) {
			const snippet = textContent(example.snippet).toLowerCase();

			// does the snippet contain the text?
			if (!snippet.includes(text)) continue;

			// equal to any other snippet ?
			if (snippetSet.has(snippet)) continue;

			snippetSet.add(snippet);
			res.push(example);
		}
		return res;
	}


	_loadMoreClick(e) {
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
		this._pinnedPhrases = new PhraseCollection();
		this._queriedPhrases = new PhraseCollection();
		this.query = "";
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
		if (!this._connected) return;

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
				opt.innerHTML = query;
				opt.onclick = () => {
					this._toggleHistoryDropDown(false);
					this.query = query;
				};
			};

			history.forEach(i => newOpt(i.query));
			if (history.length == 0) newOpt("");

			dd.focus();
		} else {
			container.removeAttribute("history-visible");
			container.querySelector("#drop-down").blur();
		}
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
	constructor() { }

	/**
	 * Formats the frequency of the given phrase.
	 *
	 * @param {Phrase} phrase The phrase.
	 * @param {PhraseCollection} collection The phrase collection.
	 * @returns {string} The formatted string.
	 */
	formatFrequency(phrase, collection) {
		if (this._frequencyFormatter === undefined)
			this._frequencyFormatter = new Intl.NumberFormat(undefined, {
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
	 * @param {PhraseCollection} collection The phrase collection.
	 * @returns {string} The formatted string.
	 */
	formatPercentage(phrase, collection) {
		if (this._percentageFormatter === undefined)
			this._percentageFormatter = new Intl.NumberFormat(undefined, {
				style: "percent",
				minimumFractionDigits: 1,
				maximumFractionDigits: 1,
			});
		const formatter = this._percentageFormatter;

		return formatter.format(phrase.frequency / collection.totalFrequency);
	}

	/**
	 * Formats the phrase text of the given phrase.
	 *
	 * @param {Phrase} phrase The phrase.
	 * @param {PhraseCollection} collection The phrase collection.
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
	static getDefault() {
		return DEFAULT_PHRASE_FORMATTER;
	}
}

const DEFAULT_PHRASE_FORMATTER = new PhraseFormatter();


window.customElements.define(NetspeakSearchBar.is, NetspeakSearchBar);
