import React from "react";
import "./search-page.scss";
import NetspeakCorpusSelector from "../elements/netspeak-corpus-selector";
import { getCurrentLang } from "../lib/localize";
import { NetspeakSearch, ExampleVisibility } from "../elements/netspeak-search";
import { Corpus, CorporaInfo, Netspeak } from "../lib/netspeak";
import { CancelablePromise, ignoreCanceled } from "../lib/cancelable-promise";
import { optional, nextId } from "../lib/util";
import { QueryHistory } from "../lib/query-history";
import Page from "./page";
import { addHashChangeListener, removeHashChangeListener } from "../lib/hash";
import NetspeakGraph, { GraphElement } from "../elements/netspeak-graph";
import { PhraseState } from "../elements/netspeak-result-list";

const KNOWN_CORPORA: readonly Corpus[] = [
	{
		key: "web-en",
		name: "English",
		language: "en",
	},
	{
		key: "web-de",
		name: "German",
		language: "de",
	},
];
const DEFAULT_CORPUS_KEY = "web-en";

interface State {
	currentCorpusKey: string;
	corpora: readonly Corpus[];
	unavailableCorpora: ReadonlySet<Corpus>;

	pageQuery: string;
	currentQuery: string;
	queryId: number;

	history: QueryHistory;

	exampleVisibility: ExampleVisibility;

	selectedWords: GraphElement[];
	statePhrases: PhraseState[];
	highlightedPhrases: string[];
}

export default class SearchPage extends React.PureComponent<unknown, State> {
	readonly lang = getCurrentLang();
	private _corporaPromise: CancelablePromise<Readonly<CorporaInfo>> | undefined;
	state: Readonly<State> = {
		...withCorpus(getPageParam("corpus") || DEFAULT_CORPUS_KEY),
		corpora: KNOWN_CORPORA,
		unavailableCorpora: new Set(),

		pageQuery: getPageParam("q") || "",
		currentQuery: "",
		queryId: nextId(),
		selectedWords: [],
		statePhrases: [],
		highlightedPhrases: [],

		exampleVisibility: loadExampleVisibility() ?? "peek",
	};

	componentDidMount(): void {
		this._corporaPromise = new CancelablePromise(Netspeak.instance.queryCorpora());
		this._corporaPromise
			.then(info => {
				const available = new Set(info.corpora.map(c => c.key));

				this.setState(state => {
					return { unavailableCorpora: new Set(state.corpora.filter(c => !available.has(c.key))) };
				});
			}, ignoreCanceled)
			.catch(reason => {
				this.setState(state => {
					return { unavailableCorpora: new Set(state.corpora) };
				});

				console.error(reason);
			});

		addHashChangeListener(this._onHashUpdateHandler);
	}
	componentWillUnmount(): void {
		this._corporaPromise?.cancel();

		removeHashChangeListener(this._onHashUpdateHandler);
	}

	private _onHashUpdateHandler = (): void => {
		const pageQuery = getPageParam("q") || "";
		const pageCorpus = getPageParam("corpus");

		this.setState(state => ({
			pageQuery: pageQuery,
			...withCorpus(pageCorpus || state.currentCorpusKey, state),

			currentQuery: pageQuery,
			queryId: pageQuery === state.pageQuery || pageQuery === state.currentQuery ? state.queryId : nextId(),
		}));
	};
	private _onCorpusSelectedHandler = (corpus: Corpus): void => {
		this._syncStateWithGraph([]);
		this.setState(state => withCorpus(corpus.key, state));
		setPageParam("corpus", corpus.key);
	};
	private _onQueryCommitHandler = (query: string): void => {
		this.setState(state => {
			let history = state.history;
			if (query.trim()) {
				// query isn't just spaces
				history = history.push(query);
				storyQueryHistory(state.currentCorpusKey, history);
			}

			return {
				currentQuery: query,
				history,
			};
		});
		setPageParam("q", query);
	};
	private _onSetExampleVisibilityHandler = (visibility: ExampleVisibility): void => {
		storeExampleVisibility(visibility);
		this.setState({
			exampleVisibility: visibility,
		});
	};

	// Send all pinned & expanded phrases as extra props to graph via search page state
	private _syncStateWithGraph = (phraseStates: readonly PhraseState[]): void => {
		this.setState(state => {
			return {
				statePhrases: phraseStates.filter(val => {
					return val.pinned || (val.expanded && val.phrase.query === this.state.pageQuery);
				}),
			};
		});
	};
	private _onSetSelection = (selection: GraphElement[]): void => {
		this.setState(state => {
			return {
				selectedWords: selection,
			};
		});
	};
	private _setHighlightedPhrases = (phrases: string[]): void => {
		this.setState(state => {
			return {
				highlightedPhrases: phrases,
			};
		});
	};

	render(): JSX.Element {
		return (
			<Page lang={this.lang} className="SearchPage">
				{optional(this.state.corpora.length > 0, () => (
					<NetspeakCorpusSelector
						lang={this.lang}
						selected={this.state.currentCorpusKey}
						corpora={this.state.corpora}
						unavailable={this.state.unavailableCorpora}
						onCorpusSelected={this._onCorpusSelectedHandler}
					/>
				))}

				<div className="flexbox-container">
					<div className="search-wrapper">
						<NetspeakSearch
							key={this.state.queryId + ";" + this.state.currentCorpusKey}
							lang={this.lang}
							corpusKey={this.state.currentCorpusKey}
							defaultQuery={this.state.pageQuery}
							onCommitQuery={this._onQueryCommitHandler}
							selectedWords={this.state.selectedWords}
							history={this.state.history}
							defaultExampleVisibility={this.state.exampleVisibility}
							onSetExampleVisibility={this._onSetExampleVisibilityHandler}
							pageSize={40}
							autoFocus={true}
							syncStateWithGraph={this._syncStateWithGraph}
							setHighlightedPhrases={this._setHighlightedPhrases}
							highlightedPhrases={this.state.highlightedPhrases}
						/>
					</div>
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
					<NetspeakGraph
						corpus={this.state.currentCorpusKey}
						pageQuerry={this.state.pageQuery}
						statePhrases={this.state.statePhrases}
						onSetSelection={this._onSetSelection}
						highlightedPhrases={this.state.highlightedPhrases}
						setHighlightedPhrases={this._setHighlightedPhrases}
					/>
				</div>
			</Page>
		);
	}
}

function withCorpus(corpusKey: string, state?: Readonly<State>): Pick<State, "currentCorpusKey" | "history"> {
	return {
		currentCorpusKey: corpusKey,
		history: state?.currentCorpusKey === corpusKey ? state.history : loadQueryHistory(corpusKey),
	};
}

function getHashParams(): URLSearchParams {
	try {
		return new URLSearchParams((location.hash || "#").substr(1));
	} catch (error) {
		return new URLSearchParams("");
	}
}
function setHashParams(params: URLSearchParams): void {
	location.hash = params.toString();
}
type PageParam = "q" | "corpus";
function getPageParam(param: PageParam): string | null {
	return getHashParams().get(param);
}
function setPageParam(param: PageParam, value: string): void {
	const params = getHashParams();
	params.set(param, value);
	setHashParams(params);
}

function loadQueryHistory(corpus: string): QueryHistory {
	const stored = localStorage.getItem("queryHistory:" + corpus);
	if (stored) {
		return QueryHistory.fromJSON(stored);
	} else {
		return new QueryHistory();
	}
}
function storyQueryHistory(corpus: string, history: QueryHistory): void {
	localStorage.setItem("queryHistory:" + corpus, history.toJSON());
}

function loadExampleVisibility(): ExampleVisibility | null {
	return sessionStorage.getItem("exampleVisibility") as ExampleVisibility | null;
}
function storeExampleVisibility(value: ExampleVisibility): void {
	sessionStorage.setItem("exampleVisibility", value);
}
