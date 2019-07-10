import { html, NetspeakElement } from "../netspeak-app/netspeak-element.js";
import { styles } from './page-styles.js';
import '../netspeak-app/netspeak-search-bar.js';

export class NetspeakExamples extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-examples'; }
	static get properties() { return {}; }
	static get template() {
		return html`${styles}
		<div class="article">

<h1 id="examples">Examples</h1>

<div class="group-box">
	<span class="group-title" id="example-1">Find one word</span>
	<div class="group-content">
		<p id="example-1-desc">Use a question mark in your query to search for a missing word.</p>
		<netspeak-search-bar query="waiting ? response" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

<div class="group-box">
	<span class="group-title" id="example-8">Find at least one word</span>
	<div class="group-content">
		<p id="example-8-desc">Use a plus in your query to search for missing words.</p>
		<netspeak-search-bar query="waiting + response" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

<div class="group-box">
	<span class="group-title" id="example-2">Find two or more words</span>
	<div class="group-content">
		<p id="example-2-desc">Use a two or more question marks to find as many words for them.</p>
		<netspeak-search-bar query="waiting ? ? response" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

<div class="group-box">
	<span class="group-title" id="example-3">Find any number of words</span>
	<div class="group-content">
		<p id="example-3-desc">Use dots, to find zero, one, two, or more words at the same time.</p>
		<netspeak-search-bar query="waiting * response" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

<div class="group-box">
	<span class="group-title" id="example-4">Find the best option</span>
	<div class="group-content">
		<p id="example-4-desc">Use square brackets to check which of two or more words is most common, or if none applies.</p>
		<netspeak-search-bar query="the same [ like as ]" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

<div class="group-box">
	<span class="group-title" id="example-5">Find the best order</span>
	<div class="group-content">
		<p id="example-5-desc">Use curly brackets to check in which order two or more words are commonly written.</p>
		<netspeak-search-bar query="{ only for members }" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

<div class="group-box">
	<span class="group-title" id="example-6">Find the best synonym</span>
	<div class="group-content">
		<p id="example-6-desc">Use the hash sign in front of a word to check which of its synonyms are commonly written.</p>
		<netspeak-search-bar query="waiting * #response" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

<div class="group-box">
	<span class="group-title" id="example-7">Compare phrases</span>
	<div class="group-content">
		<p id="example-7-desc">Use the pipe sign between phrases to get a comparison</p>
		<netspeak-search-bar query="waiting ? ? response | waiting ? response" initial-limit="10" history-hidden></netspeak-search-bar>
	</div>
</div>

</div>
`;
	}
}
window.customElements.define(NetspeakExamples.is, NetspeakExamples);
