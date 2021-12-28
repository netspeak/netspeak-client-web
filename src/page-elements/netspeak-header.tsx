import React from "react";
import "./netspeak-header.scss";
import { createLocalizer, Locales, LocalizableProps, SimpleLocale } from "../lib/localize";
import { Link } from "gatsby";

export default function NetspeakHeader(props: LocalizableProps): JSX.Element {
	const l = createLocalizer(props, locales);

	return (
		<div className="NetspeakHeader">
			<div className="content">
				<Link to="/">
					<span className="logo"></span>
				</Link>
				<span className="slogan">{l("slogan")}</span>
				<div style={{ clear: "both" }}></div>
			</div>
		</div>
	);
}

const locales: Locales<SimpleLocale<"slogan">> = {
	en: {
		slogan: "One word leads to another.",
	},
	de: {
		slogan: "Ein Wort ergibt das andere.",
	},
};
