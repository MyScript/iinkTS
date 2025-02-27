/*
  @license
	Rollup.js v4.28.0
	Sat, 30 Nov 2024 13:15:17 GMT - commit 0595e433edec3608bfc0331d8f02912374e7f7f7

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
import 'tty';
