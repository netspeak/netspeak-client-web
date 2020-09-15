let idCounter = 0;

/**
 * Queries the JSON result for the given URL.
 *
 * The given URL is not allowed to contain a `callback` parameter.
 *
 * @param url
 * @param timeout
 * @returns
 */
export function jsonp<T>(url: string, timeout = 20000): Promise<T> {
	return new Promise((resolve, reject) => {
		try {
			if (!url) throw new Error("url cannot be " + url);

			// DO NOT use URL here
			// Edge can't handle it. I'm serious. Edge can't even build an URL.

			// check for callback
			if (/[&?]callback=/i.test(url)) throw new Error("url is not allowed to contain a callback parameter.");

			// convenience functions
			const addCallback = (id: string, callback: (value: T) => void): string => {
				(window as any)[id] = callback;
				return id;
			};
			const removeCallback = (id: string, timeoutId: number): void => {
				// timeout
				window.clearTimeout(timeoutId);
				// remove callback
				delete window[id as any];
				// remove script
				const script = document.getElementById(id);
				if (script) script.remove();
			};

			// id
			const id = "jsonp$$" + idCounter++;
			// eslint-disable-next-line prefer-const
			let timeoutId: number;

			// callbacks
			const callbackSuccess = (json: T): void => {
				removeCallback(id, timeoutId);
				resolve(json);
			};
			const callbackError = (message: NetworkError): void => {
				removeCallback(id, timeoutId);
				reject(message);
			};

			// set URL callback
			const prefix = url.indexOf("?") === -1 ? "?" : "&";
			url += prefix + "callback=" + encodeURIComponent(addCallback(id, callbackSuccess));

			// set timeout
			timeoutId = window.setTimeout(() => {
				callbackError(new TimeoutError(`Could not reach server after ${timeout / 1000} seconds for ${url}`));
			}, timeout);

			// create script
			const script = document.createElement("SCRIPT");
			script.id = id;
			script.onerror = (): void => callbackError(new NetworkError(`Unknown networking error for ${url}`));
			script.setAttribute("async", "true");
			script.setAttribute("src", url);

			document.body.appendChild(script);
		} catch (error) {
			reject(error);
		}
	});
}

export class NetworkError extends Error {}
export class TimeoutError extends NetworkError {}
