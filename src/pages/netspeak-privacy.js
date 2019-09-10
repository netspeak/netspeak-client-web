import { html, NetspeakElement, registerElement } from "../netspeak-app/netspeak-element.js";
import { styles } from './page-styles.js';

export class NetspeakPrivacy extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-privacy'; }
	static get properties() { return {}; }
	static get template() {
		return html`${styles}
<div class="article">
	<h1 id="privacy">Privacy Policy</h1>

	<p id="privacy-p1"> This website makes use of the following services: </p>

	<ul>
		<li>Netspeak Search API</li>
		<li>Google Docs</li>
		<li>Google Analytics</li>
		<li>Polyfill</li>
	</ul>

	<p id="privacy-p2">In what follows you will find our privacy policies concerning each of these services.</p>

	<h2 id="netspeak">Netspeak Search API</h2>

	<p id="netspeak-p">Should you enter a search query into the search box displayed on this website or should you click
		on a link that
		poses a search query automatically your browser connects to the Netspeak API in order to answer the search
		query. Netspeak gathers and logs call data, such as the URL accessed, the IP address of the caller, the browser
		used, its language settings as well as the date and time of access and the search query. The gathered data
		is used for purposes of research and development of Netspeak and to analyze its usage. The data is processed
		manually and automatically and it is connected with other access data stored in the same access logs to gain
		insights into how this website is used. The data is not connected with other data about you. Parts of the
		data may be published in anonymized form as part of scientific publications. Otherwise, the data is not transferred
		to a third party and it is anonymized periodically (typically once a year). The anonymized data may be stored
		indefinitely. By entering a search query into the search box or by clicking on a link that poses a search
		query you agree to this privacy policy. To prevent Netspeak from gathering this data, do not enter something
		into the search box and do not click on links that pose search queries. You may demand information about
		or deletion of the data stored about you. In such a case, please include the IP address from which you have
		accessed Netspeak. In case your internet provider assigns dynamic IP addresses we also need the exact time
		frames at which you have accessed Netspeak. Please direct your request at the publisher of this website.</p>


	<h2 id="googlewebsearchapi">Google Web Search API</h2>

	<p id="googlewebsearchapi-p">Should you click on a button displayed on a search result page that loads example
		sentences for a phrase your
		browser calls the web search engine Google by Google Inc. ("Google"). The phrase is used as a query for a
		web search and the obtained search results are analyzed in order to extract sentences which contain the phrase.
		The extracted sentences are then displayed. Google gathers and logs call data, such as the URL accessed,
		the IP address of the caller, the browser used, its language settings as well as the date and time of access
		and the phrase used as a query. Google reserves the right to gather additional data in accordance with Google's
		privacy policies, which may include storing a cookie on your computer. The gathered data is used to analyze
		the usage of Google's search engine. Google reserves the right to use the data for other purposes as well.
		The data is processed automatically. Typically, search queries are connected with other queries posed from
		the same computer so that user profile can be set up. The data is stored on Google's servers and it may be
		transfered to a foreign country. By clicking on a button that loads example sentences for a given phrase
		your agree to this privacy policy. To prevent Google from gathering data do not click on such a button. You
		may demand information about or deletion of the data stored about you. In such a case, please contact Google
		under the following address:</p>

	<p>
		<span>Privacy Matters</span>
		<br> c/o Google Inc.
		<br> 1600 Amphitheatre Parkway
		<br> Mountain View, California, 94043
		<br> USA
		<br>
	</p>

	<p id="moreinformation">More information can be found here:</p>

	<a href="http://www.google.com/intl/en/privacy">http://www.google.com/intl/en/privacy</a>

	<h2 id="googledocs">Google Docs</h2>

	<p id="googledocs-p">Should you click on the submit button on the feedback page of this website your browser sends the
		text entered
		into the text area to Google Docs by Google Inc. ("Google"). On behalf of the publishers of this website
		Google stores the submitted feedback. Google gathers and logs call data, such as the URL accessed, the IP
		address of the caller, the browser used, its language settings as well as the date and time of access, while
		the submitted feedback is made available only to the publishers of this website. Google reserves the right
		to gather additional data in accordance with Google's privacy policies, which may include storing a cookie
		on your computer. The gathered call data is used by Google to analyze the usage of Google Docs. Google reserves
		the right to use the data for other purposes as well. The call data is processed automatically, while the
		submitted feedback is analyzed manually by the publishers of this website. Typically, the call data is not
		connected with other data about you which may have been gathered by Google at another occasion or website,
		but Google reserves the right to do so. The data is stored on Google's servers and it may be transfered to
		a foreign country. Typically, the call data is deleted within a year, but Google reserves the right to extend
		the storage period. The submitted feedback may be stored indefinitely. By submitting feedback you agree to
		this privacy policy. The only way to prevent Google from gathering this data is to not use the feedback form.
		You may demand information about or deletion of the data stored about you. In such a case, please contact
		Google under the following address:</p>

	<p>Privacy Matters
		<br> c/o Google Inc.
		<br> 1600 Amphitheatre Parkway
		<br> Mountain View, California, 94043
		<br> USA
		<br>
	</p>

	<p id="moreinformation">More information can be found here:</p>

	<a href="http://www.google.com/intl/en/privacy">http://www.google.com/intl/en/privacy</a>

	<h2 id="googleanalytics">Google Analytics</h2>
	<p id="googleanalytics-p">This website uses Google Analytics, a web usage analysis service by Google Inc. ("Google").
		Google Analytics
		uses so-called "Cookies" which are text files stored on your computer and which are used to analyze your
		usage of this website. The information about your usage of this website stored within a cookie are typically
		transfered to a computer within Google's US-based data centers. In case IP anonymization is activated on
		this website your IP address is shortened on a server within the European Union beforehand. On rare occasions
		the full IP address may be transfered to an US-based Google server and be shortened there. On behalf of this
		website's publisher this information will be used by Google to analyze your usage of this website, to generate
		reports about your activities, and to render services related to analyzing your usage of this website to
		its publisher. Your IP address will not be connected to other data about you known to Google. You can disable
		the use of cookies in the preferences of your browser. As a result of that, however, it is possible that
		you may not be able to access and use all services rendered by this website. Also, you can prevent Google
		from collecting data about your usage of this website by downloading and installing the browser plugin found
		under the following address: http://tools.google.com/dlpage/gaoptout. You may demand information about or
		deletion of the information about you. In such a case, please contact Google under the following address:</p>

	<p>Privacy Matters
		<br> c/o Google Inc.
		<br> 1600 Amphitheatre Parkway
		<br> Mountain View, California, 94043
		<br> USA
		<br>
	</p>

	<p id="moreinformation">More information can be found here:</p>

	<a href="http://www.google.com/intl/en/privacy">http://www.google.com/intl/en/privacy</a>

	<h2 id="polyfill">Polyfill</h2>
	<p id="polyfill-p">This website uses Polyfill, a polyfill is code that implements a feature on web browsers that do
		not support
		the feature. Most often, it refers to a JavaScript library that implements an HTML5 web standard, either
		an established standard (supported by some browsers) on older browsers, or a proposed standard (not supported
		by any browsers) on existing browsers.

		<p id="moreinformation">More information can be found here:</p>

		<a href="https://polyfill.io/docs/privacy-policy">https://polyfill.io/docs/privacy-policy</a>

</div>
		`;
	}
}

registerElement(NetspeakPrivacy);
