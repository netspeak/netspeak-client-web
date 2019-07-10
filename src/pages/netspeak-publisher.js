import { html, NetspeakElement } from "../netspeak-app/netspeak-element.js";
import { styles } from './page-styles.js';

export class NetspeakPublisher extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-publisher'; }
	static get properties() { return {}; }
	static get template() {
		return html`${styles}

<div class="article">
	<h1 id="publisher">Publisher</h1>

	<p id="subject">
		Netspeak is subject to research and development at the Web Technology &amp; Information Systems Group at
		Bauhaus-Universität
		Weimar.
	</p>

	<h3 id="contact">Contact</h3>

	<p>
		Martin Potthast
		<br> Bauhaus-Universität Weimar
		<br> Fakultät Medien
		<br> 99423 Weimar
	</p>

	<p>
		<span id="email">Email:</span>
		<a href="mailto:info@netspeak.org">info@netspeak.org</a>
		<br>
		<span id="phone">Phone:</span> +49 3643 58 3720
		<br>
		<span id="fax">Fax:</span> +49 3643 58 3709
	</p>

</div>
		`;
	}
}
window.customElements.define(NetspeakPublisher.is, NetspeakPublisher);
