#!/usr/bin/env node
// mdindex — Markdown table-of-contents generator with GitHub-compatible
// anchors. Zero dependencies; pure string processing.
//
// Usage: mdindex [options] [FILE]
//   -d, --max-depth N   include headings up to level N (default 3)
//   -i, --insert        replace the block between <!-- TOC --> and
//                       <!-- /TOC --> markers in the file (in place)
//   -o, --output FILE   write TOC to FILE instead of stdout
//   -V, --version

'use strict';
const fs = require('fs');

function githubSlug(text) {
  // GitHub algorithm: lowercase, strip punctuation (keep letters, numbers,
  // spaces, hyphens), then replace every space with a hyphen — consecutive
  // spaces produce consecutive hyphens, no collapsing.
  return text
    .toLowerCase()
    .trim()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/ /g, '-');
}

// Extract headings (ATX style, skipping fenced code blocks).
function extractHeadings(text, maxDepth) {
  const headings = [];
  const seen = new Map();
  let inFence = false;
  for (const raw of text.split('\n')) {
    const fence = raw.match(/^\s*(```+|~~~+)/);
    if (fence) {
      if (!inFence || fence[1].length >= (headings._fenceLen || 0)) {
        inFence = !inFence;
      }
      continue;
    }
    if (inFence) continue;
    const m = raw.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length;
    if (level > maxDepth) continue;
    let title = m[2].trim();
    // strip links: [text](url) -> text
    title = title.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    // strip inline code backticks but keep content
    title = title.replace(/`([^`]*)`/g, '$1');
    let slug = githubSlug(title);
    const n = seen.get(slug) || 0;
    seen.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n}`; // GitHub dedup suffix
    headings.push({ level, title, slug });
  }
  return headings;
}

function buildToc(headings, maxDepth) {
  const lines = ['<!-- TOC -->'];
  for (const h of headings) {
    if (h.level > maxDepth) continue;
    lines.push(`${'  '.repeat(h.level - 1)}- [${h.title}](#${h.slug})`);
  }
  lines.push('<!-- /TOC -->');
  return lines.join('\n');
}

function parseArgs(argv) {
  const opts = { maxDepth: 3, insert: false, output: null, file: null, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-V' || a === '--version') opts.version = true;
    else if (a === '-i' || a === '--insert') opts.insert = true;
    else if (a === '-d' || a === '--max-depth') {
      const v = Number(argv[++i]);
      if (!Number.isInteger(v) || v < 1 || v > 6) {
        process.stderr.write('mdindex: --max-depth needs 1..6\n');
        process.exit(2);
      }
      opts.maxDepth = v;
    } else if (a === '-o' || a === '--output') {
      opts.output = argv[++i] || fail('-o needs a file');
    } else if (a.startsWith('-')) {
      process.stderr.write(`mdindex: unknown option ${a}\n`);
      process.exit(2);
    } else {
      opts.file = a;
    }
  }
  return opts;
}

function a(x) { return x; }
function fail(msg) { process.stderr.write(`mdindex: ${msg}\n`); process.exit(2); }

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('mdindex 1.0.0 - Markdown TOC generator\n\nUSAGE: mdindex [-d N] [-i] [-o FILE] [FILE]\n');
    return 0;
  }
  if (opts.version) { console.log('mdindex 1.0.0'); return 0; }

  let text;
  if (opts.file) text = fs.readFileSync(opts.file, 'utf8');
  else text = fs.readFileSync(0, 'utf8');

  const headings = extractHeadings(text, 6);
  const toc = buildToc(headings, opts.maxDepth);

  if (opts.insert) {
    if (!opts.file) { process.stderr.write('mdindex: --insert needs a FILE\n'); return 2; }
    if (!text.includes('<!-- TOC -->') || !text.includes('<!-- /TOC -->')) {
      process.stderr.write('mdindex: file has no <!-- TOC --> / <!-- /TOC --> markers\n');
      return 1;
    }
    const re = /<!-- TOC -->[\s\S]*?<!-- \/TOC -->/;
    fs.writeFileSync(opts.file, text.replace(re, () => toc));
    process.stdout.write(`mdindex: TOC updated in ${opts.file} (${headings.length} headings)\n`);
    return 0;
  }
  const target = opts.output ? opts.output : process.stdout;
  if (opts.output) fs.writeFileSync(opts.output, toc + '\n');
  else process.stdout.write(toc + '\n');
  return 0;
}

module.exports = { githubSlug, extractHeadings, buildToc, parseArgs };
if (require.main === module) process.exit(main());
