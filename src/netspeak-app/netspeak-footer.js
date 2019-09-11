import { html, NetspeakElement, registerElement } from './netspeak-element.js';
import { NetspeakNavigator } from './netspeak-navigator';


class NetspeakFooter extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-footer'; }
	static get properties() { return {}; }
	static get template() {
		return html`
		<style>
			:host {
				display: block;
				background-color: #F8F8F8;
				font-size: 80%;
				color: #666;
				padding: 3em;
				line-height: 1.4;
			}

			#block-links,
			#block-langs {
				display: block;
			}

			#block-links {
				float: left;
			}

			#block-langs {
				float: right;
			}

			#block-links a,
			#block-langs a {
				display: inline-block;
				padding: .25em;
			}

			.block {
				display: table;
				float: left;
			}

			.block.margin {
				margin-right: 3em;
			}

			ul {
				padding: 0;
				margin: 0;
			}

			li {
				list-style: none;
				padding: 0;
				margin: 0;
			}

			a {
				color: inherit;
				text-decoration: none;
			}

			a.current-lang {
				text-decoration: underline;
			}

			a:hover {
				text-decoration: underline;
			}


			.webis-copyright {
				margin-top: 1em;
				text-align: right;
			}

			.bullet {
				padding: 15px;
			}


			@media screen and (max-width: 750px) {
				#block-links {
					margin-right: 0;
				}
				#block-links,
				#block-langs {
					padding: 0;
					display: block;
					float: none;
					margin-bottom: 1em;
				}

				:host {
					padding: 2em;
				}

				.block,
				.block.margin {
					display: table;
					float: left;
					width: 50%;
					margin: 0;
				}

			}
		</style>

<div>

	<div id="block-links">
		<div class="block margin">
			<ul>
				<li>
					<a href="[[getPageUrl('examples')]]" id="examples">
						Examples
					</a>
				</li>
				<li>
					<a href="[[getPageUrl('developer')]]" id="developer">
						Developer
					</a>
				</li>
				<li>
					<a href="https://github.com/netspeak" target="_blank" id="github">
						GitHub
					</a>
				</li>
				<li>
					<a href="https://www.uni-weimar.de/en/media/chairs/computer-science-department/webis/research/activities-by-field/netspeak/"
						target="_blank" id="labs">
						Labs
					</a>
				</li>
			</ul>
		</div>
		<div class="block">
			<ul>
				<li>
					<a href="[[getPageUrl('publisher')]]" id="publisher">Publisher</a>
				</li>
				<li>
					<a href="[[getPageUrl('terms')]]" id="terms">Terms</a>
				</li>
				<li>
					<a href="[[getPageUrl('privacy')]]" id="privacy">Privacy</a>
				</li>
			</ul>
		</div>
		<div style="clear: both"></div>
	</div>

	<div id="block-langs">
		<div class="block">
			<ul>
				<li>
					<a class$="[[isCurrentLang('de')]]" href$="[[getLangUrl('de')]]"
						id$="[[registerLang('de')]]">Deutsch</a>
				</li>
				<li>
					<a class$="[[isCurrentLang('en')]]" href$="[[getLangUrl('en')]]"
						id$="[[registerLang('en')]]">English</a>
				</li>
			</ul>
		</div>
		<div style="clear: both"></div>
	</div>

	<div style="clear: both"></div>

</div>

<div>
	<div class="webis-copyright">
		Copyright &copy; 2019 <a href="https://webis.de" target="_blank">Webis group</a> <span class="bullet">&bullet;</span>
		<a href="https://webis.de/people.html" target="_blank" id="contact">Contact</a> <span class="bullet">&bullet;</span>
		<a href="https://webis.de/impressum.html" target="_blank" id="impressum-and-privacy">Impressum&nbsp;/&nbsp;Privacy&nbsp;policy</a>
	</div>
</div>
		`;
	}


	constructor() {
		super();

		this.langRegister = {};
		NetspeakNavigator.addEventListener("urlChange", () => this.onUrlChange.apply(this));
	}

	/**
	 * Returns the URL a given page will have.
	 *
	 * @param {string} page The page.
	 * @returns {string} The URL.
	 */
	getPageUrl(page) {
		return NetspeakNavigator.getPageUrl(page);
	}
	/**
	 * Returns the URL the current page with a given language will have.
	 *
	 * @param {string} lang The language.
	 * @returns {string} The URL.
	 */
	getLangUrl(lang) {
		return NetspeakNavigator.getLanguageUrl(lang);
	}
	/**
	 * Returns CSS classes indicating whether the given language is the current language.
	 *
	 * @param {string} lang The language.
	 * @returns {string} The CSS class string.
	 */
	isCurrentLang(lang) {
		return (NetspeakNavigator.currentLanguage == lang) ? 'current-lang' : '';
	}

	/**
	 * Registers a new language link and returns the id the link should have.
	 *
	 * New language links have to be registered here in order to function properly.
	 *
	 * @param {string} lang The language.
	 * @returns The id.
	 */
	registerLang(lang) {
		this.langRegister[lang] = false;
		return "lang-" + lang;
	}

	/**
	 * A listener function for "urlChange"-events.
	 *
	 */
	onUrlChange() {
		// update the href of registered links
		for (let lang in this.langRegister) {
			if (!this.langRegister[lang]) {
				this.langRegister[lang] = this.shadowRoot.querySelector("#lang-" + lang);
			}
			let a = this.langRegister[lang];
			a.setAttribute("href", this.getLangUrl(lang));
		}
	}

}

registerElement(NetspeakFooter);
