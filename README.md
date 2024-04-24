# iinkTS

[![npm version](https://badge.fury.io/js/iink-ts.svg)](https://badge.fury.io/js/iink-ts)
[![Examples](https://img.shields.io/badge/Link%20to-examples-blue.svg)](https://iinkts-beta.myscript.com/2.0.0-alpha.8/examples/index.html)
[![Documentation](https://img.shields.io/badge/Link%20to-documentation-green.svg)](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/)

> The fastest way to integrate rich **handwriting** features in your webapp.

<div align="center">
  <img src="https://myscript.github.io/iinkTS/preview.gif">
</div>

iinkTS is a JavaScript library that can be used in every web application to bring handwriting recognition.

It integrates all you need:

* Signal capture for all devices,
* Digital ink rendering,
* Link to MyScript Cloud to bring handwriting recognition.

## Table of contents

* [Features](#features)
* [Requirements](#requirements)
* [Installation](#installation)
* [Usage](#usage)
* [Documentation](#documentation)
* [Development](#development)
* [Support](#getting-support )
* [Feedback](#sharing-your-feedback)
* [Contributing](#contributing)

## Features

* Text and Math support,
* Easy to integrate,
* Digital ink capture and rendering,
* Rich editing gestures,
* Import and export content,
* Styling,
* Typeset support,
* More than 200 mathematical symbols supported,
* 72 supported languages.

You can discover all the features on our Developer website for [Text](https://developer.myscript.com/features/text) and [Math](https://developer.myscript.com/features/math).

## Requirements

1. Have [npm](https://www.npmjs.com/get-npm), [yarn](https://yarnpkg.com/en/docs/install).
2. Have a MyScript developer account. You can create one [here](https://developer.myscript.com/support/account/registering-myscript-cloud/).
3. Get your keys and the free monthly quota to access MyScript Cloud at [developer.myscript.com](https://developer.myscript.com/getting-started/web)

## Installation

iinkTS can be installed with the well known package managers `npm`, `yarn`.

If you want to use `npm` or `yarn` you first have to init a project (or use an existing one).

```shell
npm init
OR
yarn init
```

You can then install iinkTS and use it as showed in the [Usage](#usage) section.

```shell
npm install iink-ts
OR
yarn add iink-ts
```

## Usage

1. Create an `index.html` file in the same directory.

2. Add the following lines in the `head` section of your file to use iinkTS and the css :
```html
<script src="node_modules/iink-ts/dist/iink.min.js"></script>
```

3. Still in the `head` section, add a `style` and specify the height and the width of your editor:
```html
<style>
    #editor {
        width: 100%;
        height: 100%;
    }
</style>
```

4. In the `body` tag, create a `div` tag that will contain the editing area:
```html
    <div id="editor"></div>
```

5. In JavaScript and within a `<script>` tag placed before the closing tag `</body>`, create the editor using the Editor `constructor` function, your editor html element and a simple configuration, then initialize it:
* Initialization in the standard case, i.e. websocket or rest mode
```javascript
  const editorElement = document.getElementById('editor');

  const editor = new iink.Editor(editorElement, {
      configuration: {
          server: {
              applicationKey: '#YOUR MYSCRIPT DEVELOPER APPLICATION KEY#',
              hmacKey: '#YOUR MYSCRIPT DEVELOPER HMAC KEY#'
          }
      }
  });
  editor.initialize();
```
* Initialization in the offscreen case
```javascript
  const editorElement = document.getElementById('editor');

  const editor = new iink.Editor(editorElement, {
      configuration: {
        offscreen: true,
          server: {
              applicationKey: '#YOUR MYSCRIPT DEVELOPER APPLICATION KEY#',
              hmacKey: '#YOUR MYSCRIPT DEVELOPER HMAC KEY#'
          }
      }
  });
  editor.initialize();
```

6. Your `index.html` file should look like this:
* In the standard case
```html
<html>
    <head>
        <script src="node_modules/iink-ts/dist/iink.min.js"></script>
        <style>
            #editor {
                width: 100%;
                height: 100%;
            }
        </style>
    </head>
    <body>
        <div id="editor" touch-action="none"></div>
        <script>
            const editorElement = document.getElementById('editor');

            const editor = new iink.Editor(editorElement, {
                configuration: {
                    server: {
                        applicationKey: '#YOUR MYSCRIPT DEVELOPER APPLICATION KEY#',
                        hmacKey: '#YOUR MYSCRIPT DEVELOPER HMAC KEY#'
                    }
                }
            });
            editor.initialize();
        </script>
    </body>
</html>
```
* In the offscreen case
```html
<html>
    <head>
        <script src="node_modules/iink-ts/dist/iink.min.js"></script>
        <style>
            #editor {
                width: 100%;
                height: 100%;
            }
        </style>
    </head>
    <body>
        <div id="editor" touch-action="none"></div>
        <script>
            const editorElement = document.getElementById('editor');

            const editor = new iink.Editor(editorElement, {
                offscreen: true,
                configuration: {
                    server: {
                        applicationKey: '#YOUR MYSCRIPT DEVELOPER APPLICATION KEY#',
                        hmacKey: '#YOUR MYSCRIPT DEVELOPER HMAC KEY#'
                    }
                }
            });
            editor.initialize();
        </script>
    </body>
</html>
```

7. Open `index.html` in your browser or serve your folder content using any web server.

You can find this guide, and a more complete example on the [MyScript Developer website](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/).

## Documentation

You can find a complete documentation with the following sections on our Developer website:

* **Get Started**: [how to use iinkTS with a full example](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/get-started/),
* **Editing**: [how to interact with content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/editing/),
* **Conversion**: [how to convert your handwritten content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/conversion/),
* **Import and Export**: [how to import and export your content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/import-and-export/),
* **Styling**: [how to style content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/styling/).

As well as a global [Configuration page](https://developer.myscript.com/docs/interactive-ink/latest/reference/web/configuration/).

We also provide a complete [API Reference](https://myscript.github.io/iinkTS/docs/).

## Development

Instructions to help you build the project and develop are available in the [SETUP.md](./SETUP.md) file.


## Getting support

You can get support and ask your questions on the [dedicated section](https://developer-support.myscript.com/support/discussions/forums/16000096760) of MyScript Developer website.

## Sharing your feedback ?

Made a cool app with iinkTS? We would love to hear about you!
We’re planning to showcase apps using it so let us know by sending a quick mail to [myapp@myscript.com](mailto://myapp@myscript.com).

## Contributing

We welcome your contributions: if you would like to extend iinkTS for your needs, feel free to fork it!

Please take a look at our [contributing](./CONTRIBUTING.md) guidelines before submitting your pull request.

## Troubleshooting
If you encounter the error: `Unrecognized property: convert.force`, this means your server version is lower than 2.3.0.
To correct the problem, you have 2 options:
- either update your server
- either add in the iink-ts configuration `configuration.server.version = 2.2.0`

## License
This library is licensed under the [Apache 2.0](http://opensource.org/licenses/Apache-2.0).
