import React, { useEffect, useState } from "react";
import { GraphElement, GraphPhrase, NetspeakGraphColumn } from "./netspeak-graph";
import { linkHorizontal } from "d3";
import * as d3 from "d3";
import "./netspeak-graph-body.scss";
import { NetspeakGraphWord } from "./netspeak-graph-word";

export type NetspeakGraphBodyProps = {
	columns: NetspeakGraphColumn[];
	alwaysShowPaths: boolean;
	maxRows: number;
	toggleWordSelection: (arg0: GraphElement, arg1: string) => void;
	orderWordsFromTop: boolean;
	query: string;
	selectedWords: { element: GraphElement; id: string }[];
	highlightedPhrases: string[];
	setHighlightedPhrases: (arg0: string[]) => void;
};

type GraphLink = {
	sourceId: string;
	targetId: string;
	sourceColumnIndex: number;
	targetColumnIndex: number;
	phrases: GraphPhrase[];
	offsetFactor: number;
};

export const stringToValidClassName = (str: string): string => {
	return str.replace(/([^a-z0-9]+)/gi, "-");
};

export const NetspeakGraphBody = (props: NetspeakGraphBodyProps): JSX.Element => {
	const height = 100,
		width = 500;

	const MAX_ROWS = props.maxRows;
	const ORDER_TOP_TO_BOTTOM = props.orderWordsFromTop;
	const ALWAY_SHOW_PATHS = props.alwaysShowPaths;

	const [maxFontSize, setMaxFontSize] = useState(width / 20);

	// MARK: Selection of words -in graph- follows.
	//const [query, setQuery] = useState("");

	const isPhraseSelected = (phrase: GraphPhrase): boolean => {
		//if a word is selected, only show phrases that all words share
		if (props.selectedWords.length === 0) {
			return true;
		} else {
			return !props.selectedWords
				.flatMap(selectedWord => {
					return selectedWord.element.phrases.flatMap(phrase => phrase.text).includes(phrase.text);
				})
				.includes(false);
		}
	};

	const isWordSelected = (word: GraphElement): boolean => {
		const selectedWords = props.selectedWords;
		//if no words are selected, display all
		if (selectedWords.length === 0) {
			return true;
		}
		let selectedWordsPhrases: string[] = [];
		for (let i = 0; i < selectedWords.length; i++) {
			// initiate selection
			if (i === 0) {
				selectedWordsPhrases = selectedWords[i].element.phrases.map(value => value.text);
			}
			//intersect phrases
			else {
				selectedWordsPhrases = selectedWordsPhrases.filter(value =>
					selectedWords[i].element.phrases.flatMap(phrase => phrase.text).includes(value)
				);
			}
		}
		return (
			selectedWordsPhrases.filter(value => word.phrases.flatMap(phrase => phrase.text).includes(value)).length > 0
		);
	};

	const maxFrequencyInColumn = (column: NetspeakGraphColumn): number => {
		return Math.max(
			...column.elements.flatMap(element => {
				return isWordSelected(element) ? element.frequency : 0;
			})
		);
	};

	const getWordSize = (frequency: number, column: NetspeakGraphColumn): number => {
		return Math.max((frequency / maxFrequencyInColumn(column)) ** (1 / 2), 0.35) * maxFontSize;
	};

	const sumFrequenciesOfLink = (link: GraphLink): number => {
		return link.phrases
			.flatMap(a => {
				return a.frequency;
			})
			.reduce((a, b) => a + b, 0);
	};

	/// draws horizontal links through the given positions in order

	const findPositions = (yBase: number): number => {
		let maxY = 0;
		props.columns.forEach((column, cIndex) => {
			// let yBase = ORDER_TOP_TO_BOTTOM ? maxFontSize * 2 : height * 0.5
			let yOffsetTop = 0;
			let yOffsetBottom = 0;

			const minIndex = Math.min(
				...column.elements.flatMap((element, eIndex) => {
					return isWordSelected(element) ? eIndex : 99;
				})
			);
			column.elements.forEach((element, eIndex) => {
				if (isWordSelected(element)) {
					const fontSize = getWordSize(element.frequency, column);
					let y = yBase;
					if (eIndex === minIndex) {
						yOffsetTop += fontSize * 1;
						yOffsetBottom += fontSize * 0.2;
					} else if ((eIndex - minIndex) % 2 === 0 && !ORDER_TOP_TO_BOTTOM) {
						y = y - yOffsetTop;
						yOffsetTop += fontSize * 1.2;
					} else {
						yOffsetBottom += fontSize * 1.2;
						y = y + yOffsetBottom;
					}
					maxY = Math.max(Math.abs(y), maxY);
					props.columns[cIndex].elements[eIndex].yPosition = y;
				}
			});
		});

		return maxY;
	};

	// var links: string[] = []
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const links: GraphLink[] = [];

	//initiate positions of elements
	let maxY: number;
	if (props.orderWordsFromTop) {
		maxY = findPositions(35 + maxFontSize / 2);
	} else {
		maxY = findPositions(35 + findPositions(0) + maxFontSize / 2);
	}

	//after render: use positions to draw the links and rend backgrounds, and update size of SVG
	useEffect(() => {
		const drawLinkThroughPositions: (
			positions: [number, number][],
			classes: string[],
			pathImportance: number,
			selected: boolean
		) => void = (positions: [number, number][], classes: string[], pathImportance: number, selected: boolean) => {
			for (let i = 1; i < positions.length; i++) {
				const link = linkHorizontal()({
					source: positions[i - 1],
					target: positions[i],
				});
				if (link != null) {
					const highlighted = classes.filter(val => props.highlightedPhrases.includes(val)).length > 0;

					// let path =  <path d={link} stroke="black" fill="none" ></path>
					d3.select("#graphSVG")
						.append("path")
						.attr("d", link)
						.attr("key", "link" + link)
						.style("stroke-width", pathImportance ** (1 / 4))
						.classed(classes.join(" "), true)
						.classed("visible", ALWAY_SHOW_PATHS ? true : selected || highlighted)
						.classed("graphHighlightable", true)
						.classed("highlightedPath", highlighted)
						.classed("selectedPath", selected)
						.lower();
				}
			}
		};

		const PADDING = 3;
		//clear old draws
		d3.selectAll("path").remove();
		d3.selectAll("#graphRectangle").remove();

		//get column x-bounds
		const columnXBounds: { xLeft: number; xRight: number }[] = [];
		props.columns.forEach((c, cIndex) => {
			const rect = (d3.select("#column" + cIndex).node() as SVGSVGElement).getBBox();
			columnXBounds.push({
				xLeft: rect.x,
				xRight: rect.x + rect.width,
			});
		});

		//find column sizes relative to canvas, split and relocate accordingly.
		const totalColumnsWidth = columnXBounds.flatMap(a => a.xRight - a.xLeft).reduce((a, b) => a + b, 0);
		// let canvasWidth = (d3.select("#graphSVG").node() as SVGSVGElement).getBBox().width
		const canvasWidth = width;
		const maxEmptyWidth = canvasWidth - totalColumnsWidth;
		//if no room, make font smaller and render again (by more than 1 column)
		if (maxEmptyWidth <= 20 && columnXBounds.length > 1) {
			setMaxFontSize(maxFontSize * 0.9);
		}
		const remainingWidth = maxEmptyWidth;
		const widthAllocationPriotiy: number[] = [];
		//determine allocation priority between columns
		props.columns.forEach((c, cIndex) => {
			if (props.columns[cIndex + 1] !== undefined) {
				let priority: number;
				const elementCount = props.columns[cIndex].elements.length + props.columns[cIndex + 1].elements.length;
				if (elementCount <= 2) {
					priority = 1;
				} else {
					priority = 3;
				}
				widthAllocationPriotiy.push(priority);
			}
		});

		const totalPriority = widthAllocationPriotiy.reduce((a, b) => a + b, 0) + 1;
		//find x transformation for each column depending on width and priority of previous
		const columnsXTranslation: number[] = [];
		props.columns.forEach((c, cIndex) => {
			if (cIndex === 0) {
				columnsXTranslation.push((0.5 / totalPriority) * remainingWidth);
			} else {
				columnsXTranslation.push(
					columnsXTranslation[columnsXTranslation.length - 1] +
						columnXBounds[cIndex - 1].xRight -
						columnXBounds[cIndex - 1].xLeft +
						(widthAllocationPriotiy[cIndex - 1] / totalPriority) * remainingWidth
				);
			}
			d3.select("#column" + cIndex).attr("transform", "translate(" + columnsXTranslation[cIndex] + ",0)");
		});

		const maxLinkFrequencyInColumns = new Array(props.columns.length)
			.fill(0)
			.map((maxLinkFrequencyInColumn, cIndex) => {
				links
					.filter(link => link.sourceColumnIndex === cIndex)
					.forEach(link => {
						maxLinkFrequencyInColumn = Math.max(maxLinkFrequencyInColumn, sumFrequenciesOfLink(link));
					});
				return maxLinkFrequencyInColumn;
			});
		const svgHeight = 20 + maxY;

		d3.select("#graphSVG").attr("viewBox", [0, 0, width, svgHeight].join(" "));

		//draw links
		links.forEach(linkData => {
			const source =
				(d3.select("#" + linkData.sourceId + "text").node() as SVGSVGElement) ??
				(d3.select("#" + linkData.sourceId + "rect").node() as SVGSVGElement);
			const target =
				(d3.select("#" + linkData.targetId + "text").node() as SVGSVGElement) ??
				(d3.select("#" + linkData.targetId + "rect").node() as SVGSVGElement);

			if (source == null || target == null) {
			} else {
				let sourceRect = source.getBBox();
				let targetRect = target.getBBox();

				//setup rects around text elements
				d3.select("#" + linkData.sourceId + "rect").attr("width", Math.max(1, sourceRect.width));

				d3.select("#" + linkData.targetId + "rect").attr("width", Math.max(1, targetRect.width));

				sourceRect = (d3.select("#" + linkData.sourceId + "rect").node() as SVGSVGElement).getBBox();
				targetRect = (d3.select("#" + linkData.targetId + "rect").node() as SVGSVGElement).getBBox();

				const sourceY = sourceRect.y + sourceRect.height / 2;
				const targetY = targetRect.y + targetRect.height / 2;

				const sourceWordX =
					sourceRect.x + sourceRect.width + PADDING + columnsXTranslation[linkData.sourceColumnIndex];
				const sourceColumnX =
					columnXBounds[linkData.sourceColumnIndex].xRight + columnsXTranslation[linkData.sourceColumnIndex];

				const targetColumnX =
					columnXBounds[linkData.targetColumnIndex].xLeft -
					PADDING +
					columnsXTranslation[linkData.targetColumnIndex];
				const targetWordX = targetRect.x + columnsXTranslation[linkData.targetColumnIndex];

				const xTravelRange = (targetColumnX - sourceColumnX) / 2;
				const maxRows = MAX_ROWS;

				const xOffsetStart = ORDER_TOP_TO_BOTTOM
					? (xTravelRange * linkData.offsetFactor) / maxRows
					: (xTravelRange * (linkData.offsetFactor + 1 - ((linkData.offsetFactor + 1) % 2))) / maxRows;
				const xOffsetEnd = ORDER_TOP_TO_BOTTOM
					? xTravelRange * (1 - (linkData.offsetFactor + 1 - ((linkData.offsetFactor + 1) % 2)) / maxRows)
					: xTravelRange * (1 - linkData.offsetFactor / maxRows);

				const selected = linkData.phrases.filter(val => val.selected).length > 0;
				let positions: [number, number][];

				if (targetY !== sourceY) {
					positions = [
						[sourceWordX, sourceY],
						[sourceColumnX, sourceY],

						[sourceColumnX + xOffsetStart, sourceY],

						[targetColumnX - xOffsetEnd, targetY],

						[targetColumnX, targetY],
						[targetWordX - PADDING, targetY],
					];
				} else {
					positions = [
						[sourceWordX, sourceY],
						[targetWordX - PADDING, targetY],
					];
				}
				drawLinkThroughPositions(
					positions,
					linkData.phrases.flatMap(a => {
						return "phraseClass" + stringToValidClassName(a.text);
					}),
					sumFrequenciesOfLink(linkData) / maxLinkFrequencyInColumns[linkData.sourceColumnIndex],
					selected
				);
				//draw link through empty expression
				if (d3.select("#" + linkData.sourceId + "text").text() === " ") {
					drawLinkThroughPositions(
						[
							[sourceRect.x + columnsXTranslation[linkData.sourceColumnIndex] - PADDING, sourceY],
							[sourceWordX, sourceY],
						],
						linkData.phrases.flatMap(a => {
							return "phraseClass" + stringToValidClassName(a.text);
						}),
						sumFrequenciesOfLink(linkData) / maxLinkFrequencyInColumns[linkData.sourceColumnIndex],
						selected
					);
				}
			}
		});
	}, [
		props.columns,
		width,
		maxY,
		links,
		maxFontSize,
		MAX_ROWS,
		ORDER_TOP_TO_BOTTOM,
		props.highlightedPhrases,
		ALWAY_SHOW_PATHS,
	]);

	const onMouseEnterText = (classes: string[]): void => {
		props.setHighlightedPhrases(classes);
	};
	const onMouseLeaveText = (): void => {
		props.setHighlightedPhrases([]);
	};

	const createLinkPaths = (element: GraphElement, cIndex: number, eIndex: number): void => {
		element.previous
			?.filter((item, index) => {
				return element.previous?.indexOf(item) === index;
			})
			.forEach(previousText => {
				const sourceIndexes: { cIndex: number; eIndex: number }[] = [];
				const previousElements = props.columns[cIndex - 1].elements.filter((previousElement, pEIndex) => {
					if (previousText === previousElement.text) {
						sourceIndexes.push({
							cIndex: cIndex - 1,
							eIndex: pEIndex,
						});
						return true;
					}
					return false;
				});
				//seed links
				previousElements.forEach(linkedPrevElement => {
					const sourceIndex = sourceIndexes.shift();
					//set offset from other links based index of source element. if only 1 source element, offset by target element.

					let offsetFactor: number;
					if (props.columns[cIndex - 1].elements.length > 1) {
						offsetFactor = props.columns[cIndex - 1].elements.indexOf(linkedPrevElement);
					} else {
						offsetFactor = MAX_ROWS - props.columns[cIndex].elements.indexOf(element);
					}
					const linkedPhrases = linkedPrevElement.phrases.filter(phraseIn => {
						return element.phrases
							.flatMap(a => {
								return a.text;
							})
							.includes(phraseIn.text);
					});
					if (sourceIndex !== undefined) {
						links.push({
							targetId: "c" + cIndex + "e" + eIndex,
							sourceId: "c" + sourceIndex.cIndex + "e" + sourceIndex.eIndex,
							targetColumnIndex: cIndex,
							sourceColumnIndex: sourceIndex.cIndex,
							phrases: linkedPhrases,
							offsetFactor: offsetFactor,
						});
					}
				});
			});
	};
	return (
		<svg viewBox={"0 0 " + width + " " + height} id="graphSVG" key="graphSVG" preserveAspectRatio="xMidYMin meet">
			{
				// Draw
				props.columns.map((column, cIndex) => {
					//Draw columns
					return (
						<g id={"column" + cIndex} className="column" key={"column" + cIndex}>
							{column.elements.map((element, eIndex) => {
								if (isWordSelected(element)) {
									//Parse word data
									const selectedPath = element.phrases.filter(val => val.selected).length > 0;
									const indexes = "c" + cIndex + "e" + eIndex;
									const fontSize = getWordSize(element.frequency, column);
									const classes = element.phrases.filter(isPhraseSelected).flatMap(a => {
										return "phraseClass" + stringToValidClassName(a.text);
									});
									const highlighted =
										classes.filter(val => props.highlightedPhrases.includes(val)).length > 0;
									const selectedWord =
										props.selectedWords.filter(word => word.id === indexes).length > 0;

									createLinkPaths(element, cIndex, eIndex);

									return (
										<NetspeakGraphWord
											classes={classes}
											fontSize={fontSize}
											element={element}
											highlighted={highlighted}
											indexes={indexes}
											onMouseEnterText={onMouseEnterText}
											onMouseLeaveText={onMouseLeaveText}
											selectedPath={selectedPath}
											selectedWord={selectedWord}
											toggleWordSelection={props.toggleWordSelection}
											key={classes + "graphWord"}
										/>
									);
								}
								return null;
							})}
						</g>
					);
				})
			}
		</svg>
	);
};
