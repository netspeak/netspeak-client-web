import { html, NetspeakElement, registerElement } from "../netspeak-app/netspeak-element.js";
import { startClickableSearchBars } from "../netspeak-app/util.js";
import '../netspeak-app/netspeak-search-bar.js';
import '../netspeak-app/netspeak-corpus-selector.js';


export class NetspeakSearch extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-search'; }
	static get template() {
		return html`

		<style>
			:host {
				display: block;
				max-width: 500px;
			}

			#wrapper {
				padding: 3em 0;
				position: relative;
			}

			netspeak-corpus-selector {
				margin: 0 0 2em auto;
			}

			netspeak-search-bar {
				--result-font-family: 'Verdana', 'Geneva', sans-serif;
			}

			@media screen and (max-width: 500px) {

				#wrapper {
					padding: 3em 0;
				}

				netspeak-search-bar {
					--icon-size: 20px;
					--icon-padding: 5px;
					--left-right-padding: .5em;
					--input-margin: .5em;
					--left-right-border-style: none;
				}

				netspeak-corpus-selector {
					margin: 0 .5em 2em auto;
				}

			}

		</style>

		<div id="wrapper">
			<netspeak-corpus-selector></netspeak-corpus-selector>
			<netspeak-search-bar info-visible-by-default></netspeak-search-bar>
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
		window.addEventListener("hashchange", () => this.initializeSettingsFromUrl());

		this.initializeSettingsFromUrl();
		this.loadHistory();

		startClickableSearchBars();
	}

	/**
	 * Sets the values of the elements of the page to the values specified in the URL.
	 */
	initializeSettingsFromUrl() {
		const params = new URLSearchParams(location.hash.replace(/^#/, ""));
		const query = params.get("q");
		const corpus = params.get("corpus");

		if (corpus != null) this.corpusSelector.value = corpus;
		if (query != null) this.searchBar.query = query;
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

		const newUrl = location.href.replace(/#[\s\S]*$/, "") + "#" + params.toString();
		if (newUrl !== location.href) {
			history.pushState(null, "", newUrl);
		}
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
