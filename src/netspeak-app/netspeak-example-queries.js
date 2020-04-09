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
		"gap": "m...d ? g?p",
	},
	"web-de": {
		"q-mark": "was ? das",
		"dots": "was ... hier ab",
		"option-set": "wie [ nützlich praktisch ]",
		// "hash": "and knows #much", // this feature isn't yet implemented on the server-side
		"order": "{ rum richtig }",
		"gap": "M?t ? Lü...e",
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
				border: 1px var(--border-color);
				border-style: none var(--left-right-border-style) solid var(--left-right-border-style);
				clear: both;
				position: relative;
				padding: .5em 1em;
			}

			table {
				width: 100%;
				padding: 0;
				margin: 0;
				border: none;
				border-collapse: none;
				border-spacing: 0;
			}
			tr {
				padding: 0;
			}
			td {
				padding: .125em 0;
			}

			.example {
				white-space: nowrap;
			}
			.explanation {
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

				.spacer {
					display: none;
				}

				tr {
					display: block;
					padding: .2em 0
				}

				.example,
				.explanation {
					display: inline-block;
					width: auto;
					padding: 0;
				}

				.example {
					color: #222;
					font-size: 105%;
				}

				.explanation {
					color: #666;
					font-size: 100%;
				}
				.explanation::before {
					content: "–";
					display: inline;
					padding: 0 .5em;
				}

			}
		</style>

		<div id="info">
			<table></table>
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

		const table = this.shadowRoot.querySelector("table");
		table.innerHTML = "";

		/**
		 * @param {string} code
		 * @returns {string}
		 */
		function highlight(code) {
			// @ts-ignore
			return Prism.highlight(code, Prism.languages['netspeak-query'], 'netspeak-query');
		}

		for (const exampleKey in examples) {
			const query = examples[exampleKey];

			const tr = table.appendChild(document.createElement("tr"));

			tr.innerHTML = `
				<td class="example"><span>${highlight(query)}</span></td>
				<td class="spacer"></td>
				<td class="explanation">${highlight(this._localization[exampleKey])}</td>
			`;

			tr.querySelector(".example > span").addEventListener("click", () => {
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
