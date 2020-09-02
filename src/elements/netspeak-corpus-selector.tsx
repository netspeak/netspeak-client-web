import React from "react";
import "./netspeak-corpus-selector.css";
import { LocalizableProps, Locales, SimpleLocale, createLocalizer } from "../lib/localize";
import { Corpus } from "../lib/netspeak";

interface Props extends LocalizableProps {
	selected: string;
	corpora: readonly Corpus[];
	onCorpusSelected: (corpusKey: string) => void;
}

export default function NetspeakCorpusSelector(props: Props): JSX.Element {
	const l = createLocalizer(props, locales);
	const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
		const corpusKey = e.currentTarget.value;
		props.onCorpusSelected(corpusKey);
	};

	const containsSelectedCorpus = props.corpora.some(c => c.key === props.selected);
	const buttons = sortedCorpora(props.corpora).map((corpus, i) => {
		const selected = corpus.key === props.selected || (!containsSelectedCorpus && i === 0);
		const className = selected ? "selected" : "";
		const label = l(("label-" + corpus.name.toLowerCase()) as any) || corpus.name;
		return (
			<button key={corpus.key} className={className} value={corpus.key} onClick={handleButtonClick}>
				{label}
			</button>
		);
	});

	return (
		<div className="NetspeakCorpusSelector">
			<div className="wrapper">{buttons}</div>
		</div>
	);
}

const locales: Locales<SimpleLocale<"label-english" | "label-german">> = {
	en: {
		"label-english": "English",
		"label-german": "German",
	},
	de: {
		"label-english": "Englisch",
		"label-german": "Deutsch",
	},
};

function sortedCorpora(corpora: Iterable<Corpus>): Corpus[] {
	const defaultSorting = ["web-en", "web-de"];

	return [...corpora].sort((a, b) => {
		let indexA = defaultSorting.indexOf(a.key);
		let indexB = defaultSorting.indexOf(b.key);
		if (indexA === -1) indexA = defaultSorting.length;
		if (indexB === -1) indexB = defaultSorting.length;
		return indexA - indexB;
	});
}
