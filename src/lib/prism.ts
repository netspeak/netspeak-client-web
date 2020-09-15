import Prism from "prismjs";

Prism.languages.netspeak = {
	"q-mark": /\?/,
	"asterisk": /\*|\.{2,}/,
	"plus": /\+/,
	"order-set": /[{}]/,
	"option-set": /[[\]]/,
	"dict-set": /#/,
	"punctuation": /["]/,
};

export default Prism;
