/**
 * Returns a function, that, as long as it continues to be invoked, will not be triggered.
 * The function will be called after it stops being called for `wait` milliseconds.
 *
 * If `immediate` is `true`, trigger the function on the leading edge, instead of the trailing.
 *
 * @param func
 * @param wait
 * @param immediate
 * @returns
 */
export function debounce<T extends any[]>(
	func: (...args: T) => void,
	wait: number,
	immediate = false
): (...args: T) => void {
	let timeout: number | undefined = undefined;

	return function (...fnArgs: T) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const fnThis = this;

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = undefined;
			if (!immediate) func.apply(fnThis, fnArgs);
		}, wait) as any;

		if (immediate && timeout === undefined) func.apply(fnThis, fnArgs);
	};
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

/**
 * Encodes the given string such that it's a text literal.
 */
export function encode(html: string): string {
	return String(html).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/**
 * Returns a function which will execute the given function only once in the next frame.
 */
export function createNextFrameInvoker(func: () => void): () => void {
	let requested = false;
	const invoke = (): void => {
		requested = false;
		func();
	};

	return () => {
		if (!requested) {
			requested = true;

			if (typeof requestAnimationFrame === "undefined") {
				setTimeout(invoke, 16);
			} else {
				requestAnimationFrame(invoke);
			}
		}
	};
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
