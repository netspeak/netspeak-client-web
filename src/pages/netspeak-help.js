import { html, htmlR, NetspeakElement, registerElement } from "../netspeak-app/netspeak-element.js";
import { NetspeakNavigator } from '../netspeak-app/netspeak-navigator.js';
import { styles } from './page-styles.js';
import { startScrollToUrlHash } from "../netspeak-app/util.js";

export class NetspeakHelp extends NetspeakElement {
	static get importMeta() { return import.meta; }
	static get is() { return 'netspeak-help'; }
	static get properties() { return {}; }
	static get template() {
		return html`${styles}
			<div class="article">

				<h1 id="help">Help</h1>

				<h2 id="how">How Netspeak works</h2>

				<p id="how-desc">
					Netspeak is a search engine designed to help you to express yourself in a foreign language by providing you with insight on how common native speakers use certain phrases. The following examples illustrate how you can use Netspeak to query phrases.
				</p>
				<p>
					<a href="[[getPageUrl('examples')]]" id="examples-link">Examples</a>
				</p>

				<h2 id="contact">Contact</h2>

				<p>
					<span id="email">Email:</span>
					<a href="mailto:info@netspeak.org">info@netspeak.org</a>
				</p>

				<h2 id="for-developers">For developers</h2>

				<ul>
					<li><a href="https://github.com/netspeak" target="_blank" id="github-link">GitHub</a></li>
				</ul>




				<p>Netspeak can be accessed programmatically via a REST interface and a Java API. </p>

				<h3>REST Interface</h3>

				<p>The REST interface has the following base URL:</p>

				<pre><code>http://api.netspeak.org/netspeak4/search?</code></pre>

				<p>The table below shows the currently supported parameters:</p>

				<table>
					<tbody>
						<tr>
							<th>Parameter</th>
							<th>Value</th>
							<th>Default</th>
							<th>Required</th>
							<th>Description</th>
						</tr>
						<tr>
							<td>
								<span class="code">callback</span>
							</td>
							<td>
								<span class="code">string</span>
							</td>
							<td>
								<span class="code">-</span>
							</td>
							<td>No</td>
							<td>Name of the callback function to use in a JSONP request.</td>
						</tr>
						<tr>
							<td>
								<span class="code">corpus</span>
							</td>
							<td>
								<span class="code">string</span>
							</td>
							<td>
								<span class="code">
									<code>web-en</code>
								</span>
							</td>
							<td>No</td>
							<td>Name of the corpus to use.</td>
						</tr>
						<tr>
							<td>
								<span class="code">format</span>
							</td>
							<td>
								<span class="code">
									<code>json</code> |
									<code>text</code>
								</span>
							</td>
							<td>
								<span class="code">
									<code>text</code>
								</span>
							</td>
							<td>No</td>
							<td>Response format.</td>
						</tr>
						<tr>
							<td>
								<span class="code">maxfreq</span>
							</td>
							<td>
								<span class="code" style="white-space: nowrap">∈ [40, 2^63-1]</span>
							</td>
							<td>
								<span class="code">-</span>
							</td>
							<td>No</td>
							<td>Maximal frequency of all retrieved phrases.</td>
						</tr>
						<tr>
							<td>
								<span class="code">maxregexmatches</span>
							</td>
							<td>
								<span class="code">∈ [1, 2^31-1]</span>
							</td>
							<td>
								<span class="code">10</span>
							</td>
							<td>No</td>
							<td>Maximal number of words for a regular expression to retrieve.</td>
						</tr>
						<tr>
							<td>
								<span class="code">nmax</span>
							</td>
							<td>
								<span class="code">∈ [1, 5]</span>
							</td>
							<td>
								<span class="code">5</span>
							</td>
							<td>No</td>
							<td>Maximal length of all retrieved phrases.</td>
						</tr>
						<tr>
							<td>
								<span class="code">nmin</span>
							</td>
							<td>
								<span class="code">∈ [1, 5]</span>
							</td>
							<td>
								<span class="code">1</span>
							</td>
							<td>No</td>
							<td>Minimal length of all retrieved phrases.</td>
						</tr>
						<tr>
							<td>
								<span class="code">query</span>
							</td>
							<td>
								<span class="code">string</span>
							</td>
							<td>
								<span class="code">-</span>
							</td>
							<td>Yes</td>
							<td>URL-encoded query string (see table below).</td>
						</tr>
						<tr>
							<td>
								<span class="code">topk</span>
							</td>
							<td>
								<span class="code">∈ [1, 1000]</span>
							</td>
							<td>
								<span class="code">100</span>
							</td>
							<td>No</td>
							<td>Maximal number of phrases to retrieve.</td>
						</tr>
					</tbody>
				</table>

				<h4>Queries</h4>

				<p>The following table defines the syntax of queries:</p>

				<table>
					<tbody>
						<tr>
							<th>Operator</th>
							<th>Name</th>
							<th>Example</th>
							<th>Description</th>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">?</code>
							</td>
							<td>
								<span class="code">QMARK</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">waiting ? response</code>
							</td>
							<td>Matches exactly one word.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">*</code>
							</td>
							<td>
								<span class="code">ASTERISK</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">waiting * response</code>
							</td>
							<td>Matches zero or more words.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">+</code>
							</td>
							<td>
								<span class="code">PLUS</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">waiting + response</code>
							</td>
							<td>Matches one or more words.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">[]</code>
							</td>
							<td>
								<span class="code">OPTIONSET</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">the same [ like as ]</code>
							</td>
							<td>Matches any of the given words. If only one word is given, the word is optional. Nesting of operators
								is not allowed.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">{}</code>
							</td>
							<td>
								<span class="code">ORDERSET</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">{ only for members }</code>
							</td>
							<td>Finds matches of each permutation of the enclosed words. Nesting of operators is not allowed.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">#</code>
							</td>
							<td>
								<span class="code">DICTSET</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">waiting for #response</code>
							</td>
							<td>Finds matches using the following word and each of its synonyms in turn.</td>
						</tr>
					</tbody>
				</table>

				<p>
					The bracket operators can also handle quoted phrases:
					<code class="language-netspeak-query" style="white-space: nowrap">[ "have to" must ]</code>.
				</p>

				<p>Queries also support a regular expression syntax for letters which is similar to the word queries syntax:</p>
				<table>
					<tbody>
						<tr>
							<th>Operator</th>
							<th>Name</th>
							<th>Example</th>
							<th>Description</th>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">?</code>
							</td>
							<td>
								<span class="code">QMARK</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">f?r</code>
							</td>
							<td>Matches exactly one letter.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">*</code>
							</td>
							<td>
								<span class="code">ASTERISK</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">inter*</code>
							</td>
							<td>Matches zero or more letters.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">+</code>
							</td>
							<td>
								<span class="code">PLUS</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">c+ty</code>
							</td>
							<td>Matches one or more letters.</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">[]</code>
							</td>
							<td>
								<span class="code">OPTIONSET</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">colo[u]r</code>
							</td>
							<td>Matches any of the given letters. If only one letter is given, the letter is optional. Nesting of operators
								is not allowed.
							</td>
						</tr>
						<tr>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">{}</code>
							</td>
							<td>
								<span class="code">ORDERSET</span>
							</td>
							<td>
								<code class="language-netspeak-query" style="white-space: nowrap">f{orm}</code>
							</td>
							<td>Finds matches of each permutation of the enclosed letters. Nesting of operators is not allowed.</td>
						</tr>
					</tbody>
				</table>

				<h4>Examples</h4>

				<ul>
					<li>
						<a href="http://api.netspeak.org/netspeak3/search?query=hello*">http://api.netspeak.org/netspeak3/search?query=hello*</a>
					</li>
					<li>
						<a href="http://api.netspeak.org/netspeak3/search?query=hello*&amp;topk=30">http://api.netspeak.org/netspeak3/search?query=hello*&amp;topk=30</a>
					</li>
					<li>
						<a href="http://api.netspeak.org/netspeak3/search?query=hello*&amp;topk=30&amp;nmin=2&amp;nmax=3">http://api.netspeak.org/netspeak3/search?query=hello*&amp;topk=30&amp;nmin=2&amp;nmax=3</a>
					</li>
					<li>
						<a href="http://api.netspeak.org/netspeak3/search?query=hello*&amp;topk=30&amp;nmin=2&amp;nmax=3&amp;format=json">http://api.netspeak.org/netspeak3/search?query=hello*&amp;topk=30&amp;nmin=2&amp;nmax=3&amp;format=json</a>
					</li>
				</ul>

				<p> When using JSON as a result format you will need its schema since Netspeak uses the
					<a href="http://code.google.com/p/protobuf/" target="_blank">Google Protobuf</a> library and
					<a href="http://code.google.com/p/protostuff/" target="_blank">Protostuff</a> for JSON serialization. Below you can
					find the Proto schema of Netspeak's Protobuf messages
					and the Protostuff configurations for generating Java classes and GWT overlays. </p>

				<div class="group-box">
					<span class="group-title">Download</span>
					<div class="group-content">
						<ul>
							<li>Google Protobuf:
								<a href="api/NetspeakMessages.proto">NetspeakMessages.proto</a>
							</li>
						</ul>
					</div>
				</div>

				<h3>Java API</h3>

				<p>The Java API calls the REST interface and processes the JSON response string, returning Java objects. The example
					code below demonstrates the basic usage of the library.</p>

				<div class="group-box">
					<span class="group-title">Download</span>
					<div class="group-content">
						<ul>
							<li>
								<a href="api/netspeak-client-1.3.5.jar">netspeak-client-1.3.5.jar</a>
							</li>
							<li>
								<a href="api/netspeak-client-1.3.5-doc.zip">netspeak-client-1.3.5-doc.zip</a>
							</li>
						</ul>
					</div>
				</div>

				<h4>Example</h4>

				<pre><code class="language-java">${javaCodeExample()}</code></pre>

			</div>
		`;
	}

	getPageUrl(page) {
		return NetspeakNavigator.getPageUrl(page);
	}

	connectedCallback() {
		super.connectedCallback();

		this.styleCode();
	}
}

registerElement(NetspeakHelp);

function javaCodeExample() {
	return htmlR`public static void main(String[] args) throws IOException {
    // Instantiate the Netspeak client once in your setup code.
    Netspeak netspeak = new Netspeak();

    // Create a request object and fill it with key/value pairs which
    // correspond to the parameters described by Netspeak's REST interface.
    Request request = new Request();
    request.put(Request.QUERY, "waiting ? * #response");
    request.put(Request.TOPK, String.valueOf(30));
    // Add more parameters here ...

    // Request the Netspeak service synchronously, i.e. the search method
    // blocks until the response was received or some exception occurred.
    Response response = netspeak.search(request);

    // Even if a response was received successfully, there may have
    // encountered an error while processing the request. Check this first.
    // Please always cast the integer error code to some proper ErrorCode!
    ErrorCode errorCode = ErrorCode.cast(response.getErrorCode());
    if (errorCode != ErrorCode.NO_ERROR) {
        System.err.println("Error code: " + errorCode);
        System.err.println("Error message: " + response.getErrorMessage());
    }

    // Iterate the retrieved list of phrases.
    // Note that a phrase is actually a list of words. Use CommonUtils to
    // stringify a phrase if you are just interested in the whole string.
    for (Phrase phrase : response.getPhraseList()) {
        System.out.printf("%d\t%d\t%s\n", phrase.getId(),
                phrase.getFrequency(), CommonUtils.toString(phrase));
    }

    // Iterate the retrieved list of phrases again.
    // This time print each word of the phrase separately together with its
    // tag. The tag states to which part of the query this word belongs to.
    for (Phrase phrase : response.getPhraseList()) {
        for (Word word : phrase.getWordList()) {
            System.out.printf("%s (%s) ", word.getText(), word.getTag());
        }
        System.out.println();
    }

    // Request the Netspeak service again, this time asynchronously, i.e.
    // the search method does not block, but returns immediately. If the
    // response was received, the onSuccess method of the callback object
    // is called by the internal executing thread.
    request.put(Request.QUERY, "how to ? this");
    netspeak.search(request, new SearchCallback() {
        @Override
        public void onFailure(Throwable caught) {
            System.err.println("Failure in asynch search: " + caught);
        }
        @Override
        public void onSuccess(Response response) {
            for (Phrase phrase : response.getPhraseList()) {
                System.out.printf("%d\t%d\t%s\n", phrase.getId(),
                    phrase.getFrequency(), CommonUtils.toString(phrase));
            }
        }
    });
}`;
}

startScrollToUrlHash();
