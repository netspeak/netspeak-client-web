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
