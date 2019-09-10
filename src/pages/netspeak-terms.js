import { html, NetspeakElement, registerElement } from "../netspeak-app/netspeak-element.js";
import { styles } from './page-styles.js';
import { NetspeakNavigator } from '../netspeak-app/netspeak-navigator.js';

export class NetspeakTerms extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-terms'; }
	static get properties() { return {}; }
	static get template() {
		return html`${styles}

<div class="article">

	<h1 id="terms">Terms of Service</h1>

	<h2 id="preface">Preface</h2>

	<p id="preface-p1">These terms of service form a legal agreement between you and the publisher of this website: Chair
		of Web Technology
		and Information Systems at Bauhaus-Universität Weimar, 99423 Weimar, Germany ("Webis").</p>

	<p id="preface-p2">Subject matter of the contract are all services rendered on this website (the "services") and all
		data, information,
		and contents exchanged between the contractors (the "contents").</p>

	<p id="preface-p3">Using the services is free of charge. Minors must ask permission from their parents before using
		the services.</p>

	<h2 id="use">Use of the services by You</h2>

	<p id="use-p1">You agree not to interrupt, damage, or disable the services.</p>

	<p id="use-p2">You agree not to misuse the services in order to inflict damage on a third party, which particularly
		includes
		generating spam.
	</p>

	<p id="use-p3">You agree to access the services only using the officially advertised interfaces (for instance via
		buttons, links,
		or forms displayed on this website, or via application programming interfaces offered). Should you uncover
		ways of accessing the services via other than the aforementioned interfaces, you agree to inform Webis about
		them while not disclosing them to a third party.</p>

	<p id="use-p4">Repeated automatic access to the application programming interfaces may not exceed the specified
		maximal access
		frequencies. Only the officially documented parameters and parameter values may be used.</p>

	<p id="use-p5">Certain parts of this website may be crawled automatically. These parts are specified using the robots
		exclusion
		protocol (http://www.netspeak.org/robots.txt). If you crawl this website repeatedly, you agree to adjust
		your crawler to the frequency at which the static contents of this website change.</p>

	<p id="use-p6">You may use the services for private and commercial purposes, but agree not to sell the services to a
		third party,
		or indidcate to a third party the services are yours.</p>

	<h2 id="provision">Provision of the services by Webis</h2>

	<p id="provision-p1">Should your use of the services violate the terms of service, Webis may deny you access to (parts
		of) the services
		at any time, without prior notice, without explanation.</p>

	<p id="provision-p2">Webis is not required to offer the services free of charge.</p>

	<p id="provision-p3">Webis may modify or deactivate the services without prior notice or explanation.</p>

	<h2 id="usecontent">Use of the Contents by You</h2>

	<p id="usecontent-p1">The services may show contents obtained from a third party. You agree to make sure that your use
		of contents
		obtained via the services complies with the copyrights of the respective copyright holders.</p>

	<h2 id="provisioncont">Provision of the Contents by Webis</h2>

	<p id="provisioncont-p1">Webis disclaims any copyrights of contents obtained from a third party which are exchanged
		vis the services.
		Webis is not responsible for such contents and Webis does not adopt the messages conveyed with them as our
		own. Webis may filter the contents obtained from a third party before display.</p>

	<h2 id="privacy">Privacy Policy</h2>

	<p id="privacy-p1">While using the services, personal data about you may be gathered by Webis, or by a third party
		contractor. You
		agree to transfer usage rights of the gathered data to Webis and third party contractors of Webis without
		restrictions of time, location, or purpose of use of this data, if the use is directly or indirectly related
		to providing the services.</p>

	<p id="privacy-p2">You agree to the privacy policy which is in place at the time at which data is gathered: </p>

	<a href="[[getPageUrl('privacy')]]">http://www.netspeak.org/#privacy</a>

	<h2 id="exclusion">Exclusion of Warranties</h2>

	<p id="exclusion-p1">YOU EXPRESSLY UNDERSTAND AND AGREE THAT YOUR USE OF THE SERVICES IS AT YOUR SOLE RISK AND THAT
		THE SERVICES ARE
		PROVIDED "AS IS" AND "AS AVAILABLE." IN PARTICULAR, WEBIS, ITS SUBSIDIARIES AND AFFILIATES, AND ITS LICENSORS
		DO NOT REPRESENT OR WARRANT TO YOU THAT: (A) YOUR USE OF THE SERVICES WILL MEET YOUR REQUIREMENTS, (B) YOUR
		USE OF THE SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE OR FREE FROM ERROR, (C) ANY INFORMATION OBTAINED
		BY YOU AS A RESULT OF YOUR USE OF THE SERVICES WILL BE ACCURATE OR RELIABLE, AND (D) THAT DEFECTS IN THE
		OPERATION OR FUNCTIONALITY OF ANY SOFTWARE PROVIDED TO YOU AS PART OF THE SERVICES WILL BE CORRECTED. NO
		ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM WEBIS OR THROUGH OR FROM THE SERVICES
		SHALL CREATE ANY WARRANTY NOT EXPRESSLY STATED IN THE TERMS. WEBIS FURTHER EXPRESSLY DISCLAIMS ALL WARRANTIES
		AND CONDITIONS OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO THE IMPLIED WARRANTIES
		AND CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.</p>

	<h2 id="limitation">Limitation of Liability</h2>

	<p id="limitation-p1">YOU EXPRESSLY UNDERSTAND AND AGREE THAT WEBIS, ITS SUBSIDIARIES AND AFFILIATES, AND ITS
		LICENSORS SHALL NOT BE
		LIABLE TO YOU FOR ANY LOSS OR DAMAGE WHICH MAY BE INCURRED BY YOU, INCLUDING BUT NOT LIMITED TO LOSS OR DAMAGE
		AS A RESULT OF: (A) ANY RELIANCE PLACED BY YOU ON THE COMPLETENESS, ACCURACY OR EXISTENCE OF ANY ADVERTISING,
		OR AS A RESULT OF ANY RELATIONSHIP OR TRANSACTION BETWEEN YOU AND ANY ADVERTISER OR SPONSOR WHOSE ADVERTISING
		APPEARS ON THE SERVICES; (B) ANY CHANGES WHICH WEBIS MAY MAKE TO THE SERVICES, OR FOR ANY PERMANENT OR TEMPORARY
		CESSATION IN THE PROVISION OF THE SERVICES (OR ANY FEATURES WITHIN THE SERVICES); (C) THE DELETION OF, CORRUPTION
		OF, OR FAILURE TO STORE, ANY CONTENT AND OTHER COMMUNICATIONS DATA MAINTAINED OR TRANSMITTED BY OR THROUGH
		YOUR USE OF THE SERVICES.</p>

	<p id="limitation-p2">YOU EXPRESSLY UNDERSTAND AND AGREE THAT WEBIS, ITS SUBSIDIARIES AND AFFILIATES, AND ITS
		LICENSORS SHALL NOT BE
		LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL CONSEQUENTIAL OR EXEMPLARY DAMAGES WHICH MAY
		BE INCURRED BY YOU, HOWEVER CAUSED AND UNDER ANY THEORY OF LIABILITY. THIS SHALL INCLUDE, BUT NOT BE LIMITED
		TO, ANY LOSS OF PROFIT (WHETHER INCURRED DIRECTLY OR INDIRECTLY), ANY LOSS OF GOODWILL OR BUSINESS REPUTATION,
		ANY LOSS OF DATA SUFFERED, COST OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, OR OTHER INTANGIBLE LOSS.</p>

	<h2 id="general">General Terms</h2>

	<p id="general-p1">Webis may change these terms of service at any time without prior notice or explanation.</p>

	<p id="general-p2">Webis may hire third party conractors to provide (parts of) the services.</p>

	<p id="general-p3">Webis provides translations of the German version of these terms of service into languages other
		than German.
		Only the German version of the terms of service is legally binding. In case of inconsistencies or conflicts
		between the German version of these terms of service and another version in a language other than German,
		the German version takes precedence.</p>

	<p id="general-p4">These terms of service are governed by German law. However, this applies only inasmuch laws in your
		jurisdiction
		do not foreclose the choice of applicable law.</p>

	<p id="general-p5">Court of jurisdiction and place of fulfillment is the location of Webis.</p>
</div>
		`;
	}


	/**
	 * Returns the URL a given page will have.
	 *
	 * @param {string} page The page.
	 * @returns {string} The URL.
	 */
	getPageUrl(page) {
		return NetspeakNavigator.getPageUrl(page);
	}

}

registerElement(NetspeakTerms);
