export type Listener = () => void;

const listeners = new Set<Listener>();
export function addHashChangeListener(listener: Listener): void {
	listeners.add(listener);
}
export function removeHashChangeListener(listener: Listener): void {
	listeners.delete(listener);
}

function callAllListeners(): void {
	listeners.forEach(l => l());
}

// This will add a listener for the "hashchange" event and it will periodically check the hash in case the event didn't
// fire for some reason (yes, that happens).
let lastHash: string | undefined = undefined;
if (typeof window !== "undefined") {
	window.addEventListener("hashchange", () => {
		lastHash = location.hash;
		callAllListeners();
	});
	setInterval(() => {
		if (lastHash !== undefined) {
			const hash = location.hash;
			if (lastHash !== hash) {
				lastHash = location.hash;
				callAllListeners();
			}
		}
	}, 10);
}
