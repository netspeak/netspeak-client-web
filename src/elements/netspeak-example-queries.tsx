import React from "react";
import { LocalizableProps, Locales, SimpleLocale, createLocalizer } from "../lib/localize";
import "./netspeak-example-queries.scss";
import NetspeakQueryText from "./netspeak-query-text";

interface Props extends LocalizableProps {
	corpus: string;
	onQueryClicked?: (query: string, corpus: string) => void;
}

export default function NetspeakExampleQueries(props: Props): JSX.Element {
	const l = createLocalizer(props, locales);

	const corpus = props.corpus in exampleQueries ? props.corpus : defaultCorpus;
	const examples = exampleQueries[corpus];

	const handleClick = (e: React.MouseEvent<HTMLElement>): void => {
		const query = e.currentTarget.dataset.query!;
		props.onQueryClicked?.(query, corpus);
	};

	return (
		<div className="NetspeakExampleQueries">
			<div className="info">
				<table>
					<tbody>
						{(Object.keys(examples) as QueryKey[]).map(key => {
							const query = examples[key]!;
							const explanation = l(key);

							return (
								<tr key={query}>
									<td className="example">
										<span onClick={handleClick} data-query={query}>
											<NetspeakQueryText query={query} />
										</span>
									</td>
									<td className="spacer"></td>
									<td className="explanation">
										<NetspeakQueryText query={explanation} />
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

type QueryKey = "q-mark" | "dots" | "option-set" | "hash" | "order" | "gap";
const locales: Locales<SimpleLocale<QueryKey>> = {
	en: {
		"q-mark": "The ? finds one word.",
		"dots": "The ... finds many words.",
		"option-set": "The [ ] compare options.",
		"hash": "The # finds similar words.",
		"order": "The { } check the order.",
		"gap": "The space is important.",
	},
	de: {
		"q-mark": "Das ? findet ein Wort.",
		"dots": "Die ... finden mehrere Wörter.",
		"option-set": "Die [ ] vergleichen Alternativen.",
		"hash": "Das # findet ähnliche Wörter.",
		"order": "Die { } prüfen die Reihenfolge.",
		"gap": "Das Leerzeichen ist wichtig.",
	},
};

/**
 * A list of corpus specific example queries.
 */
const exampleQueries: Record<string, Partial<Record<QueryKey, string>>> = {
	"web-en": {
		"q-mark": "how to ? this",
		"dots": "see ... works",
		"option-set": "it's [ great well ]",
		"hash": "and knows #much",
		"order": "{ more show me }",
		"gap": "m...d ? g?p",
	},
	"web-de": {
		"q-mark": "was ? das",
		"dots": "was ... hier ab",
		"option-set": "wie [ nützlich praktisch ]",
		// "hash": "and knows #much", // this feature isn't yet implemented on the server-side
		"order": "{ rum richtig }",
		"gap": "M?t ? Lü...e",
	},
};
/**
 * The default corpus for which examples will be displayed in case the current corpus is unknown.
 */
const defaultCorpus = "web-en";
