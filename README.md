# [Netspeak](https://netspeak.github.io)

[![Actions Status](https://github.com/netspeak/netspeak-client-web/workflows/Node.js%20CI/badge.svg)](https://github.com/netspeak/netspeak-client-web/actions)

This is the development project of the [netspeak.org](http://netspeak.org) website.

The website is implemented as [Gatsby](https://www.gatsbyjs.com/) pages in pure TypeScript.
It is served using [GitHub pages](https://pages.github.com/) over [netspeak.github.io](https://github.com/netspeak/netspeak.github.io).

## Getting started

Before you can start developing make sure you have a recent-ish version of [Node.js](https://nodejs.org) and npm (included as part of Node.js) installed. ([Linux](https://nodejs.org/en/download/package-manager)/[Windows](https://nodejs.org/en/download/))

Then, install the dependencies:

```bash
cd path/to/repo
npm ci
```

And now, you should be ready to rock. As for IDEs, I recommend [VS Code](https://code.visualstudio.com/) together with the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) extensions.

Use the `npm run develop` command to open a local server with a live preview of the website. The page will automatically update as source files change.

## Build

The `npm run build` command will build a static version of the website.

Note: Builds are incremental. Run `npm run clean` before the build command to get a clean build.

## Deploy

**You changes will then be out there for the world to see, so make sure that everything is working correctly.**

Use the following command:

```bash
npm run publish-release
```

This will rebuild the website and push the build to [`netspeak.github.io`](https://github.com/netspeak/netspeak.github.io) repo automatically. (You have to have push permission for this.) GitHub pages will then deploy everything to `netspeak.org`.

If you want to publish a [demo](https://netspeak.org/demo) instead (useful for testing), use this command:

```bash
npm run publish-demo
```

## Developer notes

Gatsby will render each page as a [static HTML page](https://www.gatsbyjs.com/docs/glossary/static-site-generator/) that will be [hydrated](https://www.gatsbyjs.com/docs/react-hydration/) on the client.

This basically means that each page will be rendered on the developers computer to create a static HTML page and then on each client again.
The advantage of this approach is that static parts of a page can be packed into the HTML page instead of being a part of the (compiled) JS library resulting in faster load times for users.
However, this static generation is a problem for us because we don't have any static content.
All content on the website is localized.

To work around this, the `dynamic` function is used.
This function be used to create on empty page for the static site generator that will only be run on the client.
This means that all client-only variables (e.g. `window`, `location`, ...) will be accessible.
It's a bit hacky and has some [limitations](https://stackoverflow.com/a/63814668/7595472) but works perfectly for our use case.

---

## Contributors

[Michael Schmidt](mailto:mitchi5000.ms@googlemail.com) (2018 - 2020)
