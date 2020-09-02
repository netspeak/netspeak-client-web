import { localStorage, navigator } from "./window-helper";

export const supportedLanguages: ReadonlySet<string> = new Set(["en", "de"]);
export type SupportedLanguage = "en" | "de";

export interface LocalizableProps {
	readonly lang: SupportedLanguage;
}

export type Locales<T> = { [K in SupportedLanguage]: T };
export type SimpleLocale<Keys extends string> = { [K in Keys]: string };
export type SupplierLocale<Keys extends string> = {
	[K in Keys]: () => JSX.Element;
};

export type LocalizerOf<L> = L extends Locales<infer T> ? Localizer<T> : never;
export type Localizer<T> = <K extends keyof T>(key: K) => T[K];
export function createLocalizer<T>(props: LocalizableProps, locales: Locales<T>): Localizer<T> {
	const { lang } = props;
	const locale = locales[lang];
	return key => locale[key];
}

const currentLangKey = "currentLang";

function detectCurrentLang(): SupportedLanguage | null {
	if (localStorage?.getItem(currentLangKey)) {
		// stored
		return localStorage.getItem(currentLangKey) as SupportedLanguage;
	}

	// match against users languages
	for (let l of navigator?.languages || []) {
		l = l.toLowerCase();
		if (supportedLanguages.has(l)) return l as SupportedLanguage;
		// reduce e.g. "en-US" to "en"
		l = (/^(\w+)-\w+$/.exec(l) || [])[1];
		if (supportedLanguages.has(l)) return l as SupportedLanguage;
	}

	return null;
}
export function getCurrentLang(): SupportedLanguage {
	const lang = detectCurrentLang();
	if (lang === null) {
		return "en";
	} else {
		return lang;
	}
}
export function setCurrentLang(lang: SupportedLanguage): void {
	localStorage?.setItem(currentLangKey, lang);
}
