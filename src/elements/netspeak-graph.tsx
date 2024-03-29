import gearIcon from "../img/gearicon.svg";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Switch from "react-switch";
import Select from "react-select";
import Popup from "reactjs-popup";

import React, { useCallback, useEffect, useState } from "react";
import { Netspeak, NetspeakApiKind, Phrase, ReadonlyNetspeakSearchResult, WordTypes } from "../lib/netspeak";
import { optional } from "../lib/util";
import { NetspeakGraphBody } from "./netspeak-graph-body";
import { PhraseState } from "./netspeak-result-list";

import "./netspeak-graph.scss";
import { PopupPosition } from "reactjs-popup/dist/types";

const { createSliderWithTooltip } = Slider;
const Range = createSliderWithTooltip(Slider.Range);
const SliderWithTooltip = createSliderWithTooltip(Slider);
const RANGE_FIXED = 2;

type NetspeakGraphProps = {
	pageQuerry: string;
	corpus: string;
	statePhrases: PhraseState[];
	onSetSelection: (arg0: GraphElement[]) => void;
	highlightedPhrases: string[];
	setHighlightedPhrases: (arg0: string[]) => void;
	apiType: NetspeakApiKind;
};

export type NetspeakGraphColumn = {
	name: string;
	elements: GraphElement[];
};

export type GraphElement = {
	text: string;
	frequency: number;
	previous?: string[];
	yPosition?: number;
	phrases: GraphPhrase[];
};

export type GraphPhrase = {
	text: string;
	frequency: number;
	selected: boolean;
};

enum GroupWordsSetting {
	DoNotGroup = 0,
	FromLeading,
	FromTrailing,
}

const SYNONYM_PREFIX = "#";
const MULTIPLE_WILDCARD_SIGN = "...";

// create selection for word groupings
const wordGroupSelection = [
	{ value: GroupWordsSetting.DoNotGroup, label: "Do not split operator results with multiple words." },
	{ value: GroupWordsSetting.FromLeading, label: "Split to single words and group from the left." },
	{ value: GroupWordsSetting.FromTrailing, label: "Split to single words and group from the right." },
];

//  create frequency slider with separate state
const FrequencySlider = (props: {
	currentRange: number[];
	maxRange: number;
	frequencySliderPow: number;
	onChange: (value: number[]) => void;
}): JSX.Element => {
	const [sliderRange, setSliderRange] = useState(props.currentRange);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			props.onChange(sliderRange);
		}, 10);
		return () => clearTimeout(timeoutId);
	}, [props, sliderRange]);

	return (
		<Range
			min={0}
			max={1}
			step={1 / props.maxRange}
			value={sliderRange}
			onChange={setSliderRange}
			tipFormatter={value => `${(Math.pow(value, props.frequencySliderPow) * 100).toFixed(RANGE_FIXED)}%`}
		/>
	);
};

const NetspeakGraph = (props: NetspeakGraphProps): JSX.Element => {
	//range constants
	const maxRange = 10000;
	const frequencySliderPow = 3;

	const maxFrequencyInColumn = (column: NetspeakGraphColumn): number => {
		return Math.max(
			...column.elements.flatMap(element => {
				return element.frequency;
			})
		);
	};

	//cache last results of search

	const phraseCache: { [query: string]: ReadonlyNetspeakSearchResult } = {};

	const getPhrases = async (query: string, corpus: string, n: number): Promise<ReadonlyNetspeakSearchResult> => {
		if (phraseCache[query] === undefined) {
			phraseCache[query] = await Netspeak.getNetspeakClient(props.apiType).search({
				query: query,
				corpus: corpus,
				topk: n,
			});
		}
		return phraseCache[query];
	};

	//menu states
	const [alwaysShowPaths, setAlwaysShowPaths] = useState(true);
	const [maxRows, setMaxRows] = useState(15);
	const [frequencyRange, setFrequencyRange] = useState([0, 1]);
	const [orderWordsFromTopToBottom, setOrderWordsFromTopToBottom] = useState(true);
	const [groupWordsSetting, setGroupWordsSetting] = useState(GroupWordsSetting.DoNotGroup);

	//word selection for graph/search
	const [selectedWords, _setSelectedWords] = useState([] as { element: GraphElement; id: string }[]);

	const setSelectedWords = useCallback(
		(selection: { element: GraphElement; id: string }[]): void => {
			_setSelectedWords(selection);
			props.onSetSelection(selection.flatMap(tuple => tuple.element));
		},
		[props]
	);
	//reset word selectin on new query
	//memorize last query
	const [query, setQuery] = useState(props.pageQuerry);
	useEffect(() => {
		if (query !== props.pageQuerry) {
			setSelectedWords([]);
			setQuery(props.pageQuerry);
		}
	}, [query, props.pageQuerry, setSelectedWords]);

	//helper functions (for word selection)
	const toggleWordSelection = (element: GraphElement, id: string): void => {
		if (selectedWords.filter(word => word.id === id).length > 0) {
			deselectWord(element, id);
		} else {
			selectWord(element, id);
		}
	};
	const selectWord = (element: GraphElement, id: string): void => {
		setSelectedWords(selectedWords.concat({ element: element, id: id }));
	};

	const deselectWord = (element: GraphElement, id: string): void => {
		setSelectedWords(selectedWords.filter(word => word.id !== id));
	};

	/// separates the query to separate columns, with expected length. (cLength 0: multiple word wildcard, -1: synonyms, -2: 1 word wildcard)
	const mapQueryToColumns = (query: string): [title: string, cLength: number][] => {
		const columns: [title: string, cLength: number][] = [];

		query
			.split(/(\[.*\])|(\{.*\})/)
			.filter(word => word !== undefined)
			.filter(word => word.trim().length > 0)
			.forEach(word => {
				if (word.match(/^(\{|\[).*/)) {
					// if brackets brackets - dont split. set expected length.
					const len = word.split(" ").filter(word => !["{", "}", "[", "]"].includes(word)).length;
					columns.push([word, len]);
				} else {
					// else : split by whitespace. set negative length for differnt unknown cases (... : wildcard = 0, #: synonym = -1) (... , #)
					word.split(" ").forEach(word => {
						let len = 1;
						if (word === MULTIPLE_WILDCARD_SIGN) {
							len = 0;
						}
						if (word.startsWith(SYNONYM_PREFIX)) {
							len = -1;
						}
						// if (word == WILDCARD_SIGN) {
						//     len = -2
						// }
						columns.push([word, len]);
					});
				}
			});

		//remove double "..." columns (nonesense case that makes mapping results to graph messy)
		for (let i = 1; i < columns.length; i++) {
			if (columns[i][1] === 0 && columns[i - 1][1] === 0) {
				columns.splice(i, 1);
				i--;
			}
		}
		return columns;
	};

	///remove spaces at start and end of graph that connect to nothing
	const trimSpaces = (columns: NetspeakGraphColumn[]): NetspeakGraphColumn[] => {
		let running = true;
		const columnsIndexToPrune = new Set<number>().add(0).add(columns.length - 1);
		while (running) {
			const countBefore = columnsIndexToPrune.size;
			columns.forEach((column, cIndex) => {
				if (!columnsIndexToPrune.has(cIndex))
					column.elements.forEach(element => {
						//prune space if...
						if (element.text === " ") {
							//... next column is pruned and no non-space point back to it
							if (columnsIndexToPrune.has(cIndex + 1)) {
								if (
									columns[cIndex + 1].elements
										.filter(element => element.text !== " ")
										.filter(element => element.previous?.includes(" ")).length === 0
								) {
									columnsIndexToPrune.add(cIndex);
								}
							}
							//... previous column is pruned and no non-spaces are pointed back to
							if (columnsIndexToPrune.has(cIndex - 1)) {
								if (element.previous?.filter(text => text !== " ").length === 0) {
									columnsIndexToPrune.add(cIndex);
								}
							}
						}
					});
			});
			//keep iterating until no new marks are added
			running = countBefore !== columnsIndexToPrune.size;
		}
		//remove all marked
		columnsIndexToPrune.forEach(cIndex => {
			columns[cIndex].elements = columns[cIndex].elements.filter(element => element.text !== " ");
		});
		return columns;
	};

	const addSynonymsToGraphColumns = async (
		graphColumns: NetspeakGraphColumn[],
		columnIndex: number,
		columnLength: number,
		phraseIndex: number,
		phrase: Phrase
	): Promise<string[][]> => {
		const finalSynonymGrouping: string[][] = [];
		//find all adjacent synonyms in phrase
		const wordType = WordTypes.WORD_IN_DICTSET;
		let phraseLength = 0;
		//find length of phrase expression
		for (let i = phraseIndex; i < phrase.words.length; i++) {
			if (phrase.words[i].type === wordType) {
				phraseLength++;
			} else {
				break;
			}
		}

		//if empty column, return
		if (columnLength < 1) {
			return finalSynonymGrouping;
		}
		//if single column, trivial assignment
		else if (columnLength === 1) {
			finalSynonymGrouping.push([]);
			for (let i = 0; i + phraseIndex < phrase.words.length && i < phraseLength; i++) {
				finalSynonymGrouping[0].push(phrase.words[phraseIndex + i].text);
			}
		}
		//if not same length, solve.
		else if (phraseLength > columnLength) {
			//max size of phrase : difference between phrases and column count + 1, to leave enough for following ones.
			const maxSize = 1 + phraseLength - columnLength;
			// let res = Netspeak.instance.search({
			//     query: graphColumns[columnIndex].name,
			//     corpus: props.corpus,
			//     topk: 30
			// })
			const res = await getPhrases(graphColumns[columnIndex].name, props.corpus, 100);
			try {
				const synonyms = await res.phrases
					.filter(fetchedPhrase => {
						return phrase.text.startsWith(fetchedPhrase.text) && fetchedPhrase.words.length <= maxSize;
					})
					.flatMap(async fetchedPhrase => {
						//call func recursively. if call succesful append and return
						const subgroup = await addSynonymsToGraphColumns(
							graphColumns,
							columnIndex + 1,
							columnLength - 1,
							phraseIndex + fetchedPhrase.words.length,
							phrase
						);
						if (subgroup.length > 0) {
							subgroup.unshift(fetchedPhrase.words.flatMap(a => a.text));
							return subgroup;
						}
					})
					.reduce(async (a, b) => {
						const aVal = await a;
						const bVal = await b;
						if (aVal?.length ?? 0 > (bVal?.length ?? 0)) return aVal;
						return bVal;
					}, Promise.resolve(undefined));

				return synonyms ?? [];
			} catch {
				return [];
			}
		}
		//else: allocate 1-to-1
		else {
			for (let i = 0; i + phraseIndex < phrase.words.length && i < phraseLength; i++) {
				finalSynonymGrouping.push([phrase.words[phraseIndex + i].text]);
			}
		}
		return finalSynonymGrouping;
	};

	const splitColumn = (
		column: NetspeakGraphColumn,
		maxLen: number,
		previousMaxLen: number,
		splitFrom: GroupWordsSetting
	): NetspeakGraphColumn[] => {
		//find number of sub culumns, (1 column per word)
		const maxColumns = maxLen;
		//prepare array
		const splitColumns: NetspeakGraphColumn[] = [];
		for (let i = 0; i < maxColumns; i++) {
			splitColumns.push({ name: column.name, elements: [] });
		}
		for (let i = 0; i < column.elements.length; i++) {
			const element = column.elements[i];
			let elementWords = element.text.split(" ");
			// //add spaces to array to enable inheritance
			if (splitFrom === GroupWordsSetting.FromTrailing) {
				while (elementWords.length < maxColumns) {
					elementWords.unshift(" ");
				}
			}
			if (splitFrom === GroupWordsSetting.FromLeading) {
				while (elementWords.length < maxColumns) {
					elementWords.push(" ");
				}
			}

			//turn empty words to spaces
			elementWords = elementWords.flatMap(word => {
				if (word === "") return " ";
				else return word;
			});
			for (let j = 0; j < elementWords.length; j++) {
				const wordElement: GraphElement = {
					frequency: element.frequency,
					text: elementWords[j],
					phrases: element.phrases,
					previous:
						j > 0
							? [elementWords[j - 1]]
							: element.previous?.flatMap(previous => {
									if (previous.length === 1) {
										return previous[0];
									}
									if (splitFrom === GroupWordsSetting.FromLeading) {
										return previous.split(" ").length < previousMaxLen
											? " "
											: previous.split(" ").pop() ?? " ";
									} else {
										return previous.split(" ").pop() ?? " ";
									}
							  }),
				};
				// let targetColumn = (splitFrom == Direction.Left) ? j : j + maxColumns - elementWords.length
				splitColumns[j].elements.push(wordElement);
			}
		}
		return splitColumns;
	};

	const phraseToNode = async (
		phrase: Phrase,
		columns: [title: string, cLength: number][],
		graphColumns: NetspeakGraphColumn[],
		promises: Promise<string[][]>[]
	): Promise<void> => {
		let last = "";
		const frequency = phrase.frequency;
		let i = 0;
		const words = phrase.words;
		const wordsText = phrase.words.flatMap(word => {
			return word.text;
		});
		const selected =
			props.statePhrases.filter(val => {
				return val.expanded && val.phrase.id === phrase.id;
			}).length > 0;

		const graphPhrase: GraphPhrase = { text: phrase.text, frequency: phrase.frequency, selected: selected };
		//iterate over every column for every phrase, skipping len forward, resolve unclear allocations (due to len)

		for (let j = 0; j < graphColumns.length && j < columns.length && i < words.length; j++) {
			const expectedLen = columns[j][1];
			// if len unknown:
			if (expectedLen <= 0) {
				// if  wildcard :
				if (expectedLen === 0 || expectedLen === -2) {
					let realLen = 0;
					const wordType = expectedLen === 0 ? WordTypes.WORD_FOR_STAR : WordTypes.WORD_FOR_QMARK;
					// allocate words until next word has different type
					for (let k = i; k < words.length; k++) {
						if (words[k].type === wordType) {
							realLen++;
						} else {
							break;
						}
					}
					let text: string;
					// if not empty word
					if (realLen > 0) {
						text = wordsText.slice(i, i + realLen).join(" ");
					} else {
						text = " ";
					}
					graphColumns[j].elements.push({
						text: text,
						frequency: frequency,
						previous: j > 0 ? [last] : undefined,
						phrases: [graphPhrase],
					});
					last = text!;
					i += realLen;
				}
				//if synonym
				if (expectedLen === -1) {
					// 1. find all adjacened synonyms in query
					let synonymsCount = 1;
					while (j + synonymsCount < columns.length) {
						if (columns[j + synonymsCount][1] === -1) {
							synonymsCount++;
						} else break;
					}
					//2. add synonyms, increment i (word index in phrase) & j (column index)
					const groupedSynonymsPromise = addSynonymsToGraphColumns(graphColumns, j, synonymsCount, i, phrase);
					promises.push(groupedSynonymsPromise);
					const groupedSynonyms = await groupedSynonymsPromise;
					while (j < columns.length && i < words.length && groupedSynonyms.length > 0) {
						const text = groupedSynonyms[0].join(" ");
						graphColumns[j].elements.push({
							text: text,
							frequency: frequency,
							previous: j > 0 ? [last] : undefined,
							phrases: [graphPhrase],
						});
						last = text;
						j += 1;
						i += groupedSynonyms[0].length;
						groupedSynonyms.shift();
					}

					//compensate for regualar incrementation of j
					j -= 1;
				}
			}
			//if simple case: length known
			else {
				const text = wordsText.slice(i, i + expectedLen).join(" ");
				graphColumns[j].elements.push({
					text: text,
					frequency: frequency,
					previous: j > 0 ? [last] : undefined,
					phrases: [graphPhrase],
				});
				last = text;
				i += expectedLen;
			}
		}
	};
	const generateGraphNodes = async (): Promise<NetspeakGraphColumn[]> => {
		if (query === "") {
			return [];
		}

		const readonlyPhrases = (await getPhrases(props.pageQuerry, props.corpus, 100)).phrases;

		//clone phrases so they are not read only
		const phrases: Phrase[] = [];
		readonlyPhrases.forEach(val => phrases.push(val));

		//init graph columns

		let columns = mapQueryToColumns(props.pageQuerry);
		let graphColumns: NetspeakGraphColumn[] = [];

		//handle pinned phrases by adding extra columns to fit pinned elements from longer queries
		props.statePhrases.forEach(statePhrase => {
			if (statePhrase.pinned) {
				console.log(statePhrase);
				if (statePhrase.phrase.query !== props.pageQuerry) {
					// phrases.push(statePhrase.phrase)
					//if phrase longer than there are columns - add new ones
					const pinnedQueryColumns = mapQueryToColumns(statePhrase.phrase.query);
					if (pinnedQueryColumns.length > columns.length) {
						columns = columns.concat(
							pinnedQueryColumns.splice(pinnedQueryColumns.length - columns.length - 1)
						);
					}
				}
			}
		});

		for (let i = 0; i < columns.length; i++) {
			graphColumns.push({ name: columns[i][0], elements: [] });
		}

		// create nodes before sorting them
		const promises: Promise<string[][]>[] = [];
		phrases.forEach(async phrase => {
			phraseToNode(phrase, columns, graphColumns, promises);
		});
		props.statePhrases.forEach(async statePhrase => {
			if (statePhrase.pinned) {
				if (statePhrase.phrase.query !== props.pageQuerry) {
					phraseToNode(
						statePhrase.phrase,
						mapQueryToColumns(statePhrase.phrase.query),
						graphColumns,
						promises
					);
				}
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const waiting = await Promise.all(promises);
		//split columns to group similar words together
		if (groupWordsSetting !== GroupWordsSetting.DoNotGroup) {
			let splitColumns: NetspeakGraphColumn[] = [];

			let previousMaxLen = 0;

			for (let i = 0; i < graphColumns.length; i++) {
				const maxColumns = Math.max.apply(
					null,
					graphColumns[i].elements.flatMap(element => {
						return element.text.split(" ").length;
					})
				);
				splitColumns = splitColumns.concat(
					splitColumn(graphColumns[i], maxColumns, previousMaxLen, groupWordsSetting)
				);
				previousMaxLen = maxColumns;
			}
			graphColumns = splitColumns;
		}

		//sort and combine all entries by frequency

		const maxPhraseFrequency = maxFrequencyInColumn(graphColumns[0]);
		const maxFrequency = maxPhraseFrequency * Math.pow(frequencyRange[1], frequencySliderPow);
		const minFrequency = maxPhraseFrequency * Math.pow(frequencyRange[0], frequencySliderPow);

		let removedPhrases: GraphPhrase[] = [];

		for (let i = 0; i < graphColumns.length; i++) {
			let phrasesToRemove: GraphPhrase[] = [];
			const sortedColumn: NetspeakGraphColumn = { name: graphColumns[i].name, elements: [] };
			//remove any paths with frequencies out of range
			graphColumns[i].elements = graphColumns[i].elements.filter(element => {
				return element.frequency <= maxFrequency && element.frequency >= minFrequency;
			});
			//go over column, sum, append to sortedColumn and remove all of one text type until empty
			while (graphColumns[i].elements.length > 0) {
				const text = graphColumns[i].elements[0].text;
				const previous: string[] = [];
				let frequency = 0;
				let summedPhrases: GraphPhrase[] = [];
				//sum and filter
				graphColumns[i].elements = graphColumns[i].elements.filter(element => {
					if (element.text === text) {
						frequency += element.frequency;
						if (element.previous !== undefined) {
							if (!previous.includes(element.previous[0])) previous.push(element.previous[0]);
						}
						summedPhrases = summedPhrases.concat(element.phrases);
						return false;
					}
					return true;
				});
				sortedColumn.elements.push({
					text: text,
					frequency: frequency,
					previous: previous,
					phrases: summedPhrases,
				});
			}
			//sort column
			sortedColumn.elements.sort((a, b) => {
				return b.frequency - a.frequency;
			});
			//replace (now empty) column with sortedColumn
			graphColumns[i] = sortedColumn;

			//!remove words past max; join their phrases to propagate later
			//find all phrases to remove
			graphColumns[i].elements.forEach((element, eIndex) => {
				if (eIndex >= maxRows) {
					phrasesToRemove = [...new Set([...phrasesToRemove, ...element.phrases])];
				}
			});
			// remove the overflowing words
			graphColumns[i].elements = graphColumns[i].elements.slice(0, maxRows);
			removedPhrases = [...new Set([...removedPhrases, ...phrasesToRemove])];
		}

		//propagate removal of overflowing words (remove any word that is no longer connected to at least one phrase)
		graphColumns.forEach((column, cIndex) => {
			column.elements.forEach((element, eIndex) => {
				graphColumns[cIndex].elements[eIndex].phrases = element.phrases.filter(val => {
					return !removedPhrases.some(removedPhrase => {
						return removedPhrase.text === val.text && removedPhrase.frequency === val.frequency;
					});
				});
			});
			graphColumns[cIndex].elements = graphColumns[cIndex].elements.filter(val => {
				return val.phrases.length > 0;
			});
		});

		//remove any trailing spaces
		graphColumns = trimSpaces(graphColumns);
		return graphColumns;
	};

	// * Render page
	const loadGraph = useAsync(generateGraphNodes, [
		query,
		props.statePhrases,
		frequencyRange,
		maxRows,
		groupWordsSetting,
	]);
	const columns = loadGraph.res ?? [];
	const screenWidth = useWindowDimensions().width;
	return (
		<div id="graphWrapper" className={loadGraph.loading ? "loading" : ""}>
			{optional(props.pageQuerry !== "", () => (
				<NetspeakGraphBody
					columns={columns}
					alwaysShowPaths={alwaysShowPaths}
					maxRows={maxRows}
					orderWordsFromTop={orderWordsFromTopToBottom}
					query={props.pageQuerry}
					selectedWords={selectedWords}
					toggleWordSelection={toggleWordSelection}
					highlightedPhrases={props.highlightedPhrases}
					setHighlightedPhrases={props.setHighlightedPhrases}
				/>
			))}

			{/* MARK: Settings Menu! */}

			<Popup
				trigger={<img src={gearIcon} alt="Settings" className="GraphMenuButton" />}
				position={(screenWidth >= 1150 ? ("left top" as PopupPosition) : ("right center" as PopupPosition))!}>
				<div className="popupGrid" style={{ display: "grid" }}>
					<h3> Graph Settings </h3>

					<div className="switchWrapper">
						<label>
							<span> Show all paths </span>

							<Switch
								onChange={() => setAlwaysShowPaths(!alwaysShowPaths)}
								checked={alwaysShowPaths}
								className="react-switch"
								height={20}
								width={50}
							/>
						</label>
					</div>
					<div className="switchWrapper">
						<label>
							<span> Order words from top to bottom </span>

							<Switch
								onChange={() => setOrderWordsFromTopToBottom(!orderWordsFromTopToBottom)}
								checked={orderWordsFromTopToBottom}
								className="react-switch"
								height={20}
								width={50}
							/>
						</label>
					</div>

					<Select
						options={wordGroupSelection}
						defaultValue={wordGroupSelection[groupWordsSetting]}
						onChange={selection => {
							if (selection) {
								setGroupWordsSetting(selection?.value);
							}
						}}
					/>

					<div>
						<p>Max Rows Shown ({maxRows})</p>

						<SliderWithTooltip min={1} max={50} value={maxRows} onChange={setMaxRows} />
					</div>
					<div>
						<p>
							Show Phrases In Frequency Range (
							{(Math.pow(frequencyRange[0], frequencySliderPow) * 100).toFixed(RANGE_FIXED)}% to{" "}
							{(Math.pow(frequencyRange[1], frequencySliderPow) * 100).toFixed(RANGE_FIXED)}%)
						</p>
						<FrequencySlider
							currentRange={frequencyRange}
							maxRange={maxRange}
							frequencySliderPow={frequencySliderPow}
							onChange={setFrequencyRange}
						/>
					</div>
				</div>
			</Popup>
		</div>
	);
};

function useAsync<T>(
	fn: () => Promise<T>,
	deps: any[]
): { loading: boolean; error: Error | undefined; res: T | undefined } {
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | undefined>();
	const [res, setRes] = useState<T | undefined>();
	useEffect(() => {
		setLoading(true);
		let cancel = false;
		fn().then(
			res => {
				if (cancel) return;
				setLoading(false);
				setRes(res);
			},
			error => {
				if (cancel) return;
				setLoading(false);
				setError(error);
			}
		);
		return () => {
			cancel = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
	return { loading, error, res };
}

//window dimensions function to notice resizing
function getWindowDimensions(): {
	width: number;
	height: number;
} {
	const { innerWidth: width, innerHeight: height } = window;
	return {
		width,
		height,
	};
}

const useWindowDimensions = (): {
	width: number;
	height: number;
} => {
	const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

	useEffect(() => {
		function handleResize(): void {
			setWindowDimensions(getWindowDimensions());
		}

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return windowDimensions;
};

export default NetspeakGraph;
