(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["JsonCSS"] = factory();
	else
		root["JsonCSS"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by jyothi on 15/4/17.
 */
var JsonCSS =

//TODO: support for media queries

function JsonCSS(options) {
    var _this2 = this;

    _classCallCheck(this, JsonCSS);

    this.toJSON = function (text) {
        if (typeof text !== 'string') {
            console.error("Need a CSS string but given ", typeof text === "undefined" ? "undefined" : _typeof(text), text);
            return "Not a valid CSS..!";
        }
        var output = {},
            lastKey = void 0,
            term = void 0,
            style = void 0,
            _this = _this2;
        try {
            text.split("{").forEach(function (item) {
                term = item.trim();
                if (term) {
                    if (term.indexOf("}") === -1) {
                        output[term] = {}; //it's a selector
                        lastKey = term;
                    } else {
                        //contains styles and next selector
                        term.substring(0, term.indexOf("}")).split(";").forEach(function (keyValue) {
                            style = keyValue.split(":");
                            if (style && style.length === 2) {
                                output[lastKey][style[0].trim().replace(/^\"|\"$/g, '')] = _this2._trimSemiColon(style[1].trim().replace(/^\"|\"$/g, '')); //for new style
                            }
                        });
                        try {
                            //may be End of Styles
                            lastKey = term.split("}")[1].trim();
                            if (lastKey) {
                                output[lastKey] = {}; //for new selector
                            }
                        } catch (e) {
                            //no more selectors for our life
                        }
                    }
                }
            });
        } catch (e) {
            return "Not a valid CSS..!";
        }
        return output;
    };

    this.toCSS = function (json) {
        if ((typeof json === "undefined" ? "undefined" : _typeof(json)) !== 'object') {
            console.error("Need a JSON object but given ", typeof json === "undefined" ? "undefined" : _typeof(json), json);
            return "Not a valid JSON..!";
        }
        var output = "";
        try {
            for (var selector in json) {
                if (json.hasOwnProperty(selector)) {
                    output += selector + ' {\n';
                    for (var style in json[selector]) {
                        if (json[selector].hasOwnProperty(style)) {
                            output += style + ': ' + json[selector][style] + ';\n';
                        }
                    }
                    output += '}\n';
                }
            }
        } catch (e) {
            return "Not a valid JSON..!";
        }
        return output;
    };

    this._trimSemiColon = function (text) {
        return text.slice(-1) === ';' ? text.slice(0, _this2.length - 1) : text;
    };
}
//TODO: if any


/**
 * return JSON output for CSS string
 * @param text {String}
 * @returns {Object}
 */


/**
 *
 * @param json {Object}
 * @returns {string}
 */


/**
 *
 * @param text {string}
 * @returns {ArrayBuffer|Blob|Array.<T>|string}
 * @private
 */
;

exports.default = JsonCSS;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Created by jyothi on 30/5/17.
 */
module.exports = __webpack_require__(0).default;

/***/ })
/******/ ]);
});