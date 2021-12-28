import React from "react";
import "./netspeak-corpus-selector.scss";
import { createLocalizer, Locales, LocalizableProps, SimpleLocale } from "../lib/localize";
import { Corpus } from "../lib/netspeak";

interface Props extends LocalizableProps {
	selected?: string;
	corpora: readonly Corpus[];
	unavailable: ReadonlySet<Corpus>;
	onCorpusSelected: (corpus: Corpus) => void;
}

export default function NetspeakCorpusSelector(props: Props): JSX.Element {
	const l = createLocalizer(props, locales);
	const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
		const corpusKey = e.currentTarget.value;
		const corpus = props.corpora.find(c => c.key === corpusKey);
		if (!corpus) {
			throw new Error(`Cannot find corpus with key "${corpusKey}".`);
		}
		props.onCorpusSelected(corpus);
	};

	const sorted = sortedCorpora(props.corpora);

	// the selected corpus will be the one whose key is given or the first one
	let selectedCorpus = sorted.find(c => c.key === props.selected);
	if (!selectedCorpus && sorted.length > 0) {
		const defaultCorpus = sorted[0];
		selectedCorpus = defaultCorpus;
		setTimeout(() => {
			props.onCorpusSelected(defaultCorpus);
		}, 1);
	}

	const buttons = sorted.map(corpus => {
		const classList: string[] = [];
		if (corpus === selectedCorpus) {
			classList.push("selected");
		}
		if (props.unavailable.has(corpus)) {
			classList.push("unavailable");
		}

		return (
			<button key={corpus.key} className={classList.join(" ")} value={corpus.key} onClick={handleButtonClick}>
				{l(("label-" + corpus.name.toLowerCase()) as any) || corpus.name}
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
	const defaultSorting = ["en", "de"];

	return [...corpora].sort((a, b) => {
		let indexA = defaultSorting.indexOf(a.language);
		let indexB = defaultSorting.indexOf(b.language);
		if (indexA === -1) indexA = defaultSorting.length;
		if (indexB === -1) indexB = defaultSorting.length;
		return indexA - indexB;
	});
}
