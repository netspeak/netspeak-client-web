import React from "react";
import { LocalizableProps, Locales, SimpleLocale, createLocalizer } from "../lib/localize";
import { Phrase, WordTypes, Word } from "../lib/netspeak";
import { Snippet, SnippetSupplier, getPhraseRegex } from "../lib/snippets";
import { optional, LoadingState, url, delay } from "../lib/util";
import LoadMoreButton from "./load-more-button";
import "./netspeak-result-list.scss";
import TransparentButton from "./transparent-button";
import PinImage from "../img/pin.svg";
import CopyImage from "../img/copy.svg";
import { CancelablePromise, ignoreCanceled, newCancelableCollection } from "../lib/cancelable-promise";

export class PhraseSnippetState {
	constructor(
		public readonly supplier: SnippetSupplier,
		public readonly snippets: readonly Snippet[] = [],
		public readonly loading: LoadingState = LoadingState.MORE_AVAILABLE
	) {}

	pushSnippets(snippets: readonly Snippet[]): PhraseSnippetState {
		if (snippets.length === 0) {
			return this;
		} else {
			return this.set("snippets", [...this.snippets, ...snippets]);
		}
	}
	setLoading(value: LoadingState): PhraseSnippetState {
		return this.set("loading", value);
	}

	private copy(): PhraseSnippetState {
		return new PhraseSnippetState(this.supplier, this.snippets, this.loading);
	}
	private set<K extends keyof PhraseSnippetState>(key: K, value: PhraseSnippetState[K]): PhraseSnippetState {
		if (this[key] === value) {
			return this;
		} else {
			const copy = this.copy();
			copy[key] = value;
			return copy;
		}
	}
}
export class PhraseState {
	constructor(
		public readonly phrase: Phrase,
		public readonly pinned: boolean,
		public readonly expanded: boolean,
		public readonly snippets: PhraseSnippetState
	) {}

	setPinned(value: boolean): PhraseState {
		return this.set("pinned", value);
	}
	setExpanded(value: boolean): PhraseState {
		return this.set("expanded", value);
	}
	setSnippets(value: PhraseSnippetState): PhraseState {
		return this.set("snippets", value);
	}

	private copy(): PhraseState {
		return new PhraseState(this.phrase, this.pinned, this.expanded, this.snippets);
	}
	private set<K extends keyof PhraseState>(key: K, value: PhraseState[K]): PhraseState {
		if (this[key] === value) {
			return this;
		} else {
			const copy = this.copy();
			copy[key] = value;
			return copy;
		}
	}
}

export interface PhraseCollectionStats {
	readonly frequencySum: number;
	readonly frequencyMax: number;
}

export type PhraseStateChangeFn = (current: PhraseState) => PhraseState;
export type OnChangeFn = (phrase: Phrase, change: PhraseStateChangeFn) => void;

interface ListProps extends LocalizableProps {
	phrases: readonly PhraseState[];
	stats: PhraseCollectionStats;
	onChange: OnChangeFn;
}

export default function NetspeakResultList(props: ListProps): JSX.Element {
	return (
		<div className="NetspeakResultList">
			{props.phrases.map(phrase => (
				<ResultListItem
					key={phrase.phrase.text}
					lang={props.lang}
					phrase={phrase}
					stats={props.stats}
					onChange={props.onChange}
				/>
			))}
		</div>
	);
}

interface ItemProps extends LocalizableProps {
	phrase: PhraseState;
	stats: PhraseCollectionStats;
	onChange: OnChangeFn;
}

function ResultListItem(props: ItemProps): JSX.Element {
	return (
		<div className="ResultListItem">
			<PhraseContainer {...props} />
			{optional(props.phrase.expanded, () => (
				<PhraseInfo {...props} />
			))}
		</div>
	);
}

class PhraseContainer extends React.PureComponent<ItemProps> {
	/**
	 * Formats the frequency of the given phrase.
	 */
	formatFrequency(): JSX.Element {
		const formatter = new Intl.NumberFormat(this.props.lang, {
			style: "decimal",
		});

		let freq = this.props.phrase.phrase.frequency;

		// floor to 2 significant digits if the frequency has more than 3 digits
		if (freq >= 1000) {
			const log = Math.ceil(Math.log10(freq));
			const factor = Math.pow(10, log - 2);
			freq = Math.floor(freq / factor) * factor;
		}

		return <>{formatter.format(freq)}</>;
	}

	/**
	 * Formats the frequency percentage of the given phrase.
	 */
	formatPercentage(): JSX.Element {
		const smallOptions: Intl.NumberFormatOptions = {
			style: "percent",
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		};
		const largeOptions: Intl.NumberFormatOptions = {
			style: "percent",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		};

		const ratio = this.props.phrase.phrase.frequency / this.props.stats.frequencySum;

		// this just means that if the rounded percentage is >= 10.0% then we'll use the other formatter
		const useLarge = Math.round(ratio * 1000) >= 100;
		const formatter = new Intl.NumberFormat(this.props.lang, useLarge ? largeOptions : smallOptions);

		return <>{formatter.format(ratio)}</>;
	}

	/**
	 * Formats the phrase text of the given phrase.
	 */
	formatText(): JSX.Element {
		const elements: JSX.Element[] = [];

		this.props.phrase.phrase.words.forEach((word, i) => {
			const classes: string[] = [];

			// is operator
			if (word.type !== WordTypes.WORD) {
				classes.push("operator");
			}

			// add type
			classes.push(
				String(Word.nameOfType(word.type))
					.toLowerCase()
					.replace(/[^a-z]+/, "-")
			);

			if (elements.length > 0) {
				elements.push(<React.Fragment key={i * 2 - 1}> </React.Fragment>);
			}
			elements.push(
				<span key={i * 2} className={classes.join(" ")}>
					{word.text}
				</span>
			);
		});

		return <>{elements}</>;
	}

	onClick = (): void =>
		this.props.onChange(this.props.phrase.phrase, phraseState =>
			phraseState.setExpanded(!this.props.phrase.expanded)
		);

	render(): JSX.Element {
		const relativeFreq = this.props.phrase.phrase.frequency / this.props.stats.frequencyMax;
		const backgroundSize = `${relativeFreq * 0.618 * 100}% 130%`;

		return (
			<div className="phrase-container" style={{ backgroundSize }} onClick={this.onClick}>
				<div>
					<span className={"text" + (this.props.phrase.pinned ? " pinned" : "")}>{this.formatText()}</span>
				</div>
				<span className="freq">
					{this.formatFrequency()}
					<span className="percentage">{this.formatPercentage()}</span>
				</span>
			</div>
		);
	}
}

interface PhraseInfoState {
	/** Whether the text of the phrase was recently copied to clipboard. */
	copied: boolean;
}

class PhraseInfo extends React.PureComponent<ItemProps, PhraseInfoState> {
	state: PhraseInfoState = {
		copied: false,
	};
	private cancelable = newCancelableCollection();
	private _copiedDelay: CancelablePromise<void> | undefined;

	componentDidMount(): void {
		const snippets = this.props.phrase.snippets;
		if (snippets.loading === LoadingState.MORE_AVAILABLE && snippets.snippets.length === 0) {
			// load snippets when the user first expands a phrase
			this.loadSnippets();
		}
	}
	componentWillUnmount(): void {
		this.cancelable.cancel();
	}

	loadSnippets = (): void => {
		const snippetState = this.props.phrase.snippets;

		if (snippetState.loading === LoadingState.MORE_AVAILABLE) {
			// mark as loading
			this._change(p => p.setSnippets(p.snippets.setLoading(LoadingState.LOADING)));

			// load more snippets
			this.cancelable(snippetState.supplier()).then(result => {
				let change: PhraseStateChangeFn;
				if (result === false) {
					change = phraseState =>
						phraseState.setSnippets(phraseState.snippets.setLoading(LoadingState.EXHAUSTED));
				} else {
					change = phraseState =>
						phraseState.setSnippets(
							phraseState.snippets.setLoading(LoadingState.MORE_AVAILABLE).pushSnippets(result)
						);
				}
				this._change(change);
			}, ignoreCanceled);
		}
	};

	private _change(changeFn: PhraseStateChangeFn): void {
		this.props.onChange(this.props.phrase.phrase, changeFn);
	}

	private _onCopyButtonClick = (): void => {
		this._copiedDelay?.cancel();

		navigator.clipboard.writeText(this.props.phrase.phrase.text);

		// set the "copied" state to true and then to false after 3sec
		this.setState({ copied: true });
		this._copiedDelay = this.cancelable(delay(3000));
		this._copiedDelay.then(() => {
			this.setState({ copied: false });
		}, ignoreCanceled);
	};
	private _onPinButtonClick = (): void => {
		this._change(p => p.setPinned(!p.pinned));
	};

	render(): JSX.Element {
		const l = createLocalizer(this.props, locales);

		return (
			<div className="options">
				<div className="buttons">
					<TransparentButton
						image={url(CopyImage)}
						text={this.state.copied ? l("copied") : l("copy")}
						onClick={this._onCopyButtonClick}
					/>
					<TransparentButton
						selected={this.props.phrase.pinned}
						image={url(PinImage)}
						text={l("pin")}
						onClick={this._onPinButtonClick}
					/>
				</div>
				<div className="examples-container">
					<div className="examples-list">
						{this.props.phrase.snippets.snippets.map((s, i) => (
							<PhraseExample key={i} phrase={this.props.phrase.phrase} snippet={s} />
						))}

						{optional(this.props.phrase.snippets.loading === LoadingState.EXHAUSTED, () => (
							<div>
								<p>
									<em>
										{this.props.phrase.snippets.snippets.length === 0
											? l("no-examples-found")
											: l("no-further-examples-found")}
									</em>
								</p>
							</div>
						))}
					</div>
					{optional(this.props.phrase.snippets.loading !== LoadingState.EXHAUSTED, () => (
						<div className="load-more-container">
							<LoadMoreButton
								loading={this.props.phrase.snippets.loading === LoadingState.LOADING}
								onClick={this.loadSnippets}
							/>
						</div>
					))}
				</div>
			</div>
		);
	}
}

function PhraseExample(props: Readonly<{ phrase: Phrase; snippet: Snippet }>): JSX.Element {
	const { phrase, snippet } = props;

	function emphasize(text: string): JSX.Element[] {
		/** The number of characters allowed around the phrase. */
		const context = 200;

		const textParts: JSX.Element[] = [];
		let key = 0;
		const pushBefore = (s: string, maxLength = Infinity): void => {
			if (s.length > maxLength) {
				s = s.substr(s.length - maxLength).replace(/^\S*\s+/, "... ");
			}
			textParts.push(<React.Fragment key={key++}>{s}</React.Fragment>);
		};
		const pushAfter = (s: string, maxLength: number): void => {
			if (s.length > maxLength) {
				s = s.substr(0, maxLength).replace(/\s+\S*$/, " ...");
			}
			textParts.push(<React.Fragment key={key++}>{s}</React.Fragment>);
		};

		const re = getPhraseRegex(phrase.text);
		let match;
		while (text && (match = re.exec(text))) {
			if (match.index > 0) {
				if (textParts.length === 0) {
					pushBefore(text.substr(0, match.index), context);
				} else {
					pushBefore(text.substr(0, match.index));
				}
			}
			textParts.push(<strong key={key++}>{match[0]}</strong>);
			text = text.substr(match.index + match[0].length);
		}
		if (text) {
			if (textParts.length === 0) {
				// something went wrong...
				pushAfter(text, context * 2);
			} else {
				pushAfter(text, context);
			}
		}

		return textParts;
	}

	const sources = Object.keys(snippet.urls).map(name => {
		const href = snippet.urls[name];
		return (
			<span key={name} className="source">
				[
				<a href={href} target="_blank" rel="noopener noreferrer">
					{name}
				</a>
				]
			</span>
		);
	});

	return (
		<div>
			<p>
				{emphasize(snippet.text)}
				{sources}
			</p>
		</div>
	);
}

const locales: Locales<SimpleLocale<
	"failed-to-load-examples" | "no-examples-found" | "no-further-examples-found" | "copy" | "copied" | "pin"
>> = {
	en: {
		"failed-to-load-examples": "Failed to load examples.",
		"no-examples-found": "No examples found.",
		"no-further-examples-found": "No further examples found.",
		"copy": "Copy",
		"copied": "Copied",
		"pin": "Pin",
	},
	de: {
		"failed-to-load-examples": "Beispiele konnten nicht geladen werden.",
		"no-examples-found": "Keine Beispiele gefunden.",
		"no-further-examples-found": "Keine weiteren Beispiele gefunden.",
		"copy": "Kopieren",
		"copied": "Kopiert",
		"pin": "Anheften",
	},
};
