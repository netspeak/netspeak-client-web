/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { noop } from "./util";

type ResolveRejectCancelCallback<T> = (promise: CancelablePromise<T>, reason: "resolve" | "reject" | "cancel") => void;

export class CancelablePromise<T> {
	private _isCanceled = false;
	private readonly _callback: ResolveRejectCancelCallback<T> | undefined;
	private readonly _wrapped: Promise<T>;

	constructor(promise: Promise<T>, callback?: ResolveRejectCancelCallback<T>) {
		this._callback = callback;
		this._wrapped = new Promise((resolve, reject) => {
			promise.then(
				val => {
					if (this._isCanceled) {
						reject({ isCanceled: true });
					} else {
						resolve(val);
						this._callback?.(this, "resolve");
					}
				},
				error => {
					if (this._isCanceled) {
						reject({ isCanceled: true });
					} else {
						reject(error);
						this._callback?.(this, "reject");
					}
				}
			);
		});
	}

	then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
	): Promise<TResult1 | TResult2> {
		return this._wrapped.then(onfulfilled, onrejected);
	}
	cancel(): void {
		if (this._isCanceled === false) {
			this._isCanceled = true;
			this._callback?.(this, "cancel");
		}
	}
}

export const ignoreCanceled = (reason: unknown): void => {
	if (wasCanceled(reason)) {
		// ignore
	} else {
		throw reason;
	}
};

/**
 * Returns whether the reason a promise rejected is that it was canceled.
 *
 * @param reason
 */
export function wasCanceled(reason: any): reason is { isCanceled: true } {
	return reason && typeof reason === "object" && reason.isCanceled === true;
}

/**
 * A collection of cancelable promises.
 *
 * This collection provides a convenient way to create cancelable promises and to cancel them all at once.
 *
 * By calling the `cancel` function, all cancelable promises created by this collection will be canceled. This includes
 * the cancelable promises created after this function was called.
 */
export interface CancelableCollection {
	<T>(promise: Promise<T>): CancelablePromise<T>;
	cancel(): void;
}

const CANCELED = new CancelablePromise<any>(Promise.resolve());
CANCELED.then(noop, noop);
CANCELED.cancel();

export function newCancelableCollection(): CancelableCollection {
	let isCanceled = false;
	const pending = new Set<CancelablePromise<any>>();
	function deletePromise(promise: CancelablePromise<any>): void {
		pending.delete(promise);
	}

	function CancelableCollection<T>(promise: Promise<T>): CancelablePromise<T> {
		if (isCanceled) {
			return CANCELED;
		} else {
			const cancelable = new CancelablePromise(promise, deletePromise);
			pending.add(cancelable);
			return cancelable;
		}
	}
	CancelableCollection.cancel = (): void => {
		if (!isCanceled) {
			isCanceled = true;
			pending.forEach(p => p.cancel());
		}
	};

	return CancelableCollection;
}
