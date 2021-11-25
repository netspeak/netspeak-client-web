<<<<<<< Updated upstream
import React, { useEffect, useState } from "react";
import { Phrase, Netspeak, ReadonlyNetspeakSearchResult, WordTypes } from "../lib/netspeak";
import { NetspeakGraphBody } from "./netspeak-graph-body";
import Popup from "reactjs-popup";
import gearIcon from "../img/gearicon.svg";
import "./netspeak-graph.scss";
import Switch from "react-switch";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Select from "react-select";
import { PhraseState } from "./netspeak-result-list";
import { read } from "fs";
import { optional } from "../lib/util";
import { Position } from "reactjs-popup";
=======
import gearIcon from "../img/gearicon.svg";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import Switch from "react-switch";
import Select from "react-select";
import Popup, { Position } from "reactjs-popup";

import React, { useState, useEffect, useCallback } from "react";
import { ReadonlyNetspeakSearchResult, Netspeak, Phrase, WordTypes } from "../lib/netspeak";
import { optional } from "../lib/util";
import { NetspeakGraphBody } from "./netspeak-graph-body";
import { PhraseState } from "./netspeak-result-list";

import "./netspeak-graph.scss";
>>>>>>> Stashed changes

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
};

<<<<<<< Updated upstream
type NetspeakGraphSettings = {};
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
const WILDCARD_SIGN = "?";
=======
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
}) => {
=======
}): JSX.Element => {
>>>>>>> Stashed changes
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

//cache last results of search

const phraseCache: { [query: string]: ReadonlyNetspeakSearchResult } = {};

<<<<<<< Updated upstream
const getPhrases = async (query: string, corpus: string, n: number) => {
	if (phraseCache[query] == undefined) {
=======
const getPhrases = async (query: string, corpus: string, n: number): Promise<ReadonlyNetspeakSearchResult> => {
	if (phraseCache[query] === undefined) {
>>>>>>> Stashed changes
		phraseCache[query] = await Netspeak.instance.search({
			query: query,
			corpus: corpus,
			topk: n,
		});
	}
	return phraseCache[query];
};

<<<<<<< Updated upstream
const NetspeakGraph = (props: NetspeakGraphProps) => {
=======
const NetspeakGraph = (props: NetspeakGraphProps): JSX.Element => {
>>>>>>> Stashed changes
	//range constants
	const maxRange = 10000;
	const frequencySliderPow = 3;

<<<<<<< Updated upstream
	const maxFrequencyInColumn = (column: NetspeakGraphColumn) => {
		return Math.max.apply(
			Math,
			column.elements.flatMap(element => {
=======
	const maxFrequencyInColumn = (column: NetspeakGraphColumn): number => {
		return Math.max(
			...column.elements.flatMap(element => {
>>>>>>> Stashed changes
				return element.frequency;
			})
		);
	};

	//menu states
	const [alwaysShowPaths, setAlwaysShowPaths] = useState(true);
	const [maxRows, setMaxRows] = useState(15);
	const [frequencyRange, setFrequencyRange] = useState([0, 1]);
	const [orderWordsFromTopToBottom, setOrderWordsFromTopToBottom] = useState(true);
	const [groupWordsSetting, setGroupWordsSetting] = useState(GroupWordsSetting.DoNotGroup);

	//word selection for graph/search
	const [selectedWords, _setSelectedWords] = useState([] as { element: GraphElement; id: string }[]);

<<<<<<< Updated upstream
	const setSelectedWords = (selection: { element: GraphElement; id: string }[]) => {
		_setSelectedWords(selection);
		props.onSetSelection(selection.flatMap(tuple => tuple.element));
	};
	//reset word selectin on new query
	//memorize last query
	const [query, setQuery] = useState(props.pageQuerry);
	if (query != props.pageQuerry) {
		setSelectedWords([]);
		setQuery(props.pageQuerry);
	}

	//helper functions (for word selection)
	const toggleWordSelection = (element: GraphElement, id: string) => {
		if (selectedWords.filter(word => word.id == id).length > 0) {
=======
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
>>>>>>> Stashed changes
			deselectWord(element, id);
		} else {
			selectWord(element, id);
		}
	};
<<<<<<< Updated upstream
	const selectWord = (element: GraphElement, id: string) => {
		setSelectedWords(selectedWords.concat({ element: element, id: id }));
	};

	const deselectWord = (element: GraphElement, id: string) => {
		setSelectedWords(selectedWords.filter(word => word.id != id));
	};

	/// separates the query to separate columns, with expected length. (cLength 0: multiple word wildcard, -1: synonyms, -2: 1 word wildcard)
	const mapQueryToColumns = (query: string) => {
=======
	const selectWord = (element: GraphElement, id: string): void => {
		setSelectedWords(selectedWords.concat({ element: element, id: id }));
	};

	const deselectWord = (element: GraphElement, id: string): void => {
		setSelectedWords(selectedWords.filter(word => word.id !== id));
	};

	/// separates the query to separate columns, with expected length. (cLength 0: multiple word wildcard, -1: synonyms, -2: 1 word wildcard)
	const mapQueryToColumns = (query: string): [title: string, cLength: number][] => {
>>>>>>> Stashed changes
		const columns: [title: string, cLength: number][] = [];

		query
			.split(/(\[.*\])|(\{.*\})/)
<<<<<<< Updated upstream
			.filter(word => word != undefined)
			.filter(word => word.trim().length > 0)
			.map(word => {
=======
			.filter(word => word !== undefined)
			.filter(word => word.trim().length > 0)
			.forEach(word => {
>>>>>>> Stashed changes
				if (word.match(/^(\{|\[).*/)) {
					// if brackets brackets - dont split. set expected length.
					const len = word.split(" ").filter(word => !["{", "}", "[", "]"].includes(word)).length;
					columns.push([word, len]);
				} else {
					// else : split by whitespace. set negative length for differnt unknown cases (... : wildcard = 0, #: synonym = -1) (... , #)
<<<<<<< Updated upstream
					word.split(" ").map(word => {
						let len = 1;
						if (word == MULTIPLE_WILDCARD_SIGN) {
=======
					word.split(" ").forEach(word => {
						let len = 1;
						if (word === MULTIPLE_WILDCARD_SIGN) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
			if (columns[i][1] == 0 && columns[i - 1][1] == 0) {
=======
			if (columns[i][1] === 0 && columns[i - 1][1] === 0) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
			columns.map((column, cIndex) => {
				if (!columnsIndexToPrune.has(cIndex))
					column.elements.map(element => {
						//prune space if...
						if (element.text == " ") {
=======
			columns.forEach((column, cIndex) => {
				if (!columnsIndexToPrune.has(cIndex))
					column.elements.forEach(element => {
						//prune space if...
						if (element.text === " ") {
>>>>>>> Stashed changes
							//... next column is pruned and no non-space point back to it
							if (columnsIndexToPrune.has(cIndex + 1)) {
								if (
									columns[cIndex + 1].elements
<<<<<<< Updated upstream
										.filter(element => element.text != " ")
										.filter(element => element.previous?.includes(" ")).length == 0
=======
										.filter(element => element.text !== " ")
										.filter(element => element.previous?.includes(" ")).length === 0
>>>>>>> Stashed changes
								) {
									columnsIndexToPrune.add(cIndex);
								}
							}
							//... previous column is pruned and no non-spaces are pointed back to
							if (columnsIndexToPrune.has(cIndex - 1)) {
<<<<<<< Updated upstream
								if (element.previous?.filter(text => text != " ").length == 0) {
=======
								if (element.previous?.filter(text => text !== " ").length === 0) {
>>>>>>> Stashed changes
									columnsIndexToPrune.add(cIndex);
								}
							}
						}
					});
			});
			//keep iterating until no new marks are added
<<<<<<< Updated upstream
			running = countBefore != columnsIndexToPrune.size;
		}
		//remove all marked
		columnsIndexToPrune.forEach(cIndex => {
			columns[cIndex].elements = columns[cIndex].elements.filter(element => element.text != " ");
=======
			running = countBefore !== columnsIndexToPrune.size;
		}
		//remove all marked
		columnsIndexToPrune.forEach(cIndex => {
			columns[cIndex].elements = columns[cIndex].elements.filter(element => element.text !== " ");
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
		for (var i = phraseIndex; i < phrase.words.length; i++) {
			if (phrase.words[i].type == wordType) {
=======
		for (let i = phraseIndex; i < phrase.words.length; i++) {
			if (phrase.words[i].type === wordType) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
		else if (columnLength == 1) {
			finalSynonymGrouping.push([]);
			for (var i = 0; i + phraseIndex < phrase.words.length && i < phraseLength; i++) {
=======
		else if (columnLength === 1) {
			finalSynonymGrouping.push([]);
			for (let i = 0; i + phraseIndex < phrase.words.length && i < phraseLength; i++) {
>>>>>>> Stashed changes
				finalSynonymGrouping[0].push(phrase.words[phraseIndex + i].text);
			}
		}
		//if not same length, solve.
		else if (phraseLength > columnLength) {
			//max size of phrase : difference between phrases and column count + 1, to leave enough for following ones.
			const maxSize = 1 + phraseLength - columnLength;
<<<<<<< Updated upstream
			// var res = Netspeak.instance.search({
=======
			// let res = Netspeak.instance.search({
>>>>>>> Stashed changes
			//     query: graphColumns[columnIndex].name,
			//     corpus: props.corpus,
			//     topk: 30
			// })
			const res = await getPhrases(graphColumns[columnIndex].name, props.corpus, 100);
<<<<<<< Updated upstream
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
		}
		//else: allocate 1-to-1
		else {
			for (var i = 0; i + phraseIndex < phrase.words.length && i < phraseLength; i++) {
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
	) => {
=======
	): NetspeakGraphColumn[] => {
>>>>>>> Stashed changes
		//find number of sub culumns, (1 column per word)
		const maxColumns = maxLen;
		//prepare array
		const splitColumns: NetspeakGraphColumn[] = [];
<<<<<<< Updated upstream
		for (var i = 0; i < maxColumns; i++) {
			splitColumns.push({ name: column.name, elements: [] });
		}
		for (var i = 0; i < column.elements.length; i++) {
			const element = column.elements[i];
			let elementWords = element.text.split(" ");
			// //add spaces to array to enable inheritance
			if (splitFrom == GroupWordsSetting.FromTrailing) {
=======
		for (let i = 0; i < maxColumns; i++) {
			splitColumns.push({ name: column.name, elements: [] });
		}
		for (let i = 0; i < column.elements.length; i++) {
			const element = column.elements[i];
			let elementWords = element.text.split(" ");
			// //add spaces to array to enable inheritance
			if (splitFrom === GroupWordsSetting.FromTrailing) {
>>>>>>> Stashed changes
				while (elementWords.length < maxColumns) {
					elementWords.unshift(" ");
				}
			}
<<<<<<< Updated upstream
			if (splitFrom == GroupWordsSetting.FromLeading) {
=======
			if (splitFrom === GroupWordsSetting.FromLeading) {
>>>>>>> Stashed changes
				while (elementWords.length < maxColumns) {
					elementWords.push(" ");
				}
			}

			//turn empty words to spaces
			elementWords = elementWords.flatMap(word => {
<<<<<<< Updated upstream
				if (word == "") return " ";
=======
				if (word === "") return " ";
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
									if (previous.length == 1) {
										return previous[0];
									}
									if (splitFrom == GroupWordsSetting.FromLeading) {
=======
									if (previous.length === 1) {
										return previous[0];
									}
									if (splitFrom === GroupWordsSetting.FromLeading) {
>>>>>>> Stashed changes
										return previous.split(" ").length < previousMaxLen
											? " "
											: previous.split(" ").pop() ?? " ";
									} else {
										return previous.split(" ").pop() ?? " ";
									}
							  }),
				};
<<<<<<< Updated upstream
				// var targetColumn = (splitFrom == Direction.Left) ? j : j + maxColumns - elementWords.length
=======
				// let targetColumn = (splitFrom == Direction.Left) ? j : j + maxColumns - elementWords.length
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
	) => {
=======
	): Promise<void> => {
>>>>>>> Stashed changes
		let last = "";
		const frequency = phrase.frequency;
		let i = 0;
		const words = phrase.words;
		const wordsText = phrase.words.flatMap(word => {
			return word.text;
		});
		const selected =
			props.statePhrases.filter(val => {
<<<<<<< Updated upstream
				return val.expanded && val.phrase.id == phrase.id;
=======
				return val.expanded && val.phrase.id === phrase.id;
>>>>>>> Stashed changes
			}).length > 0;

		const graphPhrase: GraphPhrase = { text: phrase.text, frequency: phrase.frequency, selected: selected };
		//iterate over every column for every phrase, skipping len forward, resolve unclear allocations (due to len)

<<<<<<< Updated upstream
		for (let j = 0; j < columns.length && i < words.length; j++) {
=======
		for (let j = 0; j < graphColumns.length && j < columns.length && i < words.length; j++) {
>>>>>>> Stashed changes
			const expectedLen = columns[j][1];
			// if len unknown:
			if (expectedLen <= 0) {
				// if  wildcard :
<<<<<<< Updated upstream
				if (expectedLen == 0 || expectedLen == -2) {
					let realLen = 0;
					const wordType = expectedLen == 0 ? WordTypes.WORD_FOR_STAR : WordTypes.WORD_FOR_QMARK;
					// allocate words until next word has different type
					for (let k = i; k < words.length; k++) {
						if (words[k].type == wordType) {
=======
				if (expectedLen === 0 || expectedLen === -2) {
					let realLen = 0;
					const wordType = expectedLen === 0 ? WordTypes.WORD_FOR_STAR : WordTypes.WORD_FOR_QMARK;
					// allocate words until next word has different type
					for (let k = i; k < words.length; k++) {
						if (words[k].type === wordType) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
				if (expectedLen == -1) {
					// 1. find all adjacened synonyms in query
					let synonymsCount = 1;
					while (j + synonymsCount < columns.length) {
						if (columns[j + synonymsCount][1] == -1) {
=======
				if (expectedLen === -1) {
					// 1. find all adjacened synonyms in query
					let synonymsCount = 1;
					while (j + synonymsCount < columns.length) {
						if (columns[j + synonymsCount][1] === -1) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
	const generateGraphNodes = async () => {
		if (query == "") {
			return;
=======
	const generateGraphNodes = async (): Promise<NetspeakGraphColumn[]> => {
		if (query === "") {
			return [];
>>>>>>> Stashed changes
		}

		const readonlyPhrases = (await getPhrases(props.pageQuerry, props.corpus, 100)).phrases;

		//clone phrases so they are not read only
		const phrases: Phrase[] = [];
		readonlyPhrases.forEach(val => phrases.push(val));

		//init graph columns

		let columns = mapQueryToColumns(props.pageQuerry);
		let graphColumns: NetspeakGraphColumn[] = [];

		//handle pinned phrases by adding extra columns to fit pinned elements from longer queries
<<<<<<< Updated upstream
		props.statePhrases.map(statePhrase => {
			if (statePhrase.pinned) {
				if (statePhrase.phrase.query != props.pageQuerry) {
=======
		props.statePhrases.forEach(statePhrase => {
			if (statePhrase.pinned) {
				console.log(statePhrase);
				if (statePhrase.phrase.query !== props.pageQuerry) {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
		for (var i = 0; i < columns.length; i++) {
=======
		for (let i = 0; i < columns.length; i++) {
>>>>>>> Stashed changes
			graphColumns.push({ name: columns[i][0], elements: [] });
		}

		// create nodes before sorting them
		const promises: Promise<string[][]>[] = [];
		phrases.forEach(async phrase => {
			phraseToNode(phrase, columns, graphColumns, promises);
		});
		props.statePhrases.forEach(async statePhrase => {
			if (statePhrase.pinned) {
<<<<<<< Updated upstream
				if (statePhrase.phrase.query != props.pageQuerry) {
=======
				if (statePhrase.phrase.query !== props.pageQuerry) {
>>>>>>> Stashed changes
					phraseToNode(
						statePhrase.phrase,
						mapQueryToColumns(statePhrase.phrase.query),
						graphColumns,
						promises
					);
				}
			}
		});

<<<<<<< Updated upstream
		const waiting = await Promise.all(promises);
		//split columns to group similar words together
		if (groupWordsSetting != GroupWordsSetting.DoNotGroup) {
=======
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const waiting = await Promise.all(promises);
		//split columns to group similar words together
		if (groupWordsSetting !== GroupWordsSetting.DoNotGroup) {
>>>>>>> Stashed changes
			let splitColumns: NetspeakGraphColumn[] = [];

			let previousMaxLen = 0;

<<<<<<< Updated upstream
			for (var i = 0; i < graphColumns.length; i++) {
=======
			for (let i = 0; i < graphColumns.length; i++) {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
		for (var i = 0; i < graphColumns.length; i++) {
=======
		for (let i = 0; i < graphColumns.length; i++) {
			let phrasesToRemove: GraphPhrase[] = [];
>>>>>>> Stashed changes
			const sortedColumn: NetspeakGraphColumn = { name: graphColumns[i].name, elements: [] };
			//remove any paths with frequencies out of range
			graphColumns[i].elements = graphColumns[i].elements.filter(element => {
				return element.frequency <= maxFrequency && element.frequency >= minFrequency;
			});
			//go over column, sum, append to sortedColumn and remove all of one text type until empty
			while (graphColumns[i].elements.length > 0) {
				const text = graphColumns[i].elements[0].text;
<<<<<<< Updated upstream
				var previous: string[] = [];
				var frequency = 0;
				var summedPhrases: GraphPhrase[] = [];
				//sum and filter
				graphColumns[i].elements = graphColumns[i].elements.filter(element => {
					if (element.text == text) {
						frequency += element.frequency;
						if (element.previous != undefined) {
=======
				const previous: string[] = [];
				let frequency = 0;
				let summedPhrases: GraphPhrase[] = [];
				//sum and filter
				graphColumns[i].elements = graphColumns[i].elements.filter(element => {
					if (element.text === text) {
						frequency += element.frequency;
						if (element.previous !== undefined) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
			graphColumns[i].elements.map((element, eIndex) => {
				if (eIndex >= maxRows) {
					removedPhrases = [...new Set([...removedPhrases, ...element.phrases])];
=======
			graphColumns[i].elements.forEach((element, eIndex) => {
				if (eIndex >= maxRows) {
					phrasesToRemove = [...new Set([...phrasesToRemove, ...element.phrases])];
>>>>>>> Stashed changes
				}
			});
			// remove the overflowing words
			graphColumns[i].elements = graphColumns[i].elements.slice(0, maxRows);
<<<<<<< Updated upstream
		}

		//propagate removal of overflowing words (remove any word that is no longer connected to at least one phrase)
		graphColumns.map((column, cIndex) => {
			column.elements.map((element, eIndex) => {
				graphColumns[cIndex].elements[eIndex].phrases = element.phrases.filter(val => {
					return !removedPhrases.some(removedPhrase => {
						return removedPhrase.text == val.text && removedPhrase.frequency == val.frequency;
=======
			removedPhrases = [...new Set([...removedPhrases, ...phrasesToRemove])];
		}

		//propagate removal of overflowing words (remove any word that is no longer connected to at least one phrase)
		graphColumns.forEach((column, cIndex) => {
			column.elements.forEach((element, eIndex) => {
				graphColumns[cIndex].elements[eIndex].phrases = element.phrases.filter(val => {
					return !removedPhrases.some(removedPhrase => {
						return removedPhrase.text === val.text && removedPhrase.frequency === val.frequency;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
	// var graphColumns = useAsync(generateGraphNodes, [props.pageQuerry, frequencyRange]).res ?? []
	// setGraphColumns(await generateGraphNodes(result.res?.phrases ?? [], columns))
	const loadGraph = useAsync(generateGraphNodes, [
		props.pageQuerry,
=======
	const loadGraph = useAsync(generateGraphNodes, [
		query,
>>>>>>> Stashed changes
		props.statePhrases,
		frequencyRange,
		maxRows,
		groupWordsSetting,
	]);
	const columns = loadGraph.res ?? [];
	const screenWidth = useWindowDimensions().width;
	return (
		<div id="graphWrapper" className={loadGraph.loading ? "loading" : ""}>
<<<<<<< Updated upstream
			{optional(props.pageQuerry != "", () => (
=======
			{optional(props.pageQuerry !== "", () => (
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
				position={(screenWidth >= 1150 ? ("left top" as Position) : ("right" as Position))!}>
=======
				position={(screenWidth >= 1150 ? ("left top" as Position) : ("right center" as Position))!}>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
const useAsync = <T extends unknown>(fn: () => Promise<T>, deps: any[]) => {
=======
const useAsync = <T extends unknown>(
	fn: () => Promise<T>,
	deps: any[]
): { loading: boolean; error: Error | undefined; res: T | undefined } => {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
	}, [fn]);
=======
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
>>>>>>> Stashed changes
	return { loading, error, res };
};

//window dimensions function to notice resizing
<<<<<<< Updated upstream
function getWindowDimensions() {
=======
function getWindowDimensions(): {
	width: number;
	height: number;
} {
>>>>>>> Stashed changes
	const { innerWidth: width, innerHeight: height } = window;
	return {
		width,
		height,
	};
}

<<<<<<< Updated upstream
const useWindowDimensions = () => {
	const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

	useEffect(() => {
		function handleResize() {
			setWindowDimensions(getWindowDimensions());
		}

=======
const useWindowDimensions = (): {
	width: number;
	height: number;
} => {
	const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

	useEffect(() => {
		function handleResize(): void {
			setWindowDimensions(getWindowDimensions());
		}

>>>>>>> Stashed changes
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return windowDimensions;
};

export default NetspeakGraph;
