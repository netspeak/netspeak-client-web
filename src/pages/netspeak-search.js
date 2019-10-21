import { html, NetspeakElement, registerElement } from "../netspeak-app/netspeak-element.js";
import '../netspeak-app/netspeak-search-bar.js';
import '../netspeak-app/netspeak-corpus-selector.js';


export class NetspeakSearch extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-search'; }
	static get properties() { return {}; }
	static get template() {
		return html`

		<style>
			:host {
				display: block;
			}

			#wrapper {
				padding: 3em 1em;
				position: relative;
			}

			netspeak-corpus-selector {
				margin: 0 0 2em auto;
			}

			netspeak-search-bar {
				--result-font-family: 'Verdana', 'Geneva', sans-serif;
			}

			/*
			 * INFO
			 */

			#info {
				background-color: #EEE;
				border: 1px solid #BBB;
				box-shadow: 0 2px 1px 0 rgba(0, 0, 0, 0.2);
				clear: both;
				position: relative;

				margin-top: 2em;
			}

			#info #quick-examples {
				padding: .5em 1em;
				position: relative;
			}

			#info .example-container {
				clear: both;
				position: relative;
			}

			#info .example-container::after {
				clear: both;
				content: " ";
				display: table;
				position: relative;
				width: 100%;
			}

			#info .example-container a {
				color: #333;
			}

			#info .example,
			#info .explanation {
				padding: .25em 0;
			}

			#info .example {
				float: left;
			}

			#info .explanation {
				float: right;
				width: 50%;
			}

			#info .example > span {
				cursor: pointer;
				text-decoration: none;
			}
			#info .example > span:hover {
				text-decoration: underline;
			}

			.highlight-red,
			.token.q-mark,
			.token.asterisk,
			.token.plus {
				color: #c5000b;
			}

			.highlight-blue,
			.token.order-set,
			.token.option-set,
			.token.dict-set {
				color: #2d7db3;
			}

			@media screen and (max-width: 750px) {

				#wrapper {
					padding: 3em 0;
				}

				netspeak-search-bar {
					--icon-size: 20px;
					--icon-padding: 6px;
					--result-item-data-margin: 0 .5em;
					--input-margin: .5em;
					--result-border-right: none;
					--result-border-left: none;
				}

				netspeak-corpus-selector {
					margin: 0 .5em 2em auto;
				}

				/*
				 * INFO
				 */
				#info {
					margin-left: .5em;
					margin-right: .5em;
				}

			}

			@media screen and (max-width: 500px) {

				#info .example,
				#info .explanation {
					float: none;
					display: block;
					width: auto;
				}

				#info .explanation>* {
					padding-left: .5em;
				}

			}
		</style>

		<div id="wrapper">
			<netspeak-corpus-selector></netspeak-corpus-selector>
			<netspeak-search-bar></netspeak-search-bar>
		</div>
		`;
	}

	constructor() {
		super();
	}

	/**
	 * The method called after the element was added to the DOM.
	 */
	connectedCallback() {
		super.connectedCallback();

		/** @type {import("../netspeak-app/netspeak-search-bar").NetspeakSearchBar} */
		this.searchBar = /** @type {any} */ (this.shadowRoot.querySelector("netspeak-search-bar"));
		/** @type {import("../netspeak-app/netspeak-corpus-selector").NetspeakCorpusSelector} */
		this.corpusSelector = /** @type {any} */ (this.shadowRoot.querySelector("netspeak-corpus-selector"));

		this.searchBar.addEventListener("queryChange", () => {
			this.updateUrl();

			clearTimeout(this._writeHistoryInterval);
			this._writeHistoryInterval = setTimeout(() => this.writeHistory(), 500);
		});
		this.corpusSelector.addEventListener("valueChange", () => {
			this.searchBar.corpus = this.corpusSelector.value;
			this.searchBar.queryPhrases();

			this.updateUrl();
		});

		this.initializeSettingsFromUrl();
		this.loadHistory();
	}

	/**
	 * Sets the values of the elements of the page to the values specified in the URL.
	 */
	initializeSettingsFromUrl() {
		const params = new URLSearchParams(location.hash.replace(/^#/, ""));
		const query = params.get("q");
		const corpus = params.get("corpus");

		if (corpus) this.corpusSelector.value = corpus;
		if (query) this.searchBar.query = query;
	}

	/**
	 * This function will set the URLs query to the current query of the search bar.
	 */
	updateUrl() {
		const query = this.searchBar.query;
		const corpus = this.searchBar.corpus;

		const params = new URLSearchParams(location.hash.replace(/^#/, ""));
		params.set("q", query);
		params.set("corpus", corpus);

		location.hash = params.toString();
	}

	/**
	 * Loads the history of a search bar from the cookie.
	 */
	loadHistory() {
		try {
			let history = sessionStorage.getItem("history");
			if (history) {
				this.searchBar.history.push(...JSON.parse(history));
			}
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * Writes the history of the current search bar to the cookie.
	 */
	writeHistory() {
		const thisHistory = Array.from(this.searchBar.history);
		let oldJson;
		let oldHistory;
		try {
			oldJson = sessionStorage.getItem("history");
			oldHistory = oldJson ? JSON.parse(oldJson) : [];
		} catch (error) {
			console.error(error);
			return;
		}

		// merge
		const map = {};
		const addToMap = historyItem => {
			const id = historyItem.corpus + ";" + historyItem.query;
			if (!map[id] || map[id].time < historyItem.time) map[id] = historyItem;
		};
		oldHistory.forEach(addToMap);
		thisHistory.forEach(addToMap);

		const newHistory = [];
		for (const id in map) {
			newHistory.push(map[id]);
		}
		newHistory.sort((a, b) => a.time - b.time);

		const historyLimit = 20;
		if (newHistory.length > historyLimit) {
			newHistory.splice(0, newHistory.length - historyLimit);
		}

		const json = JSON.stringify(newHistory);
		if (sessionStorage.getItem("history") !== oldJson) {
			// modified -> try again
			this.writeHistory();
		} else {
			sessionStorage.setItem("history", json);
		}
	}

}

registerElement(NetspeakSearch);
