import { html, NetspeakElement, registerElement, loadLocalization } from "../netspeak-app/netspeak-element.js";

/**
 * A list of corpus specific example queries.
 *
 * @type {Object<string, Object<string, string>>}
 */
const exampleQueries = {
	"web-en": {
		"q-mark": "how to ? this",
		"dots": "see ... works",
		"option-set": "it's [ great well ]",
		"hash": "and knows #much",
		"order": "{ more show me }",
		"gap": "mind... the g?p",
	},
	"web-de": {
		"q-mark": "was ? das",
		"dots": "was ... hier ab",
		"option-set": "wie [ nützlich praktisch ]",
		// "hash": "and knows #much", // this feature isn't yet implemented on the server-side
		"order": "{ mehr zeig mir }",
		"gap": "M?t zur Lü...e",
	},
};

/**
 * The default corpus for which examples will be displayed in case the current corpus is unknown.
 */
const defaultCorpus = "web-en";


export class NetspeakExampleQueries extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-example-queries'; }
	static get noDefaultLocalization() { return true; }
	static get properties() {
		return {
			"corpus": {
				type: String,
				notify: true
			}
		};
	}
	static get template() {
		return html`

		<style>
			:host {
				display: block;
				color: #444;
			}

			#info {
				background-color: #F8F8F8;
				border: 1px solid var(--border-color);
				border-top: none;
				clear: both;
				position: relative;
			}

			#quick-examples {
				padding: .5em 1em;
				position: relative;
			}

			.example-container {
				clear: both;
				position: relative;
				padding: .1em 0;
			}

			.example-container::after {
				clear: both;
				content: " ";
				display: table;
				position: relative;
				width: 100%;
			}

			.example {
				float: left;
			}

			.explanation {
				float: right;
				width: 50%;
			}

			.example > span {
				cursor: pointer;
				text-decoration: none;
			}
			.example > span:hover {
				text-decoration: underline;
			}

			.token.q-mark,
			.token.asterisk,
			.token.plus {
				color: #c5000b;
			}

			.token.order-set,
			.token.option-set,
			.token.dict-set {
				color: #2d7db3;
			}

			@media screen and (max-width: 500px) {

				.example,
				.explanation {
					float: none;
					display: block;
					width: auto;
				}

				.explanation>* {
					padding-left: .5em;
				}

			}
		</style>

		<div id="info">
			<div id="quick-examples"></div>
		</div>
		`;
	}

	constructor() {
		super();

		this.corpus = defaultCorpus;
		this.addEventListener("corpus-changed", () => {
			this._renderExamples();
		});

		/**
		 * @type {undefined | Object<string, string>}
		 */
		this._localization = undefined;

		loadLocalization(NetspeakExampleQueries).then(json => {
			if (json) {
				this._localization = json.custom.queries;
				this._renderExamples();
			}
		});

		/**
		 * A counter for how many examples have been selected using this element.
		 *
		 * @type {number}
		 */
		this.clickCounter = 0;
	}

	/**
	 * The method called after the element was added to the DOM.
	 */
	connectedCallback() {
		super.connectedCallback();

		this._renderExamples();
	}

	_renderExamples() {
		if (!this.isConnected) return;
		if (!this._localization) return;

		const examples = exampleQueries[this.corpus] || exampleQueries[defaultCorpus];

		const container = this.shadowRoot.querySelector("#quick-examples");
		container.innerHTML = "";

		// @ts-ignore
		const highlight = code => Prism.highlight(code, Prism.languages['netspeak-query'], 'netspeak-query');

		for (const exampleKey in examples) {
			const query = examples[exampleKey];

			const exContainer = container.appendChild(document.createElement("div"));
			exContainer.className = "example-container";

			exContainer.innerHTML = `
				<div class="example"><span>${highlight(query)}</span></div>
				<div class="explanation">${highlight(this._localization[exampleKey])}</div>
			`;

			exContainer.querySelector(".example > span").addEventListener("click", () => {
				this._querySelected(query);
			});
		}
	}

	_querySelected(query) {
		this.clickCounter++;

		this.dispatchEvent(new CustomEvent("query-selected", {
			detail: { query },
			bubbles: false,
			cancelable: false,
		}));
	}

}

registerElement(NetspeakExampleQueries);
