/**
 * CommonJS bridge for Tailwind / Node scripts (cannot `require` TypeScript).
 * Source of truth: src/theme/tokens.ts — edit that file, not this one.
 *
 * Kept outside src/ so Vite never serves this module to the browser.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'src', 'theme', 'tokens.ts');
const source = fs.readFileSync(sourcePath, 'utf8');

let esbuild;
try {
  esbuild = require('esbuild');
} catch {
  throw new Error(
    'esbuild is required to load src/theme/tokens.ts for Tailwind. Install vite (includes esbuild) or esbuild.'
  );
}

const { code } = esbuild.transformSync(source, {
  loader: 'ts',
  format: 'cjs',
  target: 'node16',
});

const moduleStub = { exports: {} };
// eslint-disable-next-line no-new-func
new Function('exports', 'module', 'require', code)(
  moduleStub.exports,
  moduleStub,
  require
);

const tokens = moduleStub.exports.default || moduleStub.exports;
module.exports = tokens;
module.exports.default = tokens;
