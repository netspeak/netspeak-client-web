/**
 * Shuffles the given array.
 *
 * @param array
 */
function shuffle<T>(array: T[]): void {
	let j, x, i;
	for (i = array.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = array[i];
		array[i] = array[j];
		array[j] = x;
	}
}

/**
 * Returns a random subset of the given values with `min(count, values.length)` elements.
 *
 * @param values
 * @param count
 * @returns
 */
function randomValues<T>(values: readonly T[], count: number): T[] {
	if (values.length <= count) return values.slice(0);
	if (count === 1) return [values[Math.floor(Math.random() * values.length)]];

	const copy = values.slice(0);
	shuffle(copy);
	return copy.slice(0, count);
}

/**
 * A least recently used cache.
 */
export class LRUCache<V> {
	size: number;

	private _length: number;
	private _head: CacheNode<string, V>;
	private _tail: CacheNode<string, V>;
	private _map: Record<string, CacheNode<string, V>> = {};

	/**
	 * Creates an instance of LRUCache.
	 *
	 * @param size The maximum size of the cache.
	 */
	constructor(size = 100) {
		this.size = size;
		this._length = 0;

		this._head = new CacheNode<string, V>(null as any, null as any);
		this._tail = new CacheNode<string, V>(null as any, null as any);
		this._head.next = this._tail;
		this._tail.prev = this._head;
	}

	/**
	 * Adds a new element to the cache.
	 *
	 * @param key The key of the element.
	 * @param obj The element.
	 */
	add(key: string, obj: V): void {
		return this.addAll({ [key]: obj });
	}
	/**
	 * Adds any number of key-value-pairs to the cache.
	 *
	 * @param map The collection of key-value-pairs.
	 */
	addAll(map: Record<string, V>): void {
		let keys = Object.keys(map);
		if (keys.length === 0) return;
		if (keys.length > this.size) keys = keys.slice(0, this.size);

		const toRemove = keys.length + this._length - this.size;
		if (toRemove > 0) {
			randomValues(Object.keys(this._map), toRemove).forEach(key => {
				this.remove(key);
			});
		}

		for (const key of keys) {
			const node = new CacheNode<string, V>(key, map[key]);
			this._tail.insertBefore(node);
			this._map[key] = node;
			this._length++;
		}
	}

	/**
	 * Returns the cached value.
	 *
	 * @param key The key of the cached element.
	 * @param defaultValue The default value.
	 * @returns The cached element of the default value.
	 */
	get(key: string, defaultValue?: V): V | undefined {
		const node = this._map[key];
		if (!node) return defaultValue;

		node.remove();
		this._head.insertAfter(node);
		return node.obj;
	}

	/**
	 * Returns whether an element with the given key is cached.
	 *
	 * @param key The key of the cached element.
	 * @returns
	 */
	contains(key: string): boolean {
		return Boolean(this._map[key]);
	}

	/**
	 * Removes the cached element with the given key.
	 *
	 * @param key The key of the cached element.
	 * @returns Whether there was an element cached.
	 */
	remove(key: string): boolean {
		const node = this._map[key];
		if (!node) return false;
		this._removeNode(node);
		return true;
	}

	_removeNode(node: CacheNode<string, V>): void {
		this._length--;
		delete this._map[node.key];
		node.remove();
	}
}

/**
 * A node used by the internal implementation of the LRU cache.
 */
class CacheNode<K, V> {
	key: K;
	obj: V;

	prev: CacheNode<K, V> | undefined = undefined;
	next: CacheNode<K, V> | undefined = undefined;

	constructor(key: K, obj: V) {
		this.key = key;
		this.obj = obj;
	}

	remove(): void {
		this.prev!.next = this.next;
		this.next!.prev = this.prev;
	}

	insertAfter(afterNode: CacheNode<K, V>): void {
		afterNode.next = this.next;
		afterNode.prev = this;

		this.next!.prev = afterNode;
		this.next = afterNode;
	}
	insertBefore(beforeNode: CacheNode<K, V>): void {
		return this.prev!.insertAfter(beforeNode);
	}
}
