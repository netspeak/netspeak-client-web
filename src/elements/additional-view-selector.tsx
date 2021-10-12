import React from "react";
import "./additional-view-selector.scss";
import FlaskImage from "../img/flask.svg";
import { LocalizableProps, Locales, SimpleLocale, createLocalizer } from "../lib/localize";

interface Props extends LocalizableProps {
	active: boolean;
	onClicked: () => void;
}

export default function AdditionalViewSelector(props: Props): JSX.Element {
	const l = createLocalizer(props, locales);

	const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
		props.onClicked();
	};

	return (
		<div className="AdditionalViewSelector">
			<div className="wrapper">
				<button onClick={handleButtonClick} value={props.active ? "active" : "inactive"}>
					<img className="view-button-image" src={FlaskImage} alt={" "} />
					{props.active ? l("hideEXP") : l("showEXP")}
				</button>
			</div>
		</div>
	);
}

const locales: Locales<SimpleLocale<"hideEXP" | "showEXP">> = {
	en: {
		hideEXP: "Hide Beta Results",
		showEXP: "Show Beta Results",
	},
	de: {
		hideEXP: "Beta Ergebnisse ausblenden",
		showEXP: "Beta Ergebnisse anzeigen",
	},
};
