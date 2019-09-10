import { html, NetspeakElement, registerElement } from './netspeak-element.js';
import { NetspeakNavigator } from './netspeak-navigator';
import { shadyQuerySelector } from './util';


class NetspeakHeader extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-header'; }
	static get properties() { return {}; }
	static get template() {
		return html`
		<style>
			:host {
				background: #323232;
				display: block;
				height: 32px;
				padding: 0 2.5em;
				border-bottom: 1px solid #727272;
				position: relative;
			}

			#logo {
				display: block;
				float: left;
				width: 121px;
				height: 32px;
				background-image: url('/src/img/netspeak-path-white-121x32.svg');
				background-size: contain;
				background-repeat: no-repeat;
				background-position: center;
			}

			#slogan {
				color: #FFF;
				font-size: 10pt;
				white-space: nowrap;
				display: block;
				float: left;
				padding-top: 10px;
				padding-left: 12px;
			}

			@media screen and (max-width: 750px) {

				:host {
					height: 48px;
				}

				#logo {
					display: block;
					float: none;
					margin: auto;
					height: 48px;
					width: 182px;
				}

				#slogan {
					display: none;
				}

			}
		</style>

		<a href="[[getStartUrl()]]" id="logo" on-click="_clearSearchBar"></a>
		<span id="slogan">
			One word leads to another.
		</span>
		<div style="clear: both"></div>
		`;
	}

	constructor() {
		super();
	}

	/**
	 * Returns the URL of the start page.
	 *
	 * @returns {string} The URL.
	 */
	getStartUrl() {
		return NetspeakNavigator.getPageUrl("");
	}

	_clearSearchBar() {
		/** @type {import("../pages/netspeak-search").NetspeakSearch} */
		const search = shadyQuerySelector(window.document, "netspeak-search");
		if (!search || !search.searchBar) return;
		search.searchBar.clear();
	}
}

registerElement(NetspeakHeader);
