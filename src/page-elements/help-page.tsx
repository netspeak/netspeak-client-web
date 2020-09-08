import React from "react";
import "./help-page.css";
import { getCurrentLang, Locales, SimpleLocale, createLocalizer, SupplierLocale } from "../lib/localize";
import Page from "./page";
import { NetspeakSearch } from "../elements/netspeak-search";

export default function HelpPage(): JSX.Element {
	const lang = getCurrentLang();
	const l = createLocalizer({ lang }, locales);

	return (
		<Page lang={lang}>
			<h1 className="article">{l("help")}</h1>

			<H2 id="contact">{l("contact")}</H2>
			{l("contactP")()}

			<H2 id="how">{l("how")}</H2>
			{l("howP")()}

			<H3 id="examples">{l("examples")}</H3>
			{l("exampleData").map((data, i) => {
				return (
					<div key={i} className="group-box">
						<div className="group-title">{data.title}</div>
						<div className="group-content">
							<P>{data.desc()}</P>
							<NetspeakSearch
								lang={lang}
								corpus="web-en"
								defaultQuery={data.query}
								defaultExampleVisibility="hidden"
								pageSize={10}
							/>
						</div>
					</div>
				);
			})}

			<H3 id="for-developers">{l("devs")}</H3>
			{l("devsP")()}
		</Page>
	);
}

function P(props: { children: React.ReactNode }): JSX.Element {
	return <p className="article">{props.children}</p>;
}
function H2(props: { id: string; children: React.ReactNode }): JSX.Element {
	return (
		<a href={"#" + props.id} className="article">
			<h2 id={props.id} className="article">
				{props.children}
			</h2>
		</a>
	);
}
function H3(props: { id: string; children: React.ReactNode }): JSX.Element {
	return (
		<h3 id={props.id} className="article">
			{props.children}
		</h3>
	);
}

function Email(props: { address: string }): JSX.Element {
	return (
		<a href={"mailto:" + props.address} className="article">
			{props.address}
		</a>
	);
}

interface ExampleData {
	title: string;
	desc: () => JSX.Element;
	query: string;
}

const locales: Locales<
	SimpleLocale<"help" | "contact" | "how" | "examples" | "devs"> &
		SupplierLocale<"contactP" | "howP" | "devsP"> & {
			exampleData: ExampleData[];
		}
> = {
	en: {
		help: "Help",

		contact: "Contact",
		contactP: () => (
			<P>
				Email: <Email address="info@netspeak.org" />
			</P>
		),

		how: "How Netspeak works",
		howP: () => (
			<P>
				Netspeak is a search engine designed to help you to express yourself in a foreign language by providing
				you with insight on how common native speakers use certain phrases. The following examples illustrate
				how you can use Netspeak to query phrases.
			</P>
		),

		examples: "Examples",
		exampleData: [
			{
				title: "Find one word",
				desc: () => <>Use a question mark in your query to search for a missing word.</>,
				query: "waiting ? response",
			},
			{
				title: "Find at least one word",
				desc: () => <>Use a plus in your query to search for missing words.</>,
				query: "waiting + response",
			},
			{
				title: "Find two or more words",
				desc: () => <>Use a two or more question marks to find as many words for them.</>,
				query: "waiting ? ? response",
			},
			{
				title: "Find any number of words",
				desc: () => <>Use dots, to find zero, one, two, or more words at the same time.</>,
				query: "waiting * response",
			},
			{
				title: "Find the best option",
				desc: () => (
					<>Use square brackets to check which of two or more words is most common, or if none applies.</>
				),
				query: "the same [ like as ]",
			},
			{
				title: "Find the best order",
				desc: () => <>Use curly brackets to check in which order two or more words are commonly written.</>,
				query: "{ only for members }",
			},
			{
				title: "Find the best synonym",
				desc: () => (
					<>Use the hash sign in front of a word to check which of its synonyms are commonly written.</>
				),
				query: "waiting * #response",
			},
			{
				title: "Compare phrases",
				desc: () => <>Use the pipe symbol between phrases to get a comparison.</>,
				query: "waiting ? ? response | waiting ? response",
			},
		],

		devs: "For developers",
		devsP: () => (
			<P>
				<a className="article" href="https://github.com/netspeak" target="_blank" rel="noopener noreferrer">
					GitHub
				</a>
			</P>
		),
	},
	de: {
		help: "Hilfe",

		contact: "Kontakt",
		contactP: () => (
			<P>
				Email: <Email address="info@netspeak.org" />
			</P>
		),

		how: "So funktioniert Netspeak",
		howP: () => (
			<P>
				Netspeak ist eine Suchmaschine, die ihnen hilft sich in einer fremden Sprache auszudrücken, indem es dir
				anzeigt wie häufig Muttersprachler bestimmte Wendungen nutzen. Die folgenden Beispiele zeigen, wie sie
				mit Netspeak Wendungen und Wortgruppen abfragen.
			</P>
		),

		examples: "Beispiele",
		exampleData: [
			{
				title: "Ein Wort finden",
				desc: () => (
					<>
						Das Fragezeichen steht für genau ein Wort. Verwenden Sie es irgendwo in ihrer Anfrage, um nach
						dem dort passenden Wort zu suchen.
					</>
				),
				query: "waiting ? response",
			},
			{
				title: "Mindestens ein Wort finden",
				desc: () => (
					<>
						Das Plus steht für mindestens ein Wort. Verwenden Sie es irgendwo in ihrer Anfrage, um nach dem
						dort passenden Wort/Wörtern zu suchen.
					</>
				),
				query: "waiting + response",
			},
			{
				title: "Zwei oder mehr Wörter finden",
				desc: () => (
					<>
						Zwei Fragezeichen hintereinander stehen für genau zwei Wörter. Verwenden Sie mehr Fragezeichen,
						um nach entsprechend vielen Wörtern zu suchen.
					</>
				),
				query: "waiting ? ? response",
			},
			{
				title: "Beliebig viele Wörter finden",
				desc: () => (
					<>
						Die Punkte stehen für beliebig viele Wörter. Verwenden Sie sie, um gleichzeitig nach ein, zwei
						oder mehr passenden Wörtern zu suchen.
					</>
				),
				query: "waiting * response",
			},
			{
				title: "Die bessere Alternative finden",
				desc: () => (
					<>
						Um zu prüfen, welches von zwei oder mehr Wörtern eher geschrieben wird, oder ob keins davon
						zutrifft, verwenden Sie eckige Klammern.
					</>
				),
				query: "the same [ like as ]",
			},
			{
				title: "Die richtige Reihenfolge finden",
				desc: () => (
					<>
						Um zu prüfen, in welcher Reihenfolge zwei oder mehr Wörter geschrieben werden, verwenden sie
						geschweifte Klammern.
					</>
				),
				query: "{ only for members }",
			},
			{
				title: "Das häufigste Synonym finden",
				desc: () => (
					<>
						Um zu prüfen, welches Synonym eines Wortes am häufigsten geschrieben wird, verwenden Sie das
						Doppelkreuz vor dem Wort.
					</>
				),
				query: "waiting * #response",
			},
			{
				title: "Wortgruppen vergleichen",
				desc: () => (
					<>Um die Häufigkeit von Wortgruppen zu vergleichen trennen sie diese durch das Pipe-Symbol.</>
				),
				query: "waiting ? ? response | waiting ? response",
			},
		],

		devs: "Für Entwickler",
		devsP: () => (
			<P>
				<a className="article" href="https://github.com/netspeak" target="_blank" rel="noopener noreferrer">
					GitHub
				</a>
			</P>
		),
	},
};
