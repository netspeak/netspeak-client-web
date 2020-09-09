module.exports = {
	globals: {
		__PATH_PREFIX__: true,
	},
	parser: `@typescript-eslint/parser`,
	extends: [
		"plugin:@typescript-eslint/recommended",
		"react-app",
		"plugin:prettier/recommended",
		"prettier/@typescript-eslint",
	],
	plugins: ["@typescript-eslint", "prettier"],
	parserOptions: {
		ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
		sourceType: "module", // Allows for the use of imports
	},
	env: {
		browser: true,
		node: true,
	},
	rules: {
		"@typescript-eslint/explicit-function-return-type": [
			"error",
			{
				allowExpressions: true,
			},
		],
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"no-restricted-globals": "off",
	},
	ignorePatterns: ["src/img/**", "*.css", "gulpfile.js", "publish/**"],
};
