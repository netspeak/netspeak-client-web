import { PolymerElement, html as html_tag } from '@polymer/polymer';
import { NetspeakNavigator } from './netspeak-navigator';


/**
 * @typedef LocalizationJson
 * @property {Object<string, string>} [template]
 * @property {any} [custom]
 */

/**
 * Loads the localization of the current language for the given class.
 *
 * The given class is required to have static `is` and `importMeta` properties as `PolymerElement`s should.
 *
 * The returned promise will resolve to `false` if the current language is the default language (en).
 *
 * @param {Function} constructor
 * @returns {Promise<LocalizationJson | false>}
 */
export function loadLocalization(constructor) {
	let promise = localizationCache.get(constructor);

	if (!promise) {
		/** @type {string} */
		const is = constructor.is;
		/** @type {{ url: string }} */
		const meta = constructor.importMeta;

		if (meta && meta.url && is) {
			const currentLang = NetspeakNavigator.currentLanguage;
			if (currentLang == NetspeakNavigator.defaultLanguage) {
				promise = Promise.resolve(false);
			} else {
				const url = new URL(meta.url);
				url.hash = url.search = "";
				const dir = url.pathname.replace(/\/[^/]*$/, '');
				url.pathname = `${dir}/locales/${is}.${currentLang}.json`;
				promise = fetch(url.href).then(resp => resp.json());
			}
		} else if (!is) {
			promise = Promise.reject(`No 'is' property on ${constructor.name}`);
		} else {
			promise = Promise.reject(`No 'importMeta' property on ${constructor.name} (is: ${is})`);
		}

		localizationCache.set(constructor, promise);
	}

	return promise;
}
/** @type {Map<Function, Promise<LocalizationJson | false>>} */
const localizationCache = new Map();


/**
 * A localizable element with support for PrismJS.
 */
export class NetspeakElement extends PolymerElement {

	constructor() {
		super();

		// this is the latest we want to preload the localization
		loadLocalization(this.constructor);
	}

	/**
	 * The method called after the element was added to the DOM.
	 */
	connectedCallback() {
		super.connectedCallback();

		loadLocalization(this.constructor).then(json => {
			const shadowRoot = this.shadowRoot;

			if (shadowRoot && json && typeof json.template === "object") {
				const template = json.template;

				for (const element of shadowRoot.querySelectorAll('[id]')) {
					let text;
					if (element.id && typeof (text = template[element.id.toLowerCase()]) === "string") {
						// only insert the text if the element doesn't contain other elements
						if (element.childElementCount === 0) {
							element.textContent = text;
						}
					}
				}
			}
		}).catch(e => { /* ignore all errors. */ });

		this.styleCode();
	}

	/**
	 * The method called after the element was removed from the DOM.
	 */
	disconnectedCallback() {
		super.disconnectedCallback();
	}

	/**
	 * Styles all code elements with a language-xxxx class.
	 *
	 * This will not affect elements which are highlighted already.
	 * If Prism is not defined, then this method will do nothing.
	 */
	styleCode() {
		if (!window.Prism) return;

		this.shadowRoot.querySelectorAll("code[class*=\"language-\"]:not([highlighted])").forEach(e => {
			window.Prism.highlightElement(e);
			e.setAttribute("highlighted", "");
		});
	}
}

export const html = html_tag;

/**
 * A version of the usual `html` tag which uses raw strings.
 *
 * @param {TemplateStringsArray} strings
 * @param {any[]} values
 */
export const htmlR = (strings, ...values) => {
	/** @type {any} */
	const newStrings = [...strings.raw];
	newStrings.raw = strings.raw;
	return html_tag(newStrings, ...values);
};
