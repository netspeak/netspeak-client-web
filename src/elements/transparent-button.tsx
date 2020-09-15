import React from "react";
import { optional } from "../lib/util";
import "./transparent-button.scss";

interface Props {
	image?: string;
	text?: string;
	selected?: boolean;
	onClick?: () => void;
}

export default function TransparentButton(props: Readonly<Props>): JSX.Element {
	const selectedClass = props.selected ? " selected" : "";

	return (
		<button className={"TransparentButton" + selectedClass} onClick={props.onClick}>
			{optional(!!props.image, () => (
				<span className="button-img" style={{ backgroundImage: props.image }}></span>
			))}
			{optional(!!props.text, () => (
				<span className="button-text">{props.text}</span>
			))}
		</button>
	);
}
