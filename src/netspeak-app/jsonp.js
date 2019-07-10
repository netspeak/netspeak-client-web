let idCounter = 0;

/**
 * Queries the JSON result for the given URL.
 *
 * The given URL is not allowed to contain a `callback` parameter.
 *
 * @param {string} url
 * @param {number} [timeout]
 * @returns {Promise<any>}
 */
export function jsonp(url, timeout = 20000) {
	return new Promise((resolve, reject) => {
		try {
			if (!url) throw new Error("url cannot be " + url);

			// DO NOT use URL here
			// Edge can't handle it. I'm serious. Edge can't even build an URL.

			// check for callback
			if (/[&?]callback=/i.test(url)) throw new Error("url is not allowed to contain a callback parameter.");


			// convenience functions
			const addCallback = (id, callback) => {
				window[id] = callback;
				return id;
			};
			const removeCallback = (id, timeoutId) => {
				// timeout
				window.clearTimeout(timeoutId);
				// remove callback
				delete window[id];
				// remove script
				let script = document.getElementById(id);
				if (script) script.remove();
			};

			// id
			let id = "jsonp$$" + idCounter++;
			let timeoutId;

			// callbacks
			const callbackSuccess = (json) => {
				removeCallback(id, timeoutId);
				resolve(json);
			};
			const callbackError = (message) => {
				removeCallback(id, timeoutId);
				reject(message);
			};

			// set URL callback
			const prefix = url.indexOf('?') === -1 ? '?' : '&';
			url += prefix + 'callback=' + encodeURIComponent(addCallback(id, callbackSuccess));

			// set timeout
			timeoutId = window.setTimeout(() => callbackError(`TimeoutError for ${url}`), timeout);

			// create script
			let script = document.createElement("SCRIPT");
			script.id = id;
			script.onerror = () => callbackError(`Unknow error for ${url}`);
			script.setAttribute("async", "true");
			script.setAttribute("src", url);

			document.body.appendChild(script);
		} catch (error) {
			reject(error);
		}
	});
}
