import React from "react";
import Prism from "../lib/prism";
import "./netspeak-query-text.scss";

interface Props {
	query: string;
}

export default function NetspeakQueryText(props: Props): JSX.Element {
	const { query } = props;
	const html = Prism.highlight(query, Prism.languages.netspeak, "netspeak");

	return <span className="NetspeakQueryText" dangerouslySetInnerHTML={{ __html: html }}></span>;
}
