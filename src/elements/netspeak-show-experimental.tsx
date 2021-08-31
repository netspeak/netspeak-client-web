import React from "react";
import "./netspeak-show-experimental.scss";
import { LocalizableProps, Locales, SimpleLocale, createLocalizer } from "../lib/localize";

interface Props extends LocalizableProps {
	active: boolean;
	onClicked: () => void;
}

export default function NetspeakShowExperimental(props: Props): JSX.Element {
	const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
		props.onClicked();
	};

	return (
		<div className="NetspeakShowExperimental">
			<div className="wrapper">
				<button onClick={handleButtonClick} value={props.active ? "active" : "inactive"}>
					{"SHOW EXPERIMENTAL"}
				</button>
			</div>
		</div>
	);
}