module.exports = {
	staticFileGlobs: [
		'/index.html',
		'/manifest.json',
		'/node_modules/*',
		'/src/*'
	],

	// I'll just leave the defaults for new
	// https://polymer-library.polymer-project.org/3.0/docs/apps/service-worker#customize-your-service-worker
	navigateFallback: '/index.html',
	navigateFallbackWhitelist: [/^(?!.*\.js$|\/data\/).*/]
};
