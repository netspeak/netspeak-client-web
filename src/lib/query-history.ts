export class QueryHistory {
	constructor(public readonly items: readonly string[] = []) {}

	push(query: string): QueryHistory {
		if (this.items.some(i => i === query)) {
			return new QueryHistory([query, ...this.items.filter(i => i !== query)]);
		} else {
			return new QueryHistory([query, ...this.items]);
		}
	}
	limit(maxLength: number): QueryHistory {
		if (this.items.length <= maxLength) {
			return this;
		} else {
			return new QueryHistory(this.items.slice(0, maxLength));
		}
	}

	toJSON(): string {
		return JSON.stringify(this.items);
	}
	static fromJSON(json: string): QueryHistory {
		return new QueryHistory(JSON.parse(json));
	}
}
