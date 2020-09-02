import React from "react";
import "./page.css";
import NetspeakHeader from "./netspeak-header";
import NetspeakFooter from "./netspeak-footer";
import { LocalizableProps } from "../lib/localize";

export default function Page(props: { children: React.ReactNode } & LocalizableProps): JSX.Element {
	return (
		<div id="Page">
			<NetspeakHeader lang={props.lang} />
			<div id="content">{props.children}</div>
			<div className="footer-wrapper">
				<NetspeakFooter lang={props.lang} />
			</div>
		</div>
	);
}
