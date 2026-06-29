// Core unit tests — run with `npm test` (node --test). No network, no keys.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { extractJSON, slugify, seededRand } from '../src/util/helpers.js';
import { classifyWebPresence } from '../src/discovery/index.js';
import { discoverMock } from '../src/discovery/providers/mock.js';
import { resolveContact } from '../src/outreach/contact.js';
import { analyze } from '../src/analysis/analyze.js';
import { buildWebsite } from '../src/generation/website.js';
import { draftEmail } from '../src/outreach/email.js';
import { runQA } from '../src/qa/checker.js';

test('extractJSON pulls JSON from fenced / messy text', () => {
  assert.deepEqual(extractJSON('here: ```json\n{"a":1}\n``` ok'), { a: 1 });
  assert.deepEqual(extractJSON('noise [1,2,3] tail'), [1, 2, 3]);
  assert.equal(extractJSON('no json here'), null);
});

test('slugify and seededRand are deterministic', () => {
  assert.equal(slugify('Bright Smile Dental!'), 'bright-smile-dental');
  assert.equal(seededRand('x'), seededRand('x'));
});

test('classifyWebPresence triages presence correctly', () => {
  assert.equal(classifyWebPresence({ website: null }).status, 'none');
  assert.equal(classifyWebPresence({ website: 'https://x.business.site' }).status, 'weak');
  assert.equal(classifyWebPresence({ website: 'https://www.realbiz.com' }).status, 'has_site');
});

test('discoverMock returns a stable, varied lead set', async () => {
  const a = await discoverMock('plumbers in Denver', 5);
  const b = await discoverMock('plumbers in Denver', 5);
  assert.equal(a.length, 5);
  assert.deepEqual(a.map((l) => l.id), b.map((l) => l.id)); // deterministic
  assert.ok(a.every((l) => l.name && l.city && l.country));
});

test('resolveContact infers role-based email or flags no-domain', () => {
  const withSite = resolveContact({ name: 'Real Biz', website: 'https://www.realbiz.com' });
  assert.equal(withSite.email, 'info@realbiz.com');
  const noSite = resolveContact({ name: 'No Site Co', website: null });
  assert.equal(noSite.email, null);
  assert.ok(noSite.proposedDomain.includes('no-site-co'));
});

test('full per-lead pipeline (mock) produces a QA-passing package', async () => {
  const [lead] = await discoverMock('dentists in Austin', 1);
  const { audit, analysis } = await analyze(lead);
  assert.ok(analysis.businessName && Array.isArray(analysis.services));
  assert.ok(typeof audit.aiSeoScore === 'number');

  const website = await buildWebsite(lead, analysis);
  assert.ok(fs.existsSync(website.path));
  const html = fs.readFileSync(website.path, 'utf8');
  assert.match(html, /"@type":"LocalBusiness"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.doesNotMatch(html, /\$\{/); // no leftover template literals
  assert.doesNotMatch(html, /undefined/);

  const email = await draftEmail(lead, analysis, audit);
  assert.ok(email.subject && email.body.includes(lead.name));
  assert.match(email.body, /AI/);

  const qa = await runQA({ lead, website, email });
  assert.ok(qa.score >= 80, `expected QA>=80, got ${qa.score}: ${qa.issues.join('; ')}`);
  assert.equal(qa.passed, true);
});
