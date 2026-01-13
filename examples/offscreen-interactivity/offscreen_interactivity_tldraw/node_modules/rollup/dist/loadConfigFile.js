/*
  @license
	Rollup.js v4.28.0
	Sat, 30 Nov 2024 13:15:17 GMT - commit 0595e433edec3608bfc0331d8f02912374e7f7f7

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

require('node:fs/promises');
require('node:path');
require('node:process');
require('node:url');
require('./shared/rollup.js');
require('./shared/parseAst.js');
const loadConfigFile_js = require('./shared/loadConfigFile.js');
require('tty');
require('path');
require('./native.js');
require('node:perf_hooks');
require('./getLogFilter.js');



exports.loadConfigFile = loadConfigFile_js.loadConfigFile;
//# sourceMappingURL=loadConfigFile.js.map
