# JSON-CSS | CSS-JSON

##### Utility to convert Cascading Style Sheets (CSS) to JSON objects and vice versa.

[![npm version](https://badge.fury.io/js/json-css.svg)](https://badge.fury.io/js/json-css)

### [TRY HERE](https://arajajyothibabu.github.io/json-css/)

- Yet to support media queries
- Yet to support Files

#### Import:

- Installing with NPM

        npm install json-css --save
        
- Import in es6

        import JsonCSS from 'json-css';
        
- Import through `require` in es5

        var JsonCSS = require('json-css');
        
#### Usage

- to JSON with CSS as input type `string`

        JsonCSS.toJSON(`
            h1 {
                color: #F1F1F1;
            }
        `);
        
- to CSS with JSON as input type `object`

        JsonCSS.toCSS({
            h1: {
                color: "#F1F1F1"
            }
        });
 