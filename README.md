# iinkTS

[![npm version](https://badge.fury.io/js/iink-ts.svg)](https://badge.fury.io/js/iink-ts)
[![Examples](https://img.shields.io/badge/Link%20to-examples-blue.svg)](https://myscript.github.io/iinkTS/examples/)
[![Documentation](https://img.shields.io/badge/Link%20to-documentation-green.svg)](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/)

> The fastest way to integrate rich **handwriting** features in your webapp.
>
> :point_right: [Examples](https://myscript.github.io/iinkTS/examples/):point_left:

<div align="center">
  <img src="https://raw.githubusercontent.com/MyScript/iinkTS/master/preview.gif">
</div>

iinkTS is a TypeScript library that can be used in every web application to bring handwriting recognition.

It integrates all you need:

- Signal capture for all devices,
- Digital ink rendering,
- Link to MyScript Cloud to bring handwriting recognition.

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Migration](#migration)
- [Development](#development)
- [Support](#getting-support)
- [Feedback](#sharing-your-feedback)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- Text and Math support,
- Easy to integrate,
- Digital ink capture and rendering,
- Rich editing gestures,
- Import and export content,
- Styling,
- Typeset support,
- More than 200 mathematical symbols supported,
- 72 supported languages.

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

### Universal Module Definition (UMD)

1. Create an `index.html` file in the same directory.

2. Add the following lines in the `head` section of your file to use iinkTS and the css :

```html
<script src="node_modules/iink-ts/dist/iink.min.js"></script>
```

3. Still in the `head` section, add a `style` and specify the height and the width of your canvas:

```html
<style>
  #canvas {
    width: 100%;
    height: 100%;
  }
</style>
```

4. In the `body` tag, create a `div` tag that will contain the drawing area:

```html
<div id="canvas"></div>
```

5. In JavaScript and within a `<script>` tag placed before the closing `</body>` tag, create the canvas using the `load` function, your HTML element, the desired type and the possible options depending on the type, then initialize it:

```javascript
    const canvasElement = document.getElementById('canvas');
    const options = {
      configuration: {
        server: {
          scheme: "https",
          host: "cloud.myscript.com",
          applicationKey: "<YOU-APPLICATION-KEY>",
          hmacKey: "<YOUR-HMAC-KEY>",
        }
      }
    }
    const canvasType = "INTERACTIVE_INK" /* or INTERACTIVE_INK_SSR or INK_V1 or INK_V2 */
    const canvas = iink.Canvas.load(canvasElement, canvasType, options);
```

6. Your `index.html` file should look like this:

```html
<html>
  <head>
    <script src="node_modules/iink-ts/dist/iink.min.js"></script>
    <style>
      #canvas {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="canvas"></div>
    <script>
      const canvasElement = document.getElementById("canvas")
      const options = {
        configuration: {
          server: {
            scheme: "https",
            host: "cloud.myscript.com",
            applicationKey: "<YOU-APPLICATION-KEY>",
            hmacKey: "<YOUR-HMAC-KEY>",
          },
        }
      }
      const canvasType = "INTERACTIVE_INK" /* or INTERACTIVE_INK_SSR or INK_V1 or INK_V2 */
      const canvas = iink.Canvas.load(canvasElement, canvasType, options)
    </script>
  </body>
</html>
```

7. Open `index.html` in your browser or serve your folder content using any web server.

You can find this guide, and a more complete example on the [MyScript Developer website](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/).

### ECMAScript module (ESM)

1. Create an `index.html` file in the same directory.

2. Add the following lines in the `body` section of your file to use iinkTS and the css :

```html
<body>
  <div id="canvasEl"></div>

  <script type="module">
    import { Canvas, getAvailableLanguageList } from "../../dist/iink.esm.js"
    const canvasElement = document.getElementById("canvasEl")

    const options = {
      configuration : {
        server: {
          scheme: "https",
          host: "cloud.myscript.com",
          applicationKey: "<YOU-APPLICATION-KEY>",
          hmacKey: "<YOUR-HMAC-KEY>",
        },
      }
    }

    const canvasType =
      "INTERACTIVE_INK" /* or INTERACTIVE_INK_SSR or INK_V1 or INK_V2 */
    const canvas = await Canvas.load(canvasElement, canvasType, options)
  </script>
</body>
```

3. Your `index.html` file should look like this:

```html
<html>
  <head>
    <style>
      #canvasEl {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="canvasEl"></div>
    <script type="module">
      import { Canvas, getAvailableLanguageList } from '../../dist/iink.esm.js'
      const canvasElement = document.getElementById('canvasEl')

      const options = {
        configuration: {
          server: {
            scheme: "https",
            host: "cloud.myscript.com",
            applicationKey: "<YOU-APPLICATION-KEY>",
            hmacKey: "<YOUR-HMAC-KEY>",
          }
        }
      }

      const canvas = await Canvas.load(canvasElement, 'INTERACTIVE_INK_SSR', options)
    </script>
  </body>
</html>
```

## Documentation

You can find a complete documentation with the following sections on our Developer website:

- **Get Started**: [how to use iinkTS with a full example](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/get-started/),
- **Editing**: [how to interact with content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/editing/),
- **Conversion**: [how to convert your handwritten content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/conversion/),
- **Import and Export**: [how to import and export your content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/import-and-export/),
- **Styling**: [how to style content](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/styling/).

We also provide a complete [API Reference](https://myscript.github.io/iinkTS/docs/).

## Architecture

If you're integrating iinkTS or rebuilding your own client from scratch, these diagrams cover the class organization and the WebSocket protocol:

- [architecture/interactive-ink-canvas.md](./architecture/interactive-ink-canvas.md) — class diagram of the `INTERACTIVE_INK` (WebSocket, real-time) variant and its managers.
- [architecture/ink-canvas.md](./architecture/ink-canvas.md) — class diagram of the `INK_V2` (HTTP batch) variant and the deprecated `INK_V1`.
- [architecture/websocket-protocol.md](./architecture/websocket-protocol.md) — sequence diagram of the messages exchanged between the WebSocket client and the MyScript backend (auth, session, strokes, recognition, export, undo/redo, errors/reconnection).

## Migration

Upgrading from an earlier major version? See [MIGRATION.md](./MIGRATION.md) for breaking changes and step-by-step instructions.

## Development

Instructions to help you build the project and develop are available in the [SETUP.md](./SETUP.md) file.

## Getting support

You can get support and ask your questions on the [dedicated section](https://developer-support.myscript.com/support/discussions/forums/16000096760) of MyScript Developer website.

## Sharing your feedback

Made a cool app with iinkTS? We would love to hear about you!
We’re planning to showcase apps using it so let us know by sending a quick mail to [myapp@myscript.com](mailto:myapp@myscript.com).

## Contributing

We welcome your contributions: if you would like to extend iinkTS for your needs, feel free to fork it!

Please take a look at our [contributing](./CONTRIBUTING.md) guidelines before submitting your pull request.

## Troubleshooting

If you encounter the error: `Unrecognized property: convert.force`, this means your server version is lower than 2.3.0.
To correct the problem, you have 2 options:

- either update your server
- either add in the iink-ts configuration `configuration.server.info.version = 2.2.0`

If you encounter the error: `Unrecognized property: configuration.export.jiix.text.lines`, this means your server version is lower than 3.2.0.
To correct the problem, you have 2 options:

- either update your server
- either add in the iink-ts configuration `configuration.server.info.version = 3.1.0`

## License

This library is licensed under the [Apache 2.0](http://opensource.org/licenses/Apache-2.0).
