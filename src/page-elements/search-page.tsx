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

interface State {
	corpusKey: string;
	corpora: readonly Corpus[];

	pageQuery: string;
	currentQuery: string;
	queryId: number;

	history: QueryHistory;

	exampleVisibility: ExampleVisibility;
}

export default class SearchPage extends React.PureComponent<unknown, State> {
	readonly lang = getCurrentLang();
	private _corporaPromise: CancelablePromise<Readonly<CorporaInfo>> | undefined;
	state: Readonly<State> = {
		...withCorpusKey(getPageParam("corpus") || ""),
		corpora: [],

		pageQuery: getPageParam("q") || "",
		currentQuery: "",
		queryId: nextId(),

		exampleVisibility: loadExampleVisibility() ?? "peek",
	};

	componentDidMount(): void {
		this._corporaPromise = new CancelablePromise(Netspeak.instance.queryCorpora());
		this._corporaPromise.then(info => {
			this.setState(state => {
				return {
					// set the corpus key here if not defined already
					...withCorpusKey(state.corpusKey || info.default || Netspeak.defaultCorpus, state),
					corpora: info.corpora,
				};
			});
		}, ignoreCanceled);

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
			...withCorpusKey(pageCorpus ?? state.corpusKey, state),

			currentQuery: pageQuery,
			queryId: pageQuery === state.pageQuery || pageQuery === state.currentQuery ? state.queryId : nextId(),
		}));
	};
	private _onCorpusSelectedHandler = (corpusKey: string): void => {
		this.setState(state => withCorpusKey(corpusKey, state));
		setPageParam("corpus", corpusKey);
	};
	private _onQueryCommitHandler = (query: string): void => {
		this.setState(state => {
			let history = state.history;
			if (query.trim()) {
				// query isn't just spaces
				history = history.push(query);
				storyQueryHistory(state.corpusKey, history);
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

	render(): JSX.Element {
		return (
			<Page lang={this.lang} className="SearchPage">
				{optional(this.state.corpora.length > 0, () => (
					<NetspeakCorpusSelector
						lang={this.lang}
						selected={this.state.corpusKey}
						corpora={this.state.corpora}
						onCorpusSelected={this._onCorpusSelectedHandler}
					/>
				))}
				<div className="search-wrapper">
					<NetspeakSearch
						key={this.state.queryId + ";" + this.state.corpusKey}
						lang={this.lang}
						corpus={this.state.corpusKey}
						defaultQuery={this.state.pageQuery}
						onCommitQuery={this._onQueryCommitHandler}
						history={this.state.history}
						defaultExampleVisibility={this.state.exampleVisibility}
						onSetExampleVisibility={this._onSetExampleVisibilityHandler}
						pageSize={40}
						autoFocus={true}
					/>
				</div>
			</Page>
		);
	}
}

function withCorpusKey(corpusKey: string, state?: Readonly<State>): Pick<State, "corpusKey" | "history"> {
	return {
		corpusKey,
		history: state?.corpusKey === corpusKey ? state.history : loadQueryHistory(corpusKey),
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
