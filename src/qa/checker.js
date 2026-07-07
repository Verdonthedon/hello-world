// Quality Assurance checker. Gates every deliverable before it's marked ready.
// Enforces BOTH skills: the luxury-web-design anti-slop contract and the
// ai-seo-geo audit, plus email/sequence quality and personalization.
// Deterministic structural checks always run; optional LLM second opinion
// from the partner model(s) blends in when keys are present.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { dualComplete } from '../llm/router.js';
import { clamp } from '../util/helpers.js';
import { log } from '../util/log.js';

const BANNED_PHRASES = ['i hope this email finds you well', 'dear sir', 'to whom it may concern', 'synergy', 'cutting-edge solutions', 'world-class', 'leverage our'];

// Anti-AI-slop fingerprints (see .claude/skills/luxury-web-design).
const SLOP_DISPLAY_FONTS = /--display:\s*'?(Inter|Sora|Poppins|Roboto)\b/i;
const SLOP_PURPLE = /#(6366F1|7C3AED|8B5CF6|A855F7|9333EA|4F46E5|818CF8)/i;
const SLOP_PURPLE_GRADIENT = /linear-gradient\([^)]*(purple|violet|indigo)/i;

function checkWebsite(websiteResult) {
  const issues = [];
  let score = 100;
  const deduct = (n, msg) => { score -= n; issues.push(msg); };
  if (!websiteResult?.path || !fs.existsSync(websiteResult.path)) {
    return { score: 0, issues: ['website file missing'], checks: {} };
  }
  const html = fs.readFileSync(websiteResult.path, 'utf8');
  const dir = path.dirname(websiteResult.path);
  const checks = {
    // structure & seo basics
    hasTitle: /<title[^>]*>[^<]{8,}<\/title>/i.test(html),
    hasMetaDesc: /name=["']description["'][^>]+content=["'][^"']{40,}/i.test(html),
    hasViewport: /name=["']viewport["']/i.test(html),
    hasLocalBusinessSchema: /"@type"\s*:\s*"LocalBusiness"/i.test(html),
    hasFaqSchema: /"@type"\s*:\s*"FAQPage"/i.test(html),
    hasH1: /<h1[^>]*>/i.test(html),
    hasMultipleSections: (html.match(/<section/gi) || []).length >= 3,
    substantialContent: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').length > 1500,
    noEmptyPlaceholders: !/undefined|\[object Object\]|NaN/.test(html.replace(/"undefined"/g, '')),
    noBrokenTemplate: !/\$\{/.test(html),
    // conversion architecture
    hasBookingSection: /id=["']book["']/.test(html),
    hasScheduleCta: /Schedule a Call/i.test(html),
    hasFloatingBook: /float-book/.test(html),
    // luxury / anti-slop contract
    hasPersonalityTokens: /--display:/.test(html) && /--hairline:/.test(html),
    noSlopDisplayFont: !SLOP_DISPLAY_FONTS.test(html),
    noPurpleGradient: !SLOP_PURPLE.test(html) && !SLOP_PURPLE_GRADIENT.test(html),
    hasNoiseTexture: /fractalNoise/.test(html),
    // GEO artifacts beside the page
    hasLlmsTxt: fs.existsSync(path.join(dir, 'llms.txt')),
    hasRobotsTxt: fs.existsSync(path.join(dir, 'robots.txt')),
    hasDemoPage: fs.existsSync(path.join(dir, 'demo.html')),
  };
  const penalties = {
    hasTitle: 6, hasMetaDesc: 6, hasViewport: 4, hasLocalBusinessSchema: 10,
    hasFaqSchema: 8, hasH1: 4, hasMultipleSections: 5, substantialContent: 6,
    noEmptyPlaceholders: 6, noBrokenTemplate: 6,
    hasBookingSection: 10, hasScheduleCta: 10, hasFloatingBook: 4,
    hasPersonalityTokens: 6, noSlopDisplayFont: 8, noPurpleGradient: 8,
    hasNoiseTexture: 3, hasLlmsTxt: 6, hasRobotsTxt: 4, hasDemoPage: 6,
  };
  for (const [k, ok] of Object.entries(checks)) if (!ok) deduct(penalties[k], `website: failed ${k}`);
  return { score: clamp(score, 0, 100), issues, checks };
}

function checkEmail(email) {
  const issues = [];
  let score = 100;
  const deduct = (n, msg) => { score -= n; issues.push(msg); };
  if (!email?.body) return { score: 0, issues: ['email body missing'], checks: {} };
  const body = email.body.toLowerCase();
  const wc = email.wordCount || email.body.split(/\s+/).length;
  const seq = email.sequence || [];
  const checks = {
    hasSubject: !!email.subject && email.subject.length > 8,
    lengthInRange: wc >= 90 && wc <= 260,
    mentionsAiSearch: /(ai search|ai assistant|ai overview|chatgpt|perplexity|gemini|ai-native|ai engines|generative)/i.test(email.body),
    hasBookingLink: email.body.includes(config.outreach.calendarLink) || /book|schedule|15 minutes|15-min/i.test(email.body),
    hasDemoLink: /demo|preview|see it here/i.test(email.body),
    hasSignature: /—|regards|cheers|thanks|best,/i.test(email.body),
    hasPs: /p\.s\./i.test(email.body),
    noBannedPhrases: !BANNED_PHRASES.some((b) => body.includes(b)),
    notAllCapsSpam: (email.subject.match(/[A-Z]/g) || []).length < email.subject.length * 0.6,
    fullSequence: seq.length >= 3,
    sequenceHasTakeaway: seq.some((t) => /clos(e|ing) the file|takeaway/i.test((t.framework || '') + ' ' + (t.subject || '') + ' ' + (t.body || ''))),
    followupsAreShort: seq.slice(1).every((t) => (t.body || '').split(/\s+/).length <= 130),
  };
  const penalties = {
    hasSubject: 10, lengthInRange: 10, mentionsAiSearch: 12, hasBookingLink: 12,
    hasDemoLink: 10, hasSignature: 6, hasPs: 4, noBannedPhrases: 14,
    notAllCapsSpam: 6, fullSequence: 10, sequenceHasTakeaway: 4, followupsAreShort: 4,
  };
  for (const [k, ok] of Object.entries(checks)) if (!ok) deduct(penalties[k], `email: failed ${k}`);
  return { score: clamp(score, 0, 100), issues, checks };
}

function checkPersonalization(lead, email) {
  const issues = [];
  let score = 100;
  if (!email?.body) return { score: 0, issues: ['no email to check'], checks: {} };
  const hasName = email.body.includes(lead.name) || email.subject?.includes(lead.name);
  const hasCity = lead.city ? email.body.includes(lead.city) : true;
  if (!hasName) { score -= 50; issues.push('email: business name not present (generic)'); }
  if (!hasCity) { score -= 20; issues.push('email: city not referenced'); }
  return { score: clamp(score, 0, 100), issues, checks: { hasName, hasCity } };
}

// Optional: ask the partner model(s) for an independent 0-100 score.
async function llmSecondOpinion(lead, website, email) {
  try {
    const res = await dualComplete({
      system: 'You are a meticulous QA reviewer for a high-ticket web agency. Score deliverables honestly.',
      prompt: `Rate this outreach package for ${lead.name} (${lead.category}).
EMAIL SUBJECT: ${email.subject}
EMAIL BODY: ${email.body}
WEBSITE COPY HEADLINE: ${website?.copy?.heroHeadline || 'n/a'}
Return JSON: {"score": 0-100, "verdict": "...", "topFix": "..."}`,
      json: true,
      maxTokens: 300,
    });
    const scores = Object.values(res).filter((r) => r && typeof r.score === 'number');
    if (!scores.length) return null;
    return {
      score: Math.round(scores.reduce((a, r) => a + r.score, 0) / scores.length),
      opinions: res,
    };
  } catch {
    return null;
  }
}

export async function runQA({ lead, website, email, geo }) {
  const web = checkWebsite(website);
  const mail = checkEmail(email);
  const pers = checkPersonalization(lead, email);
  const geoScore = geo?.score ?? null;

  // weighted blend: design/structure 32%, email 30%, personalization 14%, GEO 24%
  let composite = geoScore === null
    ? Math.round(web.score * 0.45 + mail.score * 0.38 + pers.score * 0.17)
    : Math.round(web.score * 0.32 + mail.score * 0.3 + pers.score * 0.14 + geoScore * 0.24);
  const allIssues = [...web.issues, ...mail.issues, ...pers.issues, ...(geo?.gaps || []).map((g) => `geo: ${g}`)];

  const second = await llmSecondOpinion(lead, website, email);
  if (second) {
    composite = Math.round(composite * 0.75 + second.score * 0.25);
  }

  const threshold = config.runtime.qaThreshold;
  const passed = composite >= threshold;
  const result = {
    score: composite,
    passed,
    threshold,
    breakdown: { website: web.score, email: mail.score, personalization: pers.score, geo: geoScore, partnerOpinion: second?.score ?? null },
    issues: allIssues,
    topFixes: allIssues.slice(0, 3),
    partnerVerdict: second?.opinions || null,
  };
  log[passed ? 'ok' : 'warn'](`QA ${lead.name}: ${composite}/100 (web ${web.score} · email ${mail.score} · geo ${geoScore ?? '—'}) — ${passed ? 'PASS' : 'NEEDS WORK'}${allIssues.length ? ` · ${allIssues.length} issue(s)` : ''}`);
  return result;
}

export default runQA;
