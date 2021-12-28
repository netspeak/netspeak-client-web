/* eslint-disable prettier/prettier */
import React from "react";
import { createLocalizer, Locales, LocalizableProps, SimpleLocale } from "../lib/localize";
import {
	Netspeak,
	NetspeakApiKind,
	NetspeakError,
	NetspeakInvalidQueryError,
	normalizeQuery,
	Phrase,
	ReadonlyNetspeakSearchResult,
} from "../lib/netspeak";
import { assertNever, delay, LoadingState, optional, url } from "../lib/util";
import NetspeakExampleQueries from "./netspeak-example-queries";
import {
	CancelableCollection,
	CancelablePromise,
	ignoreCanceled,
	newCancelableCollection,
	wasCanceled,
} from "../lib/cancelable-promise";
import { NetspeakSearchBar } from "./netspeak-search-bar";
import NetspeakResultList, {
	OnChangeFn,
	PhraseCollectionStats,
	PhraseSnippetState,
	PhraseState,
} from "./netspeak-result-list";
import LoadMoreButton from "./load-more-button";
import { DEFAULT_SNIPPETS, toLookaheadSnippetSupplier } from "../lib/snippets";
import "./netspeak-search.scss";
import { NetworkError } from "../lib/jsonp";
import InfoImage from "../img/i.svg";
import ClearImage from "../img/x.svg";
import HistoryImage from "../img/history.svg";
import TransparentButton from "./transparent-button";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import NetspeakQueryText from "./netspeak-query-text";
import { QueryHistory } from "../lib/query-history";
import { GraphElement } from "./netspeak-graph";

export type ExampleVisibility = "visible" | "hidden" | "peek";

interface Props extends LocalizableProps {
	defaultQuery?: string;
	corpusKey: string;
	onCommitQuery?: (query: string, corpusKey: string) => void;
	storedQuery: string;

	apiType?: NetspeakApiKind;

	history?: QueryHistory;

	defaultExampleVisibility?: ExampleVisibility;
	onSetExampleVisibility?: (value: ExampleVisibility) => void;

	pageSize?: number;

	autoFocus?: boolean;
	//added for graph-to-search communication
	syncStateWithGraph: (arg0: readonly PhraseState[]) => void;
	selectedWords: GraphElement[];
	setHighlightedPhrases: (arg0: string[]) => void;
	highlightedPhrases: string[];
	beta?: boolean;
}

interface State {
	query: string;
	normalizedQuery: NormalizedQuery;
	loadingState: LoadingState;

	examplesVisibility: ExampleVisibility;

	phrases: readonly PhraseState[];
	phrasesStats: PhraseCollectionStats;

	problems: readonly Problem[];
}

type Problem = UnknownWordProblem | NetworkingProblem | NetspeakProblem | UnknownProblem;
type UnknownWordProblem = Readonly<{ type: "UnknownWord"; word: string }>;
type UnknownProblem = Readonly<{ type: "Unknown"; details: string }>;
type NetworkingProblem = Readonly<{ type: "ServerUnreachable" }> | Readonly<{ type: "NoConnection" }>;
type NetspeakProblem =
	| Readonly<{ type: "NetspeakServer"; details: string }>
	| Readonly<{ type: "InvalidQuery"; details: string }>;

type NormalizedQuery = string;

const DEFAULT_PAGE_SIZE = 20;

export class NetspeakSearch extends React.PureComponent<Props, State> {
	private cancelable: CancelableCollection = newCancelableCollection();
	private _delayErrorPromise: CancelablePromise<void> | undefined;
	private _delayCommitPromise: CancelablePromise<void> | undefined;

	constructor(props: Props) {
		super(props);

		this.state = {
			query: props.defaultQuery || "",
			normalizedQuery: normalizeQuery(props.defaultQuery),
			loadingState: LoadingState.EXHAUSTED,

			examplesVisibility: props.defaultExampleVisibility || "peek",

			phrases: [],
			phrasesStats: EMPTY_STATS,

			problems: [],
		};
	}

	componentDidMount(): void {
		this._queryPhrases(this.state.normalizedQuery);
	}

	componentWillUnmount(): void {
		this.cancelable.cancel();
	}

	componentDidUpdate(prevProps: Props, prevState: State): void {
		if (prevProps.storedQuery !== this.props.storedQuery) {
			this._setQuery(this.props.storedQuery, true);
		}
	}

	private _setExampleVisibility(visibility: ExampleVisibility): void {
		this.setState({ examplesVisibility: visibility });
		this.props.onSetExampleVisibility?.(visibility);
	}

	private _commit(query: string): void {
		this.props.onCommitQuery?.(query, this.props.corpusKey);
	}

	private _setQuery(query: string, commit: boolean): void {
		// called every time the query changes (i.e. user types)
		this._delayErrorPromise?.cancel();
		this._delayCommitPromise?.cancel();

		const normalizedQuery = normalizeQuery(query);
		const changed = normalizedQuery !== this.state.normalizedQuery;

		this.setState({ query, normalizedQuery });

		if (changed) {
			this._queryPhrases(normalizedQuery);
		}

		if (commit) {
			// commit right away
			this._commit(query);
		} else if (changed) {
			// wait to see whether the user changes the query again
			this._delayCommitPromise = this.cancelable(delay(1000));
			this._delayCommitPromise.then(() => {
				this._commit(query);
			}, ignoreCanceled);
		}
	}

	private _queryPhrases(normalizedQuery: NormalizedQuery): void {
		if (!normalizedQuery) {
			// empty query
			this.setState({ loadingState: LoadingState.EXHAUSTED });
			this._clearPhrases(false);
		} else {
			this.setState({ loadingState: LoadingState.LOADING });

			const promise = this.cancelable(
				Netspeak.getNetspeakClient(this.props.apiType).search({
					query: normalizedQuery,
					corpus: this.props.corpusKey,
					topk: this.props.pageSize || DEFAULT_PAGE_SIZE,
				})
			);
			this._handleSearchPromise(normalizedQuery, promise);
		}
	}

	private _queryMorePhrases = (): void => {
		const normalizedQuery = this.state.normalizedQuery;
		// current phrases = all phrases - phrases pinned from other queries
		const currentPhrases = this.state.phrases.filter(p => p.phrase.query === normalizedQuery);

		if (currentPhrases.length === 0) {
			throw new Error('Cannot query "more" phrases if there weren\'t any to begin with.');
		}

		const minFreq = currentPhrases[currentPhrases.length - 1].phrase.frequency;

		this.setState({ loadingState: LoadingState.LOADING });

		const promise = this.cancelable(
			Netspeak.getNetspeakClient(this.props.apiType).search(
				{
					query: normalizedQuery,
					corpus: this.props.corpusKey,
					topk: this.props.pageSize || DEFAULT_PAGE_SIZE,
					maxfreq: minFreq,
				},
				{
					checkComplete: true,
					topkMode: "fill",
				}
			)
		);
		this._handleSearchPromise(normalizedQuery, promise);
	};

	private _handleSearchPromise(
		normalizedQuery: NormalizedQuery,
		promise: CancelablePromise<ReadonlyNetspeakSearchResult>
	): void {
		this._delayErrorPromise?.cancel();

		promise.then(
			result => {
				this._delayErrorPromise?.cancel();
				// success

				if (this.state.normalizedQuery !== normalizedQuery) {
					// too late
				} else {
					// append all queried phrases
					this._mergePhrases(normalizedQuery, result.phrases);
					// set the loading state
					this.setState({
						loadingState:
							result.complete || result.phrases.length === 0
								? LoadingState.EXHAUSTED
								: LoadingState.MORE_AVAILABLE,
						problems: result.unknownWords.map<Problem>(word => ({ type: "UnknownWord", word })),
					});
				}
			},
			reason => {
				this._delayErrorPromise?.cancel();
				// error

				if (wasCanceled(reason) || this.state.normalizedQuery !== normalizedQuery) {
					// ignore
				} else {
					(this._delayErrorPromise = this.cancelable(delay(1000))).then(() => {
						if (this.state.normalizedQuery === normalizedQuery) {
							this.setState({
								loadingState: LoadingState.EXHAUSTED,
								problems: [this._reasonToProblem(reason)],
							});
						}
					}, ignoreCanceled);
				}
			}
		);
	}

	private _reasonToProblem(reason: any): Problem {
		if (reason instanceof NetworkError) {
			if (navigator.onLine) {
				return { type: "ServerUnreachable" };
			} else {
				return { type: "NoConnection" };
			}
		} else if (reason instanceof NetspeakInvalidQueryError) {
			return {
				type: "InvalidQuery",
				details: reason.message,
			};
		} else if (reason instanceof NetspeakError) {
			return {
				type: "NetspeakServer",
				details: reason.message,
			};
		} else {
			if (typeof reason === "object") {
				try {
					reason = JSON.stringify(reason, undefined, 4);
				} catch (e) {
					// noop
				}
			}

			return {
				type: "Unknown",
				details: String(reason),
			};
		}
	}

	private _clearPhrases(clearPinned: boolean): void {
		if (clearPinned) {
			this.setState({
				phrases: [],
				phrasesStats: EMPTY_STATS
			});
		} else {
			const newPhrases = this.state.phrases.filter(p => p.pinned);
			if (newPhrases.length !== this.state.phrases.length) {
				this.setState({
					phrases: newPhrases,
					phrasesStats: getStats(newPhrases),
				});
			}
		}
	}

	private _mergePhrases(normalizedQuery: NormalizedQuery, phrases: Iterable<Phrase>): void {
		const newPhrases = this.state.phrases.filter(p => p.pinned || p.phrase.query === normalizedQuery);
		const textSet = new Set<string>(newPhrases.map(p => p.phrase.text));
		let numberOfNewPhrases = 0;

		for (const phrase of phrases) {
			if (!textSet.has(phrase.text)) {
				textSet.add(phrase.text);
				numberOfNewPhrases++;
				newPhrases.push(
					new PhraseState(
						phrase,
						false,
						false,
						new PhraseSnippetState(toLookaheadSnippetSupplier(DEFAULT_SNIPPETS.getSupplier(phrase.text)))
					)
				);
			}
		}

		if (numberOfNewPhrases > 0) {
			// set state to reflect new phrases
			newPhrases.sort((a, b) => b.phrase.frequency - a.phrase.frequency);
			this.setState({
				phrases: newPhrases,
				phrasesStats: getStats(newPhrases),
			});
		} else if (newPhrases.length !== this.state.phrases.length) {
			// no new phrases but some old ones have been removed
			this.setState({
				phrases: newPhrases,
				phrasesStats: getStats(newPhrases),
			});
		}
	}

	private _splitProblems(): Record<"warnings" | "errors", Problem[]> {
		const warnings: Problem[] = [];
		const errors: Problem[] = [];
		this.state.problems.forEach(p => {
			if (p.type === "UnknownWord") {
				warnings.push(p);
			} else {
				errors.push(p);
			}
		});

		return { warnings, errors };
	}

	private _onSearchBarQueryEnterHandler = (query: string): void => {
		this._setQuery(query, false);
	};
	private _onExampleQueryClickHandler = (query: string): void => {
		if (this.state.examplesVisibility === "peek") {
			this._setExampleVisibility("visible");
		}

		this._setQuery(query, true);
	};
	private _onPhraseChange: OnChangeFn = (phrase, change) => {
		const phrases = this.state.phrases;
		const index = phrases.findIndex(p => p.phrase === phrase);
		const phraseState = phrases[index];
		const newPhraseState = change(phraseState);
		if (newPhraseState !== phraseState) {
			const newPhrases: readonly PhraseState[] = [
				...phrases.slice(0, index),
				newPhraseState,
				...phrases.slice(index + 1),
			];
			this.props.syncStateWithGraph(newPhrases);
			this.setState({
				phrases: newPhrases,
				phrasesStats: getStats(newPhrases),
			});
		}
	};
	private _onExampleButtonClick = (): void => {
		// toggle visibility
		this._setExampleVisibility(this._areExamplesVisible() ? "hidden" : "visible");
	};
	private _onClearButtonClick = (): void => {
		this._setQuery("", true);
		this._clearPhrases(true);
		this.props.syncStateWithGraph([]);
	};

	private _renderHistoryPopup(): JSX.Element {
		const l = createLocalizer(this.props, locales);

		return (
			<Popup
				trigger={
					<span>
						<TransparentButton image={url(HistoryImage)} />
					</span>
				}
				position="bottom right"
				closeOnDocumentClick
				closeOnEscape>
				{(close: () => void) => (
					<div className="history-wrapper">
						{optional((this.props.history?.items.length ?? 0) === 0, () => (
							<div>
								<p>
									<em>{l("noHistory")}</em>
								</p>
							</div>
						))}
						{this.props.history?.items.slice(0, 20).map(query => {
							const onClick = (): void => {
								close();
								this._setQuery(query, true);
							};

							return (
								<button key={query} onClick={onClick}>
									<div>
										<NetspeakQueryText query={query} />
									</div>
								</button>
							);
						})}
					</div>
				)}
			</Popup>
		);
	}

	private _areExamplesVisible(): boolean {
		return (
			this.state.examplesVisibility === "visible" ||
			(this.state.examplesVisibility === "peek" && this.state.normalizedQuery === "")
		);
	}

	render(): JSX.Element {
		const l = createLocalizer(this.props, locales);
		const { warnings, errors } = this._splitProblems();

		return (
			<div className="NetspeakSearch">
				{this.props.beta ? (
					<div className="wrapper title-bar-wrapper">
						<span className="beta">Beta:</span>
						<NetspeakQueryText query={this.state.query} />
					</div>
				) : (
					<div className="wrapper search-bar-wrapper">
						<table>
							<tbody>
								<tr>
									<td>
										<NetspeakSearchBar
											query={this.state.query}
											onQueryEnter={this._onSearchBarQueryEnterHandler}
											autoFocus={this.props.autoFocus}
										/>
									</td>
									<td>
										<TransparentButton
											image={url(InfoImage)}
											selected={this._areExamplesVisible()}
											onClick={this._onExampleButtonClick}
										/>
									</td>
									<td>
										<TransparentButton image={url(ClearImage)} onClick={this._onClearButtonClick} />
									</td>
									{optional(!!this.props.history, () => (
										<td>{this._renderHistoryPopup()}</td>
									))}
								</tr>
							</tbody>
						</table>
					</div>
				)}

				{optional(warnings.length > 0, () => (
					<div className="wrapper warnings-wrapper">
						<div>
							{warnings.map((p, i) => (
								<ProblemInner key={i} lang={this.props.lang} problem={p} />
							))}
						</div>
					</div>
				))}
				{optional(errors.length > 0, () => (
					<div className="wrapper errors-wrapper">
						<div>
							{errors.map((p, i) => (
								<ProblemInner key={i} lang={this.props.lang} problem={p} />
							))}
						</div>
					</div>
				))}

				{optional(this._areExamplesVisible(), () => (
					<div className="wrapper examples-wrapper">
						<NetspeakExampleQueries
							lang={this.props.lang}
							corpusKey={this.props.corpusKey}
							onQueryClicked={this._onExampleQueryClickHandler}
						/>
					</div>
				))}

				{optional(this.state.phrases.length > 0, () => (
					<div className="wrapper result-list-wrapper">
						<NetspeakResultList
							lang={this.props.lang}
							phrases={this.state.phrases}
							stats={this.state.phrasesStats}
							onChange={this._onPhraseChange}
							selectedWords={this.props.selectedWords}
							setHighlightedPhrases={this.props.setHighlightedPhrases}
							highlightedPhrases={this.props.highlightedPhrases}
						/>
					</div>
				))}
				{optional(
					!!this.state.normalizedQuery &&
						this.state.phrases.length === 0 &&
						this.state.loadingState === LoadingState.EXHAUSTED,
					() => (
						<div className="wrapper no-phrases-wrapper">
							<p>
								<em>{l("noPhrasesFound")}</em>
							</p>
						</div>
					)
				)}

				{optional(this.state.loadingState !== LoadingState.EXHAUSTED, () => (
					<div className="wrapper load-more-wrapper">
						<LoadMoreButton
							loading={this.state.loadingState === LoadingState.LOADING}
							onClick={this._queryMorePhrases}
						/>
					</div>
				))}
			</div>
		);
	}
}

function ProblemInner(props: { problem: Problem } & LocalizableProps): JSX.Element {
	const l = createLocalizer(props, locales);
	const { problem } = props;

	function withDetails(text: string): JSX.Element {
		return (
			<details>
				<summary>{l("details")}</summary>
				<pre>{text}</pre>
			</details>
		);
	}

	switch (problem.type) {
		case "UnknownWord":
			return (
				<p>
					{l("unknownWord")}
					{": "}
					<em>{problem.word}</em>
				</p>
			);

		case "NoConnection":
			return <p>{l("noConnectionError")}</p>;
		case "ServerUnreachable":
			return <p>{l("serverUnreachableError")}</p>;

		case "InvalidQuery":
			return (
				<>
					<p>{l("invalidQueryError")}</p>
					{withDetails(problem.details)}
				</>
			);
		case "NetspeakServer":
			return (
				<>
					<p>{l("netspeakError")}</p>
					{withDetails(problem.details)}
				</>
			);

		case "Unknown":
			return (
				<>
					<p>{l("unknownError")}</p>
					{withDetails(problem.details)}
				</>
			);

		default:
			throw assertNever(problem);
	}
}

const locales: Locales<SimpleLocale<
	| "noPhrasesFound"
	| "noHistory"
	| "unknownWord"
	| "noConnectionError"
	| "serverUnreachableError"
	| "invalidQueryError"
	| "netspeakError"
	| "unknownError"
	| "details"
>> = {
	en: {
		noPhrasesFound: "No phrases found.",
		noHistory: "No query history.",

		unknownWord: "Unknown word",

		noConnectionError:
			"No response form the Netspeak server. Please make sure you have a stable internet connection.",
		serverUnreachableError: "The Netspeak server failed to respond. Please retry in a few minutes.",
		invalidQueryError: "Your input is not a valid Netspeak query.",
		netspeakError: "An error occurred in Netspeak.",
		unknownError: "Unknown error.",

		details: "Details",
	},
	de: {
		noPhrasesFound: "Keine Phrasen gefunden.",
		noHistory: "Keine vorherigen Abfragen.",

		unknownWord: "Unbekanntes Wort",

		noConnectionError:
			"Keine Antwort vom Netspeak-Server. Bitte stellen Sie sicher, dass ihr Gerät mit dem Internet verbunden ist.",
		serverUnreachableError: "Keine Antwort vom Netspeak-Server. Bitte versuchen Sie es in ein paar Minuten erneut.",
		invalidQueryError: "Ihre Eingabe ist keine valide Netspeak-Abfrage.",
		netspeakError: "Es ist ein Fehler in Netspeak aufgetreten.",
		unknownError: "Unbekannter Fehler.",

		details: "Details",
	},
};

const EMPTY_STATS: PhraseCollectionStats = {
	frequencyMax: 0,
	frequencySum: 0,
};

function getStats(phrases: readonly PhraseState[]): PhraseCollectionStats {
	let max = 0;
	let sum = 0;

	for (const { phrase } of phrases) {
		max = Math.max(max, phrase.frequency);
		sum += phrase.frequency;
	}

	if (sum === 0) {
		return EMPTY_STATS;
	} else {
		return {
			frequencyMax: max,
			frequencySum: sum,
		};
	}
}
