#!/usr/bin/env node
/**
 * UI guardrails: prevents regressions of the UI-state / feedback system
 * and off-brand hex colors.
 *
 * Fails (exit 1) if it finds, anywhere under src/ (excluding tests + theme):
 *   1. an import from `react-hot-toast`  → use `notify` from src/lib/notify.ts
 *   2. the legacy full-page spinner idiom `rounded-full h-12 w-12 border-b-2`
 *      → use <Spinner size="xl" /> or <PageLoader />
 *   3. banned off-brand hex colors → edit src/theme/tokens.ts / use theme exports
 *
 * Run: `npm run lint:ui`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const srcDir = join(root, 'src');
const require = createRequire(import.meta.url);
const { bannedHex } = require(join(root, 'theme-tokens.cjs'));

const RULES = [
  {
    id: 'no-react-hot-toast',
    // Only match actual imports, not comments mentioning the package name.
    regex: /from\s+['"]react-hot-toast['"]/,
    message:
      "Import from 'react-hot-toast' is banned. Use `notify` from src/lib/notify.ts.",
  },
  {
    id: 'no-fullpage-border-spinner',
    regex: /rounded-full\s+h-12\s+w-12\s+border-b-2/,
    message:
      'Ad-hoc full-page spinner is banned. Use <Spinner size="xl" /> or <PageLoader />.',
  },
];

/** Case-insensitive hex matchers built from tokens.ts bannedHex list. */
const BANNED_HEX_RULES = (bannedHex || []).map((hex) => ({
  id: `no-offbrand-hex-${hex.replace('#', '').toLowerCase()}`,
  regex: new RegExp(hex.replace('#', '#?'), 'i'),
  message:
    `Off-brand hex ${hex} is banned. Edit src/theme/tokens.ts or import { chart, colors } from 'src/theme'.`,
}));

const IGNORE_DIRS = new Set(['__tests__', 'node_modules', 'theme']);
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

/** @returns {string[]} */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (IGNORE_DIRS.has(entry)) continue;
      out.push(...walk(full));
    } else if ([...EXT].some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];
for (const file of walk(srcDir)) {
  // Skip the notify shim itself (it documents the legacy package in comments).
  if (file.endsWith(join('lib', 'notify.ts'))) continue;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    // Skip pure comments for hex bans (docs/examples), but still catch toast/spinner rules.
    const trimmed = line.trim();
    const isComment =
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*');

    for (const rule of RULES) {
      if (rule.regex.test(line)) {
        violations.push({
          file: relative(root, file).split(sep).join('/'),
          line: i + 1,
          rule: rule.id,
          message: rule.message,
          text: trimmed,
        });
      }
    }

    if (isComment) return;

    for (const rule of BANNED_HEX_RULES) {
      if (rule.regex.test(line)) {
        violations.push({
          file: relative(root, file).split(sep).join('/'),
          line: i + 1,
          rule: rule.id,
          message: rule.message,
          text: trimmed,
        });
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✖ UI guardrails failed (${violations.length} violation(s)):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
    console.error(`    ${v.message}`);
    console.error(`    > ${v.text}\n`);
  }
  process.exit(1);
}

console.log('✓ UI guardrails passed.');
