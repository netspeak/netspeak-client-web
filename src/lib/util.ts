export function constructQueryParams(params: Readonly<Record<string, any>>): string {
	const list: string[] = [];

	for (const key in params) {
		if (Object.prototype.hasOwnProperty.call(params, key)) {
			const value = params[key];
			if (value === null || value === undefined || value === false) {
				// do nothing
			} else if (value === true) {
				list.push(encodeURIComponent(key));
			} else {
				list.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
			}
		}
	}

	if (list.length) {
		return "?" + list.join("&");
	} else {
		return "";
	}
}

/**
 * Returns the text content of a given HTML.
 */
export function textContent(html: string): string {
	// copied from PrismJS' markup definition
	html = html.replace(
		/<\/?(?!\d)[^\s>/=$<%]+(?:\s(?:\s*[^\s>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/g,
		""
	);
	const div = document.createElement("div");
	div.innerHTML = html;
	return div.textContent || "";
}

export function normalizeSpaces(str: string): string {
	return str.replace(/\s+/g, " ").trim();
}

export function optional<T>(condition: boolean, supplier: () => T): T | null {
	if (condition) {
		return supplier();
	} else {
		return null;
	}
}

export function delay(duration: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, duration);
	});
}

export function assertNever(value: never): never {
	throw new Error("Unreachable part has been reached with " + value);
}

/**
 * Returns a CSS `url()` of the given URL.
 *
 * @param url
 */
export function url(url: string): string {
	return `url(${JSON.stringify(url)})`;
}

let idCounter = 0;
/**
 * Returns a unique id.
 */
export function nextId(): number {
	idCounter = (idCounter + 1) & 0x7fffffff;
	return idCounter;
}

export enum LoadingState {
	/** Currently loading items. */
	LOADING,
	/** There are more items available to be loaded. */
	MORE_AVAILABLE,
	/** All available items were loaded. There are no items left to be loaded. */
	EXHAUSTED,
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};
