import { html, loadLocalization, NetspeakElement, registerElement } from './netspeak-element.js';
import { Netspeak } from "./netspeak.js";
import { encode } from './util.js';


export class NetspeakCorpusSelector extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-corpus-selector'; }
	static get properties() {
		return {
			value: {
				type: String,
				notify: true,
				value: 'web-en',
				observer: '_valueChange',
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
				background: var(--background, #FFF);

				background-image: url("/src/img/down.svg");
				background-position: calc(100% - .5em) center;
				background-repeat: no-repeat;

				box-shadow: 0 2px 1px 0 rgba(0, 0, 0, 0.2);
				position: relative;
			}

			#wrapper #img {
				width: 16px;
				height: 16px;
				display: table;

				margin: auto;
				margin-right: 0;
				position: absolute;
			}

			#wrapper>select {
				-webkit-appearance: none;
				-moz-appearance: none;
				appearance: none;
				border-radius: 0;
				font-size: 1em;
				width: 100%;

				cursor: pointer;

				border: 1px solid #BBB;
				background: transparent;
				color: var(--color, #000);
				padding: .5em calc(1em + 16px) .5em 1em;
				margin: 0;
			}

			#wrapper>select>option {
				background: var(--background, #FFF);
				color: var(--color, #000);
			}

			#wrapper>select::-ms-expand {
				display: none;
			}
		</style>

		<div id="wrapper">
			<span id="img"></span>
			<select on-change="_onChange"> </select>
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
		this.labelProvider = labelProvider || LabelProvider.getDefault();
	}

	/**
	 * The method called after the element was added to the DOM.
	 */
	connectedCallback() {
		super.connectedCallback();

		this.api.queryCorpora().then(corporaInfo => {
			const select = this.shadowRoot.querySelector("select");
			select.innerHTML = "";

			for (let corpus of corporaInfo.corpora) {
				let option = document.createElement("OPTION");
				option.setAttribute("value", corpus.key);
				select.appendChild(option);

				this.labelProvider.getLabel(corpus).then(label => {
					option.innerHTML = label;
				}).catch(e => {
					console.error(e);
					option.textContent = corpus.name;
				});
			}

			if (this.value) {
				select.value = this.value;
			} else {
				if (corporaInfo.default) select.value = corporaInfo.default;
				this.value = select.value;
			}
		});
	}

	_valueChange(newValue, oldValue) {
		const select = this.shadowRoot.querySelector("select");
		if (select.value !== newValue) {
			select.value = newValue;
		}

		this.dispatchEvent(new CustomEvent("valueChange", {
			detail: {
				newValue: newValue,
				oldValue: oldValue,
			},
			bubbles: false,
			cancelable: false,
		}));
	}


	_onChange() {
		this.value = this.shadowRoot.querySelector("select").value;
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

	/**
	 * Returns the default LabelProvider used by the NetspeakCorpusSelector.
	 *
	 * @returns {LabelProvider} A label provider.
	 */
	static getDefault() {
		return defaultLabelProvide;
	}

}

const defaultLabelProvide = new LabelProvider();

registerElement(NetspeakCorpusSelector);
