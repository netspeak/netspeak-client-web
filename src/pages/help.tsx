import React from "react";
import HelpPage from "../page-elements/help-page";
import { Helmet } from "react-helmet";
import GA from "../page-elements/ga";

export default function Help(): JSX.Element {
	return (
		<>
			<HelpPage />
			<Helmet>
				<title>Help - Netspeak</title>
				<GA />
			</Helmet>
		</>
	);
}
