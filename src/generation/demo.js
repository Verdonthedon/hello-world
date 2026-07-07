// Demo delivery page — the presentation wrapper the prospect actually receives.
// Frames the pitch: their problem (audit score), the proof (before/after), the
// new site (live iframe preview), and ONE action: schedule a call with us.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildDemoPage({ lead, analysis, audit, geo, websiteDir }) {
  const o = config.outreach;
  const cal = o.calendarLink;
  const before = audit.hasSite ? audit.aiSeoScore : 0;
  const after = geo.score;
  const city = lead.city || analysis.location.split(',')[0];

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Built for ${esc(lead.name)} — by ${esc(o.senderCompany)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Archivo:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--ink:#17140F;--bg:#F7F3EC;--muted:#6B6357;--accent:#8C6A3F;--bad:#B0432F;--good:#3F6D4E;--hair:rgba(23,20,15,.14)}
  *{box-sizing:border-box}body{margin:0;font-family:Archivo,sans-serif;background:var(--bg);color:var(--ink);line-height:1.65}
  h1,h2{font-family:Fraunces,serif;font-weight:600;line-height:1.06;letter-spacing:-.015em;margin:0}
  .wrap{max-width:960px;margin:0 auto;padding:0 24px}
  .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;font-weight:600;color:var(--accent)}
  header{padding:90px 0 60px}
  h1{font-size:clamp(2.2rem,5.4vw,3.6rem);max-width:18ch;margin:1rem 0 1.4rem}
  .sub{color:var(--muted);max-width:56ch;font-size:1.1rem}
  .btn{display:inline-block;background:var(--ink);color:var(--bg);font-weight:600;text-decoration:none;padding:1.05rem 2.2rem;border-radius:2px;transition:transform .2s}
  .btn:hover{transform:translateY(-2px)}
  .scores{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:56px 0}
  .score{border:1px solid var(--hair);background:#fff;padding:2rem;border-radius:4px}
  .score b{font-family:Fraunces,serif;font-size:3.4rem;display:block;line-height:1}
  .score.before b{color:var(--bad)}.score.after b{color:var(--good)}
  .score span{color:var(--muted);font-size:.92rem}
  .score ul{margin:1rem 0 0;padding-left:1.1rem;color:var(--muted);font-size:.9rem}
  section{padding:56px 0;border-top:1px solid var(--hair)}
  h2{font-size:clamp(1.5rem,3.4vw,2.2rem);margin-bottom:1rem}
  .frame{border:1px solid var(--hair);border-radius:6px;overflow:hidden;background:#fff;box-shadow:0 30px 80px rgba(23,20,15,.14);margin-top:1.8rem}
  .frame-bar{display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid var(--hair);align-items:center}
  .frame-bar i{width:10px;height:10px;border-radius:50%;background:var(--hair);display:block}
  .frame-bar em{font-style:normal;color:var(--muted);font-size:.78rem;margin-left:8px}
  iframe{width:100%;height:640px;border:0;display:block}
  .cta{background:var(--ink);color:var(--bg);text-align:center;padding:80px 24px;border-radius:8px;margin:70px auto}
  .cta h2{color:var(--bg)}
  .cta p{color:rgba(247,243,236,.75);max-width:48ch;margin:1rem auto 2rem}
  .cta .btn{background:var(--bg);color:var(--ink)}
  footer{padding:40px 0 70px;color:var(--muted);font-size:.9rem}
  @media(max-width:700px){.scores{grid-template-columns:1fr}iframe{height:480px}}
</style>
</head>
<body>
<header class="wrap">
  <p class="eyebrow">Prepared exclusively for ${esc(lead.name)}</p>
  <h1>We already built ${esc(lead.name)} a new website. Here it is.</h1>
  <p class="sub">Google and AI assistants now answer ${esc(city)} customers directly — and only recommend businesses they can read and verify. Below: where ${esc(lead.name)} stands today, and what we built to fix it. No obligation.</p>
</header>

<div class="wrap">
  <div class="scores">
    <div class="score before">
      <span>Your current AI-search readiness</span>
      <b>${before}/100</b>
      <ul>${(audit.gaps || []).slice(0, 4).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
    </div>
    <div class="score after">
      <span>The site we built for you</span>
      <b>${after}/100</b>
      <ul><li>LocalBusiness + FAQ structured data AI engines can cite</li><li>Answer-ready content for “best ${esc(analysis.category.toLowerCase())} in ${esc(city)}” queries</li><li>llms.txt + AI-crawler access configured</li><li>Custom luxury design — built for your brand only</li></ul>
    </div>
  </div>
</div>

<section><div class="wrap">
  <p class="eyebrow">Live preview</p>
  <h2>Your new website, ready to launch</h2>
  <p class="sub">This is a real, working site — designed for ${esc(lead.name)}, not a template. Scroll inside the frame.</p>
  <div class="frame">
    <div class="frame-bar"><i></i><i></i><i></i><em>${esc((lead.website || `www.${path.basename(websiteDir)}.com`).replace(/^https?:\/\//, ''))}</em></div>
    <iframe src="index.html" title="Website preview for ${esc(lead.name)}" loading="lazy"></iframe>
  </div>
</div></section>

<div class="wrap"><div class="cta" id="book">
  <h2>Want it live under your name?</h2>
  <p>Book a 15-minute call. We’ll walk through the site, tailor anything you want changed, and show you exactly how it makes ${esc(lead.name)} visible to AI search. If it’s not for you, the demo cost you nothing.</p>
  <a class="btn" href="${esc(cal)}">Schedule a Call →</a>
</div></div>

<footer class="wrap">
  <strong>${esc(o.senderName)}</strong> · ${esc(o.senderCompany)}<br>
  AI-search visibility for local businesses · This preview is private and was prepared for ${esc(lead.name)} only.
</footer>
</body>
</html>`;

  const file = path.join(websiteDir, 'demo.html');
  fs.writeFileSync(file, html);
  return { path: file, relPath: path.relative(config.root, file) };
}

export default buildDemoPage;
