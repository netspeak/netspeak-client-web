import React from "react";
import { GraphElement } from "./netspeak-graph";

export type NetspeakGraphElementProps = {
	fontSize: number;
	element: GraphElement;
	selectedPath: boolean;
	selectedWord: boolean;
	indexes: string;
	classes: string[];
	highlighted: boolean;

	toggleWordSelection: (arg0: GraphElement, arg1: string) => void;
	onMouseEnterText: (classes: string[]) => void;
	onMouseLeaveText: () => void;
};

export const NetspeakGraphWord = (props: NetspeakGraphElementProps): JSX.Element => {
	return (
		<g key={props.indexes + "g"} className="textG" fontSize={props.fontSize}>
			<rect
				// x={(width / props.columns.length) * (cIndex + 0.5)}
				y={props.element.yPosition! - props.fontSize}
				id={props.indexes + "rect"}
				fill="none"
				height={props.fontSize}
				key={props.indexes + "rect"}></rect>

			<text
				onMouseEnter={() => props.onMouseEnterText(props.classes)}
				onMouseLeave={() => props.onMouseLeaveText()}
				// onMouseLeave={() => setIsShown(false)}>™
				// x={(width / props.columns.length) * (cIndex + 0.5)}
				onClick={() => props.toggleWordSelection(props.element, props.indexes)}
				y={props.element.yPosition}
				id={props.indexes + "text"}
				key={props.indexes + "text"}
				className={
					"graphHighlightable" +
					(props.selectedWord ? " selectedWord" : "") +
					(props.selectedPath ? " selectedPath" : "") +
					(props.highlighted ? " highlightedPath" : "")
				}>
				{props.element.text}
			</text>
		</g>
	);
};
