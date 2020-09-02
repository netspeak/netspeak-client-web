export const _window = typeof window === "undefined" ? undefined : window;
export const localStorage = _window?.localStorage;
export const location = _window?.location;
export const navigator = _window?.navigator;
