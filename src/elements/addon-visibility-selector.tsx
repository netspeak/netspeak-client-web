import React from "react";
import "./addon-visibility-selector.scss";
import FlaskImage from "../img/flask.svg";
import { createLocalizer, Locales, LocalizableProps, SimpleLocale } from "../lib/localize";

interface Props extends LocalizableProps {
	active: boolean;
	onClicked: () => void;
}

export default function AddonVisibilitySelector(props: Props): JSX.Element {
	const l = createLocalizer(props, locales);

	return (
		<div className="AdditionalViewSelector">
			<div className="wrapper">
				<button onClick={props.onClicked} className={props.active ? "addon-shown" : "addon-hidden"}>
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
