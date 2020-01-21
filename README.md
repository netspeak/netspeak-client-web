# [Netspeak](https://netspeak.github.io)

This is the development project of the [netspeak.org](http://netspeak.org) website.

The website is a single page application and uses the [Polymer 3 framework](https://polymer-library.polymer-project.org/3.0/docs/devguide/feature-overview).
It is served using [GitHub pages](https://pages.github.com/) over [netspeak.github.io](https://github.com/netspeak/netspeak.github.io).


## Getting started

Before you can start developing make sure you have a recent-ish version of [Node.js](https://nodejs.org) and npm (included as part of Node.js) installed.

Install the dependencies:

```bash
cd path/to/repo
npm i
```

If you had any problems, check out the official [Polymer install guide](https://www.polymer-project.org/3.0/start/install-3-0).

Use the `npm run serve` to build the project and serve the created build.


## Build

After you made some changes, use the `npm run build` command to build the website.

This will create a new folder `build` where all builds are located. The build `default` is the one we want.


### ESNext

JavaScript is a fast evolving language which adds new features each year!

This project uses Polymer's built in capabilities to compile our JS files down to ES5 for the best browser support.
This comes at the cost of increased file sizes but that's a good trade for compatibility.

However! <br>
Some newer JS features are not ES5 compatible and cannot be compiled.
These features will be copied as is by Polymer in the futile hope that older browsers might support it.
This means that it is __your__ responsibility to make sure that the language feature you use compile.


## Test

Polymer has it's own test system. All tests are located in the `test/` folder.

To run all tests use the following command:

```bash
npm test
```

This will run all unit tests in all of your installed browsers. (Browser windows will pop up and close at a few seconds.)


## Deploy

If all tests pass, you can deploy your updated build. Copy the contents of the build (the files in `build/<build name>/`) to the `master` branch of [`netspeak.github.io`](https://github.com/netspeak/netspeak.github.io) project and push. GitHub pages will take care of the rest and update the website in a few seconds.

__You changes will then be out there for the world to see, so make sure that everything is working correctly.__


## A word on localization

The website has its own localization system which is tied to [NetspeakElement](https://github.com/netspeak/netspeak.github.io/blob/develop/src/netspeak-app/netspeak-element.js).
Every element which extends this class will be assumed to be localized.
An element extending `NetspeakElement` has to have a static `is` and `importMeta` property.

To add a localization, add a new JSON file `{name}.{lang}.json` inside the `locales` directory which is in the same directory as the file of the element to localize. `name` is the exported `is` value of the element and `lang` is the language to localize.

Example:

```
locales/
    my-element.de.json
my-element.js
```

The correct JSON file will automatically be loaded. You can use the `loadLocalization` function to get the Promise which resolves the JSON for any class which has static `importMeta` and `is` properties.

Example:

```js
import { loadLocalization, NetspeakElement } from '/path/to/netspeak-element.js';

class MyElement extends NetspeakElement {
    static get importMeta() { return import.meta; }
    static get is() { return 'my-element'; }
    // properties, template, etc.

    constructor() {
        super(); // important!

        loadLocalization(MyElement).then(json => {
            if (json === false) {
                // In this case, the current language is the default language (en).
                // No localization will be loaded.
            } else {
                // do something with the language data.
            }
        });
    }
}
```

__But we can do even MORE!__

The `NetspeakElement` can also automatically insert the localization into the shadow DOM. To do so, it uses the ID of DOM elements. The JSON files also have to be of the format:

```js
{
    "template": {
        "id1": "message",
        "some-other-id": "hello",
        // and so on
    },
    // some other items
}
```

Localized message will be inserted into the shadow DOM asynchronously after the element has be connected to a host DOM. After this is done, the shadow DOM will not be touched again.

_Note:_ Only element with an ID __and__ no child element at the time of the insertion can be localized this way.


---

## Contributors

[Michael Schmidt](mailto:mitchi5000.ms@googlemail.com) (2018 - 2019)
