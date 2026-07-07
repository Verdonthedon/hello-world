// Core unit tests — run with `npm test` (node --test). No network, no keys.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { extractJSON, slugify, seededRand } from '../src/util/helpers.js';
import { classifyWebPresence } from '../src/discovery/index.js';
import { discoverMock } from '../src/discovery/providers/mock.js';
import { resolveContact } from '../src/outreach/contact.js';
import { analyze } from '../src/analysis/analyze.js';
import { buildWebsite } from '../src/generation/website.js';
import { buildDemoPage } from '../src/generation/demo.js';
import { draftEmail } from '../src/outreach/email.js';
import { runQA } from '../src/qa/checker.js';
import { auditAiSeo } from '../src/seo/ai-seo.js';
import { pickPersonality, PERSONALITIES } from '../src/design/personalities.js';

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

test('personality selection is deterministic, category-aware, and slop-free', () => {
  const a = pickPersonality({ name: 'Bright Smile Dental', category: 'Dentist' });
  const b = pickPersonality({ name: 'Bright Smile Dental', category: 'Dentist' });
  assert.equal(a.key, b.key); // stable
  for (const p of Object.values(PERSONALITIES)) {
    // anti-slop: no banned display fonts, no purple/indigo accents
    assert.ok(!/^(Inter|Sora|Poppins|Roboto)$/i.test(p.fonts.display), `${p.key} display font banned`);
    assert.ok(!/#(6366F1|7C3AED|8B5CF6|A855F7|9333EA|4F46E5)/i.test(p.palette.accent), `${p.key} purple accent banned`);
  }
});

test('full per-lead pipeline (mock) produces a QA-passing luxury package', async () => {
  const [lead] = await discoverMock('dentists in Austin', 1);
  const { audit, analysis } = await analyze(lead);
  assert.ok(analysis.businessName && Array.isArray(analysis.services));

  const website = await buildWebsite(lead, analysis);
  assert.ok(fs.existsSync(website.path));
  const html = fs.readFileSync(website.path, 'utf8');

  // GEO instrumentation
  assert.match(html, /"@type":"LocalBusiness"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /SpeakableSpecification/);
  assert.ok(fs.existsSync(path.join(website.dir, 'llms.txt')), 'llms.txt written');
  assert.ok(fs.existsSync(path.join(website.dir, 'robots.txt')), 'robots.txt written');
  assert.match(fs.readFileSync(path.join(website.dir, 'robots.txt'), 'utf8'), /GPTBot/);

  // booking architecture
  assert.match(html, /id="book"/);
  assert.match(html, /Schedule a Call/);
  assert.match(html, /float-book/);

  // anti-slop + cleanliness
  assert.doesNotMatch(html, /\$\{/);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/);
  assert.doesNotMatch(html, /--display:\s*'(Inter|Sora|Poppins)/i);

  // GEO audit gates high
  const geo = auditAiSeo(html, { businessName: analysis.businessName });
  assert.ok(geo.score >= 85, `GEO ${geo.score}: ${geo.gaps.join('; ')}`);

  // demo page
  const demo = buildDemoPage({ lead, analysis, audit, geo, websiteDir: website.dir });
  const demoHtml = fs.readFileSync(demo.path, 'utf8');
  assert.match(demoHtml, /Schedule a Call/);
  assert.match(demoHtml, /noindex/);
  assert.ok(demoHtml.includes(lead.name));

  // 3-touch sequence
  const email = await draftEmail(lead, analysis, audit, website);
  assert.equal(email.sequence.length, 3);
  assert.ok(email.body.includes(lead.name));
  assert.match(email.body, /AI/);
  assert.ok(email.sequence[2].body.match(/clos(e|ing) the file/i), 'takeaway close present');

  // QA gate
  const qa = await runQA({ lead, website, email, geo });
  assert.ok(qa.score >= 80, `expected QA>=80, got ${qa.score}: ${qa.issues.join('; ')}`);
  assert.equal(qa.passed, true);
});

test('low ratings are suppressed from customer-facing copy', async () => {
  const lead = { id: 'x1', name: 'Test Biz', category: 'Plumber', city: 'Denver', region: 'CO',
    country: 'US', rating: 3.4, reviewCount: 40, website: null, presence: { status: 'none' } };
  const { analysis } = await analyze(lead);
  const joined = JSON.stringify(analysis.differentiators);
  assert.ok(!joined.includes('3.4'), 'sub-4.5 rating must not appear in differentiators');
});
