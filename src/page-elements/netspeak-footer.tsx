import React from "react";
import { Link } from "gatsby";
import "./netspeak-footer.scss";
import {
	createLocalizer,
	Locales,
	LocalizableProps,
	setCurrentLang,
	SimpleLocale,
	SupportedLanguage,
} from "../lib/localize";

export default function NetspeakFooter(props: LocalizableProps): JSX.Element {
	const l = createLocalizer(props, locales);

	return (
		<div className="NetspeakFooter">
			<div>
				<div id="webis-copyright">
					{`\xA9 ${new Date().getFullYear()} `}
					<a href="https://webis.de" target="_blank" rel="noopener noreferrer">
						Webis Group
					</a>
					<Bullet />
					<a href="https://webis.de/people.html" target="_blank" rel="noopener noreferrer" id="contact">
						{l("contact")}
					</a>
					<Bullet />
					<a
						href="https://github.com/netspeak"
						target="_blank"
						rel="noopener noreferrer"
						className="img"
						id="github"
						title="GitHub">
						<span></span>
					</a>
					<a
						href="https://twitter.com/_netspeak_"
						target="_blank"
						rel="noopener noreferrer"
						className="img"
						id="twitter"
						title="Twitter">
						<span></span>
					</a>
					<a
						href="https://www.youtube.com/playlist?list=PLgD1TOdHQCI97rA9s4z1EGxRJSXCHzwBk"
						target="_blank"
						rel="noopener noreferrer"
						className="img"
						id="youtube"
						title="YouTube">
						<span></span>
					</a>
					<Bullet />
					<a
						href="https://webis.de/impressum.html"
						target="_blank"
						rel="noopener noreferrer"
						id="impressum-and-privacy">
						{l("impressumAndPrivacy")}
					</a>
				</div>
				<div id="netspeak-points">
					<Link to="/help/">{l("help")}</Link>
				</div>
				<div id="language-section">
					<span className="pipe">|</span>
					<LangSelect lang={props.lang} thisLang="de">
						Deutsch
					</LangSelect>
					<Bullet />
					<LangSelect lang={props.lang} thisLang="en">
						English
					</LangSelect>
				</div>
			</div>

			<div style={{ clear: "both" }}></div>
		</div>
	);
}

const locales: Locales<SimpleLocale<"help" | "contact" | "impressumAndPrivacy">> = {
	en: {
		help: "Help",
		contact: "Contact",
		impressumAndPrivacy: "Impressum\u00A0/\u00A0Terms\u00A0/\u00A0Privacy",
	},
	de: {
		help: "Hilfe",
		contact: "Kontakt",
		impressumAndPrivacy: "Impressum\u00A0/\u00A0AGB\u00A0/\u00A0Datenschutz",
	},
};

function LangSelect(props: { lang: string; thisLang: SupportedLanguage; children: React.ReactNode }): JSX.Element {
	const { lang, thisLang } = props;

	const className = lang === thisLang ? "current-lang" : "";
	const clickHandler = (): void => {
		setCurrentLang(thisLang);
		window.location.reload();
	};
	return (
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
		<a className={className} href="#" onClick={clickHandler}>
			{props.children}
		</a>
	);
}

function Bullet(): JSX.Element {
	return <span className="bullet">{"\u2022"}</span>;
}
