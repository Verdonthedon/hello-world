// The autonomous pipeline. For a discovery query it runs, per lead:
//   discover → analyze (+audit) → generate website → resolve contact →
//   draft email → QA gate → enqueue.
// Everything persists to the store so runs are resumable and auditable.
import { config } from './config.js';
import { clamp } from './util/helpers.js';
import { log } from './util/log.js';
import { db } from './store/db.js';
import fs from 'node:fs';
import { discover } from './discovery/index.js';
import { analyze } from './analysis/analyze.js';
import { buildWebsite } from './generation/website.js';
import { buildDemoPage } from './generation/demo.js';
import { auditAiSeo } from './seo/ai-seo.js';
import { resolveContact } from './outreach/contact.js';
import { draftEmail } from './outreach/email.js';
import { enqueue } from './outreach/queue.js';
import { runQA } from './qa/checker.js';
import { writeReport } from './report.js';

export async function processLead(lead) {
  log.title(`${lead.name} — ${lead.category} · ${[lead.city, lead.region].filter(Boolean).join(', ')}`);
  db.upsertLead(lead);

  // 1. Analyze + audit
  const { audit, analysis } = await analyze(lead);
  db.upsertLead({ id: lead.id, audit, analysis });

  // 2. Generate the website (luxury personality + GEO instrumentation)
  const website = await buildWebsite(lead, analysis);

  // 3. AI-SEO / GEO audit of our own output (the after-score, and a hard gate)
  const geo = auditAiSeo(fs.readFileSync(website.path, 'utf8'), { businessName: analysis.businessName });
  log.detail(`GEO score: ${geo.score}/100${geo.gaps.length ? ` (gaps: ${geo.gaps.slice(0, 2).join('; ')})` : ''}`);

  // 4. Demo delivery page — the artifact the prospect receives
  const demo = buildDemoPage({ lead, analysis, audit, geo, websiteDir: website.dir });
  db.upsertLead({ id: lead.id, website: { path: website.path, relPath: website.relPath, bytes: website.bytes, personality: website.personality }, geo: { score: geo.score, gaps: geo.gaps }, demo: { relPath: demo.relPath } });

  // 5. Resolve contact
  const contact = resolveContact(lead);
  log.detail(`contact: ${contact.email || contact.note}`);

  // 6. Draft the 3-touch outreach sequence
  const email = await draftEmail(lead, analysis, audit, website);
  log.detail(`sequence: ${email.sequence.length} touches, T1 "${email.subject}" (${email.wordCount} words)`);

  // 7. QA gate (design contract + email + personalization + GEO)
  const qa = await runQA({ lead, website, email, geo });

  // 8. Enqueue (draft-only). Marked needs_contact if no address yet.
  const queued = enqueue({
    leadId: lead.id,
    business: lead.name,
    to: contact.email,
    toConfidence: contact.confidence,
    subject: email.subject,
    body: email.body,
    framework: email.framework,
    sequence: email.sequence,
    websitePreview: website.relPath,
    demoPreview: demo.relPath,
    qaScore: qa.score,
  });

  db.upsertLead({
    id: lead.id,
    contact,
    email: { subject: email.subject, body: email.body, framework: email.framework, wordCount: email.wordCount, sequence: email.sequence },
    qa,
    status: qa.passed ? (contact.email ? 'ready_for_review' : 'needs_contact') : 'qa_failed',
  });

  return { lead, audit, analysis, website, geo, demo, contact, email, qa, queued };
}

export async function runPipeline({ query, limit = 10, mock = false }) {
  const cap = clamp(limit, 1, config.runtime.maxLeads);
  if (cap < limit) log.warn(`limit ${limit} exceeds MAX_LEADS_PER_RUN — capped at ${cap}`);

  log.title(`LeadFlow Pro — run started`);
  log.info(`query="${query}" limit=${cap} mode=${mock ? 'mock' : 'auto'}`);

  const leads = await discover({ query, limit: cap, mock });
  const results = [];
  for (const lead of leads) {
    try {
      results.push(await processLead(lead));
    } catch (e) {
      log.err(`lead ${lead.name} failed: ${e.message}`);
    }
  }

  const summary = {
    query,
    at: new Date().toISOString(),
    total: results.length,
    qaPassed: results.filter((r) => r.qa.passed).length,
    sitesBuilt: results.filter((r) => r.website?.path).length,
    readyToSend: results.filter((r) => r.qa.passed && r.contact.email).length,
    needsContact: results.filter((r) => !r.contact.email).length,
    avgQa: results.length ? Math.round(results.reduce((a, r) => a + r.qa.score, 0) / results.length) : 0,
  };
  db.recordRun(summary);

  const reportPath = writeReport(results, summary);
  log.title('Run complete');
  log.ok(`${summary.total} leads · ${summary.sitesBuilt} sites built · ${summary.qaPassed} passed QA · ${summary.readyToSend} ready to send · avg QA ${summary.avgQa}/100`);
  log.ok(`Report → ${reportPath}`);
  return { results, summary, reportPath };
}

export default runPipeline;
