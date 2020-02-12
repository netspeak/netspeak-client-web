import { html, loadLocalization, NetspeakElement, registerElement } from './netspeak-element.js';
import { Netspeak } from "./netspeak.js";
import { encode, appendNewElements } from './util.js';


export class NetspeakCorpusSelector extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-corpus-selector'; }
	static get properties() {
		return {
			value: {
				type: String,
				notify: true,
				value: 'web-en'
			},
		};
	}
	static get template() {
		return html`
		<style>
			:host {
				display: table;
				padding: 0;
			}

			#wrapper {
				position: relative;
			}

			#wrapper .button {
				background-color: transparent;
				font-size: inherit;
				border: 1px solid #BBB;
				cursor: pointer;
				display: inline-block;
				margin-left: .5em;
				padding: .5em .75em;
			}

			#wrapper .button.selected {
				background-color: #EEE;
				border-color: #888;
			}

			#wrapper .button:hover {
				background-color: #EEE;
				color: #000;
			}
		</style>

		<div id="wrapper">
		</div>
		`;
	}


	/**
	 * Creates an instance of NetspeakCorpusSelector.
	 *
	 * @param {Netspeak} [api] The Netspeak API point to query the displayed corpora.
	 * @param {LabelProvider} [labelProvider] The label provider of the selector.
	 */
	constructor(api, labelProvider) {
		super();

		this.api = api || Netspeak.getInstance();
		this.labelProvider = labelProvider || new LabelProvider();

		this.addEventListener("value-changed", () => this._setValue(this.value));
	}

	/**
	 * The method called after the element was added to the DOM.
	 */
	connectedCallback() {
		super.connectedCallback();

		this.api.queryCorpora().then(corporaInfo => {
			/** @type {HTMLElement} */
			const wrapper = this.shadowRoot.querySelector("#wrapper");
			wrapper.innerHTML = "";

			// sort corpora
			const defaultSorting = [
				"web-en",
				"web-de"
			];

			corporaInfo.corpora.sort((a, b) => {
				let indexA = defaultSorting.indexOf(a.key);
				let indexB = defaultSorting.indexOf(b.key);
				if (indexA === -1) indexA = defaultSorting.length;
				if (indexB === -1) indexB = defaultSorting.length;
				return indexA - indexB;
			});

			for (const corpus of corporaInfo.corpora) {
				const value = corpus.key;
				const button = appendNewElements(wrapper, `button.button[data-value="${value}"]`);
				button.addEventListener("click", () => {
					this._setValue(value);
				});

				const text = appendNewElements(button, "span");
				text.textContent = corpus.name;

				this.labelProvider.getLabel(corpus).then(label => {
					text.innerHTML = label;
				}).catch(e => {
					console.error(e);
				});
			}

			this._setValue(this.value || corporaInfo.default || "web-en");
		});
	}

	_setValue(value) {
		if (value !== this.value) {
			this.value = value;
		}

		for (const element of this.shadowRoot.querySelectorAll(".selected")) {
			element.classList.remove("selected");
		}

		const newSelected = this.shadowRoot.querySelector(`[data-value="${value}"]`);
		if (newSelected) {
			newSelected.classList.add("selected");
		}
	}
}

const localLabels = loadLocalization(NetspeakCorpusSelector).then(json => {
	if (json && json.custom && json.custom.labels) {
		return /** @type {Object<string, string>} */ (json.custom.labels);
	}
	return false;
});

/**
 * A LabelProvider converts corpora into HTML source code.
 */
export class LabelProvider {

	/**
	 * Provides the label of the given corpus.
	 *
	 * @param {import("./netspeak.js").Corpus} corpus The corpus.
	 * @returns {Promise<string>} The label source code.
	 */
	getLabel(corpus) {
		return localLabels.then(labels => {
			if (labels && labels[corpus.name]) {
				return encode(labels[corpus.name]);
			} else {
				return encode(corpus.name);
			}
		});
	}

}

registerElement(NetspeakCorpusSelector);
