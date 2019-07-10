/**
 * Shuffles the given array.
 *
 * @param {any[]} array
 */
function shuffle(array) {
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
 * @param {ReadonlyArray<T>} values
 * @param {number} count
 * @returns {T[]}
 * @template T
 */
function randomValues(values, count) {
	if (values.length <= count)
		return values.slice(0);
	if (count == 1)
		return [values[Math.floor(Math.random() * values.length)]];

	const copy = values.slice(0);
	shuffle(copy);
	return copy.slice(0, count);
}

/**
 * A least recently used cache.
 *
 * @template V
 */
export class LRUCache {

	/**
	 * Creates an instance of LRUCache.
	 *
	 * @param {number} [size=100] The maximum size of the cache.
	 */
	constructor(size = 100) {
		this.size = size;
		this._length = 0;

		this._head = new CacheNode(/** @type {string} */(null), /** @type {V} */(null));
		this._tail = new CacheNode(/** @type {string} */(null), /** @type {V} */(null));
		this._head.next = this._tail;
		this._tail.prev = this._head;

		/** @type {Object<string, CacheNode<string, V>>} */
		this._map = {};
	}

	/**
	 * Adds a new element to the cache.
	 *
	 * @param {string} key The key of the element.
	 * @param {V} obj The element.
	 */
	add(key, obj) {
		return this.addAll({ [key]: obj });
	}
	/**
	 * Adds any number of key-value-pairs to the cache.
	 *
	 * @param {Object<string, V>} map The collection of key-value-pairs.
	 */
	addAll(map) {
		let keys = Object.keys(map);
		if (keys.length == 0) return;
		if (keys.length > this.size) keys = keys.slice(0, this.size);

		let toRemove = keys.length + this._length - this.size;
		if (toRemove > 0) {
			randomValues(Object.keys(this._map), toRemove).forEach(key => {
				this.remove(key);
			});
		}

		for (let key of keys) {
			const node = new CacheNode(key, map[key]);
			this._tail.insertBefore(node);
			this._map[key] = node;
			this._length++;
		}
	}

	/**
	 * Returns the cached value.
	 *
	 * @param {string} key The key of the cached element.
	 * @param {V} [defaultValue=undefined] The default value.
	 * @returns {V} The cached element of the default value.
	 */
	get(key, defaultValue = undefined) {
		const node = this._map[key];
		if (!node) return defaultValue;

		node.remove();
		this._head.insertAfter(node);
		return node.obj;
	}

	/**
	 * Returns whether an element with the given key is cached.
	 *
	 * @param {string} key The key of the cached element.
	 * @returns {boolean}
	 */
	contains(key) {
		return Boolean(this._map[key]);
	}

	/**
	 * Removes the cached element with the given key.
	 *
	 * @param {string} key The key of the cached element.
	 * @returns {boolean} Whether there was an element cached.
	 */
	remove(key) {
		const node = this._map[key];
		if (!node) return false;
		this._removeNode(node);
		return true;
	}

	_removeNode(node) {
		this._length--;
		delete this._map[node.key];
		node.remove();
	}

}

/**
 * A node used by the internal implementation of the LRU cache.
 *
 * @template K, V
 */
class CacheNode {

	/**
	 * @param {K} key
	 * @param {V} obj
	 */
	constructor(key, obj) {
		this.key = key;
		this.obj = obj;
		/** @type {CacheNode<K, V>} */
		this.prev = undefined;
		/** @type {CacheNode<K, V>} */
		this.next = undefined;
	}

	remove() {
		this.prev.next = this.next;
		this.next.prev = this.prev;
	}

	/**
	 * @param {CacheNode<K, V>} afterNode
	 */
	insertAfter(afterNode) {
		afterNode.next = this.next;
		afterNode.prev = this;

		this.next.prev = afterNode;
		this.next = afterNode;
	}

	/**
	 * @param {CacheNode<K, V>} beforeNode
	 */
	insertBefore(beforeNode) {
		return this.prev.insertAfter(beforeNode);
	}

}
