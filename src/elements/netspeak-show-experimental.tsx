import React from "react";
import "./netspeak-show-experimental.scss";
import { LocalizableProps, Locales, SimpleLocale, createLocalizer } from "../lib/localize";

interface Props extends LocalizableProps {
	active: boolean;
	onClicked: () => void;
}

export default function NetspeakShowExperimental(props: Props): JSX.Element {
	const l = createLocalizer(props, locales);

	const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
		props.onClicked();
	};

	return (
		<div className="NetspeakShowExperimental">
			<div className="wrapper">
				<button onClick={handleButtonClick} value={props.active ? "active" : "inactive"}>
					{props.active ? l("hideEXP") : l("showEXP")}
				</button>
			</div>
		</div>
	);
}

const locales: Locales<SimpleLocale<"hideEXP" | "showEXP">> = {
	en: {
		hideEXP: "HIDE EXPERIMENTAL",
		showEXP: "SHOW EXPERIMENTAL",
	},
	de: {
		hideEXP: "VERSTECK EXPERIMENTAL",
		showEXP: "ZEIG EXPERIMENTAL",
	},
};
