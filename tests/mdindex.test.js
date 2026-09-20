'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { githubSlug, extractHeadings, buildToc } = require('../src/mdindex.js');

test('github slug rules', () => {
  assert.strictEqual(githubSlug('Hello World'), 'hello-world');
  assert.strictEqual(githubSlug('  spaces   collapsed  '), 'spaces---collapsed');
  assert.strictEqual(githubSlug('special! @#$ chars'), 'special--chars');
  assert.strictEqual(githubSlug('türkçe başlık'), 'türkçe-başlık');
  assert.strictEqual(githubSlug('code `x = 1` here'), 'code-x--1-here');
});

test('extracts headings, skips fences', () => {
  const md = [
    '# Title',
    '```',
    '# not a heading',
    '```',
    '## Section One',
    'text',
    '### Deep ##',
    '#### too deep',
  ].join('\n');
  const h = extractHeadings(md, 3);
  assert.deepStrictEqual(h.map(x => x.title), ['Title', 'Section One', 'Deep']);
  assert.deepStrictEqual(h.map(x => x.level), [1, 2, 3]);
  assert.deepStrictEqual(h.map(x => x.slug), ['title', 'section-one', 'deep']);
});

test('duplicate headings get -N suffixes', () => {
  const md = '## Same\n## Same\n### Same';
  const h = extractHeadings(md, 6);
  assert.deepStrictEqual(h.map(x => x.slug), ['same', 'same-1', 'same-2']);
});

test('buildToc indents by level and respects depth', () => {
  const md = '# A\n## B\n### C\n#### D';
  const toc = buildToc(extractHeadings(md, 6), 3);
  const lines = toc.split('\n');
  assert.strictEqual(lines[0], '<!-- TOC -->');
  assert.strictEqual(lines[1], '- [A](#a)');
  assert.strictEqual(lines[2], '  - [B](#b)');
  assert.strictEqual(lines[3], '    - [C](#c)');
  assert.strictEqual(lines[4], '<!-- /TOC -->');
  const deep = buildToc(extractHeadings(md, 6), 2);
  assert.ok(deep.includes('#d') === false);
});

test('links are stripped from titles', () => {
  const md = '## [Docs](https://example.com)';
  const h = extractHeadings(md, 6);
  assert.strictEqual(h[0].title, 'Docs');
  assert.strictEqual(h[0].slug, 'docs');
});
