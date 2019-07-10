import { html, NetspeakElement } from "../netspeak-app/netspeak-element.js";
import { styles } from './page-styles.js';

export class NetspeakError extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-error'; }
	static get properties() { return {}; }
	static get template() {
		return html`${styles}

<div class="article">
	<h1 id="error">Error:</h1>
	<p id="message">There seems to be a problem with the site.</p>
</div>
		`;
	}
}
window.customElements.define(NetspeakError.is, NetspeakError);
