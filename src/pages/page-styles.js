import { html } from "../../node_modules/@polymer/polymer/polymer-element.js";

export const styles = html`
<style>
	div.article {
		padding: 3em 1em;
	}

	/*
	 * HEADER
	 */

	.article h1 {
		font-weight: normal;
		font-size: 200%;
		color: #555;
		margin: 1em 0 2em 0;
	}

	.article h2 {
		font-weight: normal;
		font-size: 150%;
		color: #c5000b;
		margin: 2em 0 1em 0;
	}

	.article h3 {
		font-weight: normal;
		font-size: 125%;
		color: #c5000b;
		margin: 2em 0 1em 0;
	}

	/*
	 * PARAGRAPHS
	 */

	.article p {
		margin: 1em 0;
		line-height: 1.4;
		text-align: justify;
	}

	/*
	 * LINK
	 */

	.article a {
		color: #666;
		cursor: pointer;
		text-decoration: none;
	}

	.article a:hover {
		text-decoration: underline;
	}

	/*
	 * LIST
	 */

	.article ul,
	.article ol {
		margin: 1em 0;
	}

	.article ul>li,
	.article ol>li {
		padding: .25em 0;
	}

	/*
	 * TABLE
	 */

	.article table {
		border: 1px solid #aaa;
		border-collapse: collapse;
		width: 100%;
	}

	.article td,
	.article th {
		text-align: left;
		padding: 5px 10px;
		border: 1px solid #aaa;
		border-collapse: collapse;
		color: #333;
	}

	/*
	 * GROUP BOX
	 */

	.group-box {
		background-color: white;
		border: 1px solid #BBB;
		display: block;
		padding: 1.25em 1em 1em 1em;
		margin: 2.75em 0 4em 0;
	}

	.group-box>.group-title {
		line-height: 1em;
		display: inline-block;
		position: absolute;
		margin-top: -1.75em;
		background-color: white;
		padding: 0 .5em;
		font-size: 110%;
		color: #c5000b;
	}

	.group-box>.group-content {
		display: block;
		background-color: white;
	}


	/*
	 * CODE
	 */

	.code,
	code {
		font-family: monospace;
		color: #000;
		text-align: left;
		word-spacing: normal;
		word-break: normal;
		word-wrap: normal;
		line-height: 1.5;
		font-size: 90%;

		-moz-tab-size: 4;
		-o-tab-size: 4;
		tab-size: 4;

		-webkit-hyphens: none;
		-moz-hyphens: none;
		-ms-hyphens: none;
		hyphens: none;
	}

	:not(pre)>code {
		background: #EEE;
		border: 1px solid #BBB;
		border-radius: .25em;
		padding: 0 .25em;
		white-space: nowrap;
	}

	pre {
		margin: 1em 0;
		border: 1px solid #BBB;
		padding: 1em;
		overflow: auto;
		white-space: pre;
	}


	.token.comment,
	.token.prolog,
	.token.doctype,
	.token.cdata {
		color: #082;
	}

	.token.punctuation {
		color: #666;
	}

	.token.property,
	.token.tag,
	.token.boolean,
	.token.constant,
	.token.symbol,
	.token.deleted {
		color: #905;
	}

	.token.number {
		color: #09885a;
	}

	.token.selector,
	.token.attr-name,
	.token.string,
	.token.char,
	.token.builtin,
	.token.inserted {
		color: #851212;
	}

	.token.operator,
	.token.entity,
	.token.url,
	.language-css .token.string,
	.style .token.string {
		color: #a67f59;
		background: hsla(0, 0%, 100%, .5);
	}

	.token.atrule,
	.token.attr-value,
	.token.keyword {
		color: #00D;
		font-weight: bold;
	}

	.token.function {
		color: #53401a;
	}

	.token.class-name {
		color: #1d5f74;
	}

	.token.regex,
	.token.important,
	.token.variable {
		color: #e90;
	}

	.token.q-mark,
	.token.asterisk,
	.token.plus {
		color: #c5000b;
	}

	.token.order-set,
	.token.option-set,
	.token.dict-set {
		color: #2d7db3;
	}

	.token.important,
	.token.bold {
		font-weight: bold;
	}

	.token.italic {
		font-style: italic;
	}

	.token.entity {
		cursor: help;
	}
</style>
`;
