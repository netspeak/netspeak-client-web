import React from "react";
import { normalizeQuery } from "../lib/netspeak";
import { CancelablePromise, ignoreCanceled } from "../lib/cancelable-promise";
import { delay } from "../lib/util";

interface Props {
	query: string;
	onQueryEnter: (query: string) => void;
}
interface State {
	original: string;
	value: string;
}

export class NetspeakSearchBar extends React.PureComponent<Props, State> {
	private delay: CancelablePromise<void> | undefined;

	constructor(props: Props) {
		super(props);

		this.state = {
			original: props.query,
			value: props.query,
		};
	}

	componentWillUnmount(): void {
		this.delay?.cancel();
	}

	static getDerivedStateFromProps(props: Props, state: State): State | null {
		// This is a bit of a hack.
		// We want to update out state if the query of the received props doesn't match the query we last got via props.
		if (props.query !== state.original) {
			return {
				original: props.query,
				value: props.query,
			};
		}
		return null;
	}

	private _onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
		this.delay?.cancel();

		const value = e.currentTarget.value;
		this.setState({ value });

		if (!equalQueries(value, this.props.query)) {
			this.delay = new CancelablePromise(delay(100));
			this.delay.then(() => {
				this.props.onQueryEnter(value);
			}, ignoreCanceled);
		}
	};
	private _oKeyupHandler = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		this.delay?.cancel();

		const value = e.currentTarget.value;
		this.setState({ value });

		if (!equalQueries(value, this.props.query)) {
			this.props.onQueryEnter(value);
		}
	};

	render(): JSX.Element {
		return (
			<input
				type="text"
				className="NetspeakSearchBar"
				value={this.state.value}
				onChange={this._onChangeHandler}
				onKeyUp={this._oKeyupHandler}
			/>
		);
	}
}

function equalQueries(q1: string, q2: string): boolean {
	return normalizeQuery(q1) === normalizeQuery(q2);
}
