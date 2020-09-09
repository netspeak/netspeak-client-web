import React from "react";
import HelpPage from "../page-elements/help-page";
import { Helmet } from "react-helmet";
import dynamic from "../lib/dynamic";
import SharedHead from "../page-elements/shared-head";

export default function Help(): JSX.Element {
	return (
		<>
			{dynamic(() => (
				<HelpPage />
			))}
			<Helmet>
				<title>Help - Netspeak</title>
				<SharedHead />
			</Helmet>
		</>
	);
}
