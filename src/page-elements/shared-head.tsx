import React from "react";
import favicon from "../img/favicon.ico";

export default function SharedHead(): JSX.Element {
	return (
		<>
			<link rel="icon" href={favicon} />
			<script type="text/javascript">
				{`
			var _gaq = _gaq || [];
			_gaq.push(['_setAccount', 'UA-19276564-1']);
			_gaq.push(['_setDomainName', 'none']);
			_gaq.push(['_setAllowLinker', true]);
			_gaq.push(['_trackPageview']);
			(function () {
				var ga = document.createElement('script');
				ga.type = 'text/javascript';
				ga.async = true;
				ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0];
				s.parentNode.insertBefore(ga, s);
			})();`}
			</script>
		</>
	);
}
