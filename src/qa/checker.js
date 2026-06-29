// Quality Assurance checker. Gates every deliverable before it's marked ready.
// Deterministic structural checks (always run) + optional LLM second opinion
// from the partner model. Returns a 0-100 score and pass/fail vs threshold.
import fs from 'node:fs';
import { config } from '../config.js';
import { dualComplete } from '../llm/router.js';
import { clamp } from '../util/helpers.js';
import { log } from '../util/log.js';

const BANNED = ['i hope this email finds you well', 'dear sir', 'to whom it may concern', 'synergy', 'cutting-edge solutions', 'world-class', 'leverage our'];

function checkWebsite(websiteResult) {
  const issues = [];
  let score = 100;
  const deduct = (n, msg) => { score -= n; issues.push(msg); };
  if (!websiteResult?.path || !fs.existsSync(websiteResult.path)) {
    return { score: 0, issues: ['website file missing'], checks: {} };
  }
  const html = fs.readFileSync(websiteResult.path, 'utf8');
  const checks = {
    hasTitle: /<title[^>]*>[^<]{8,}<\/title>/i.test(html),
    hasMetaDesc: /name=["']description["'][^>]+content=["'][^"']{40,}/i.test(html),
    hasViewport: /name=["']viewport["']/i.test(html),
    hasLocalBusinessSchema: /"@type"\s*:\s*"LocalBusiness"/i.test(html),
    hasFaqSchema: /"@type"\s*:\s*"FAQPage"/i.test(html),
    hasOpenGraph: /property=["']og:title["']/i.test(html),
    hasH1: /<h1[^>]*>[^<]{5,}/i.test(html),
    hasMultipleSections: (html.match(/<section/gi) || []).length >= 3,
    hasContactCta: /href=["']tel:|#contact/i.test(html),
    substantialContent: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').length > 1200,
    noEmptyPlaceholders: !/(undefined|\[object Object\]|null,|NaN)/.test(html.replace(/null,/g, '')),
    noBrokenTemplate: !/\$\{/.test(html),
  };
  const penalties = {
    hasTitle: 8, hasMetaDesc: 10, hasViewport: 6, hasLocalBusinessSchema: 16,
    hasFaqSchema: 12, hasOpenGraph: 6, hasH1: 6, hasMultipleSections: 8,
    hasContactCta: 8, substantialContent: 8, noEmptyPlaceholders: 6, noBrokenTemplate: 6,
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
  const checks = {
    hasSubject: !!email.subject && email.subject.length > 8,
    lengthInRange: wc >= 90 && wc <= 220,
    mentionsAiSearch: /(ai search|ai assistant|ai overview|chatgpt|perplexity|gemini|ai-native|generative)/i.test(email.body),
    hasCta: /(call|reply|book|15-min|preview|chat|slot|schedule)/i.test(email.body),
    hasSignature: /—|regards|cheers|thanks|best,/i.test(email.body),
    hasPs: /p\.s\./i.test(email.body),
    noBannedPhrases: !BANNED.some((b) => body.includes(b)),
    notAllCapsSpam: (email.subject.match(/[A-Z]/g) || []).length < email.subject.length * 0.6,
  };
  const penalties = { hasSubject: 12, lengthInRange: 14, mentionsAiSearch: 14, hasCta: 14, hasSignature: 8, hasPs: 6, noBannedPhrases: 18, notAllCapsSpam: 8 };
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

export async function runQA({ lead, website, email }) {
  const web = checkWebsite(website);
  const mail = checkEmail(email);
  const pers = checkPersonalization(lead, email);

  // weighted blend of structural checks
  let composite = Math.round(web.score * 0.4 + mail.score * 0.4 + pers.score * 0.2);
  const allIssues = [...web.issues, ...mail.issues, ...pers.issues];

  const second = await llmSecondOpinion(lead, website, email);
  if (second) {
    // blend in the partner opinion at 25% weight
    composite = Math.round(composite * 0.75 + second.score * 0.25);
  }

  const threshold = config.runtime.qaThreshold;
  const passed = composite >= threshold;
  const result = {
    score: composite,
    passed,
    threshold,
    breakdown: { website: web.score, email: mail.score, personalization: pers.score, partnerOpinion: second?.score ?? null },
    issues: allIssues,
    topFixes: allIssues.slice(0, 3),
    partnerVerdict: second?.opinions || null,
  };
  log[passed ? 'ok' : 'warn'](`QA ${lead.name}: ${composite}/100 (threshold ${threshold}) — ${passed ? 'PASS' : 'NEEDS WORK'}${allIssues.length ? ` · ${allIssues.length} issue(s)` : ''}`);
  return result;
}

export default runQA;
