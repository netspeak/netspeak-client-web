# [Netspeak](https://netspeak.github.io)

[![Actions Status](https://github.com/netspeak/netspeak-client-web/workflows/Node.js%20CI/badge.svg)](https://github.com/netspeak/netspeak-client-web/actions)

This is the development project of the [netspeak.org](http://netspeak.org) website.

The website is served using [GitHub pages](https://pages.github.com/) over [netspeak.github.io](https://github.com/netspeak/netspeak.github.io).

## Getting started

Before you can start developing make sure you have a recent-ish version of [Node.js](https://nodejs.org) and npm (included as part of Node.js) installed. ([Linux](https://nodejs.org/en/download/package-manager)/[Windows](https://nodejs.org/en/download/))

Then, install the dependencies:

```bash
cd path/to/repo
npm i
```

And now, you should be ready to rock. As for IDEs, I recommend [VS Code](https://code.visualstudio.com/).

Use the `npm run develop` command to open a local server with a live preview of the website. The page will automatically update as source files change.

## Build

The `npm run build` command will build a static version of the website.

Note: Builds might overlap. Run `npm run clean` before the build command to get a clean build.

## Deploy

If all tests pass, you can deploy your updated build. Copy the contents of the build (the files in `build/<build name>/`) to the `master` branch of [`netspeak.github.io`](https://github.com/netspeak/netspeak.github.io) project and push. GitHub pages will take care of the rest and update the website in a few seconds.

**You changes will then be out there for the world to see, so make sure that everything is working correctly.**

If you don't want to do this manually, use the following command:

```bash
npm run publish-release
```

This will do the above steps automatically.

If you want to publish a [demo](https://netspeak.org/demo), use this command:

```bash
npm run publish-demo
```

---

## Contributors

[Michael Schmidt](mailto:mitchi5000.ms@googlemail.com) (2018 - 2020)
