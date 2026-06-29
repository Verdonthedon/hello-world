// Run report — a single HTML dashboard summarizing the batch: each lead's
// audit score, generated site link, QA verdict, and the drafted email.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function writeReport(results, summary) {
  const rows = results.map((r) => {
    const qaColor = r.qa.passed ? '#16a34a' : '#dc2626';
    return `
    <details class="lead">
      <summary>
        <span class="biz">${esc(r.lead.name)}</span>
        <span class="meta">${esc(r.lead.category)} · ${esc([r.lead.city, r.lead.region].filter(Boolean).join(', '))}</span>
        <span class="pill" style="background:${r.audit.hasSite ? '#f59e0b' : '#dc2626'}">${r.audit.hasSite ? 'AI-SEO ' + r.audit.aiSeoScore + '/100' : 'NO SITE'}</span>
        <span class="pill" style="background:${qaColor}">QA ${r.qa.score}</span>
      </summary>
      <div class="body">
        <p><b>Opportunity:</b> ${esc(r.audit.summary)}</p>
        <p><b>Gaps:</b> ${(r.audit.gaps || []).map(esc).join(', ')}</p>
        <p><b>Generated site:</b> <a href="../${esc(path.relative(config.runtime.outputDir, r.website.path))}" target="_blank">${esc(r.website.relPath)}</a></p>
        <p><b>Contact:</b> ${esc(r.contact.email || r.contact.note)}</p>
        <p><b>QA issues:</b> ${r.qa.issues.length ? r.qa.issues.map(esc).join('; ') : 'none'}</p>
        <div class="email">
          <div class="subj">${esc(r.email.subject)}</div>
          <pre>${esc(r.email.body)}</pre>
          <div class="fw">framework: ${esc(r.email.framework)} · ${r.email.wordCount} words</div>
        </div>
      </div>
    </details>`;
  }).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LeadFlow Pro — Run Report</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:40px 20px}
  .wrap{max-width:900px;margin:0 auto}
  h1{font-size:1.8rem;margin:0 0 4px} .sub{color:#94a3b8;margin:0 0 28px}
  .kpis{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px}
  .kpi{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:16px 20px;flex:1;min-width:120px}
  .kpi b{font-size:1.8rem;display:block} .kpi span{color:#94a3b8;font-size:.85rem}
  .lead{background:#1e293b;border:1px solid #334155;border-radius:12px;margin-bottom:12px;padding:0 18px}
  summary{cursor:pointer;padding:16px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  .biz{font-weight:700} .meta{color:#94a3b8;font-size:.88rem;flex:1}
  .pill{color:#fff;font-size:.75rem;font-weight:700;padding:3px 10px;border-radius:999px}
  .body{padding:4px 0 20px;border-top:1px solid #334155;font-size:.93rem;color:#cbd5e1}
  .body a{color:#38bdf8} .email{background:#0f172a;border:1px solid #334155;border-radius:10px;padding:14px;margin-top:10px}
  .subj{font-weight:700;color:#fff;margin-bottom:8px} pre{white-space:pre-wrap;font-family:inherit;margin:0;color:#cbd5e1}
  .fw{color:#64748b;font-size:.8rem;margin-top:8px}
</style></head><body><div class="wrap">
  <h1>LeadFlow Pro — Run Report</h1>
  <p class="sub">Query: “${esc(summary.query)}” · ${esc(summary.at)}</p>
  <div class="kpis">
    <div class="kpi"><b>${summary.total}</b><span>leads processed</span></div>
    <div class="kpi"><b>${summary.sitesBuilt}</b><span>websites built</span></div>
    <div class="kpi"><b>${summary.qaPassed}</b><span>passed QA</span></div>
    <div class="kpi"><b>${summary.readyToSend}</b><span>ready to send</span></div>
    <div class="kpi"><b>${summary.avgQa}</b><span>avg QA score</span></div>
  </div>
  ${rows}
</div></body></html>`;

  const dir = path.join(config.root, config.runtime.outputDir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'report.html');
  fs.writeFileSync(file, html);
  return path.relative(config.root, file);
}

export default writeReport;
