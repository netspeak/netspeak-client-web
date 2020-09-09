import React from "react";
import "./page.scss";
import NetspeakHeader from "./netspeak-header";
import NetspeakFooter from "./netspeak-footer";
import { LocalizableProps } from "../lib/localize";

export default function Page(props: { children: React.ReactNode; className: string } & LocalizableProps): JSX.Element {
	return (
		<div id="Page" className={props.className}>
			<NetspeakHeader lang={props.lang} />
			<div id="content">{props.children}</div>
			<div className="footer-wrapper">
				<NetspeakFooter lang={props.lang} />
			</div>
		</div>
	);
}
