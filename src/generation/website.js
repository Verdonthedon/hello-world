// Website renderer — produces a single self-contained, production-grade HTML
// page: modern design (Tailwind CDN + custom CSS), scroll animations, AND deep
// AI-SEO/GEO instrumentation (JSON-LD LocalBusiness + FAQPage, full meta/OG,
// semantic headings, answer-style FAQ). Zero build step; opens in any browser.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { slugify } from '../util/helpers.js';
import { generateCopy } from './copy.js';
import { log } from '../util/log.js';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function jsonLd(lead, analysis, copy) {
  const local = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: analysis.businessName,
    description: analysis.valueProp,
    image: '',
    telephone: lead.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: lead.address || undefined,
      addressLocality: lead.city || undefined,
      addressRegion: lead.region || undefined,
      addressCountry: lead.country || undefined,
    },
    areaServed: analysis.location,
    aggregateRating: lead.rating
      ? { '@type': 'AggregateRating', ratingValue: String(lead.rating), reviewCount: String(lead.reviewCount || 0) }
      : undefined,
    makesOffer: (analysis.services || []).map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })),
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (copy.faq || []).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return [local, faq];
}

function render(lead, analysis, copy) {
  const p = analysis.palette || { primary: '#0F4C81', accent: '#2EC4B6', dark: '#0B1B2B', light: '#F7FAFC' };
  const title = `${analysis.businessName} | ${analysis.category} in ${analysis.location}`;
  const desc = `${analysis.valueProp} ${analysis.businessName} serves ${analysis.location}. ${copy.heroSub || ''}`.slice(0, 320);
  const schemas = jsonLd(lead, analysis, copy)
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s, (k, v) => (v === undefined ? undefined : v))}</script>`)
    .join('\n  ');

  const servicesHtml = (copy.services || []).map((s, i) => `
        <article class="card reveal" style="--d:${i * 0.07}s">
          <div class="card-ico">${['◆', '✦', '❖', '✺', '✷', '✸'][i % 6]}</div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.desc)}</p>
        </article>`).join('');

  const faqHtml = (copy.faq || []).map((f, i) => `
        <details class="faq reveal" style="--d:${i * 0.05}s"${i === 0 ? ' open' : ''}>
          <summary>${esc(f.q)}</summary>
          <p>${esc(f.a)}</p>
        </details>`).join('');

  const diffs = (analysis.differentiators || []).map((d) => `<li>${esc(d)}</li>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script>document.documentElement.classList.add('js')</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${esc(lead.website || `https://www.${slugify(analysis.businessName)}.com`)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <!-- Open Graph / social -->
  <meta property="og:type" content="business.business" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="theme-color" content="${p.primary}" />
  <!-- Structured data for AI / generative search engines (GEO) -->
  ${schemas}
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root{--primary:${p.primary};--accent:${p.accent};--dark:${p.dark};--light:${p.light};}
    *{box-sizing:border-box} html{scroll-behavior:smooth}
    body{margin:0;font-family:Inter,system-ui,sans-serif;color:#0f172a;background:var(--light);line-height:1.6}
    h1,h2,h3{font-family:Sora,sans-serif;line-height:1.1;letter-spacing:-.02em;margin:0}
    .wrap{max-width:1120px;margin:0 auto;padding:0 24px}
    a{color:inherit}
    /* nav */
    nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(12px);background:rgba(255,255,255,.72);border-bottom:1px solid rgba(0,0,0,.06)}
    .nav-in{display:flex;align-items:center;justify-content:space-between;height:68px}
    .brand{font-family:Sora;font-weight:800;font-size:1.15rem;color:var(--primary)}
    .nav-cta{background:var(--primary);color:#fff;padding:.6rem 1.1rem;border-radius:999px;font-weight:600;text-decoration:none;font-size:.9rem;transition:transform .2s}
    .nav-cta:hover{transform:translateY(-2px)}
    /* hero */
    .hero{position:relative;overflow:hidden;background:
      radial-gradient(1200px 600px at 80% -10%, color-mix(in srgb,var(--accent) 35%, transparent), transparent),
      linear-gradient(160deg,var(--dark),var(--primary));color:#fff;padding:120px 0 130px}
    .hero .badge{display:inline-flex;gap:.5rem;align-items:center;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:.4rem .9rem;border-radius:999px;font-size:.82rem;font-weight:600;margin-bottom:1.4rem}
    .hero h1{font-size:clamp(2.4rem,6vw,4rem);max-width:16ch}
    .hero p.sub{font-size:clamp(1.05rem,2vw,1.3rem);max-width:54ch;margin:1.4rem 0 2rem;color:rgba(255,255,255,.86)}
    .btn{display:inline-block;background:var(--accent);color:var(--dark);font-weight:700;padding:1rem 1.8rem;border-radius:14px;text-decoration:none;box-shadow:0 12px 30px rgba(0,0,0,.25);transition:transform .2s,box-shadow .2s}
    .btn:hover{transform:translateY(-3px);box-shadow:0 18px 40px rgba(0,0,0,.32)}
    .btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35);box-shadow:none;margin-left:.8rem}
    .stats{display:flex;gap:2.5rem;margin-top:3rem;flex-wrap:wrap}
    .stats b{font-family:Sora;font-size:1.8rem;display:block}
    .stats span{color:rgba(255,255,255,.7);font-size:.9rem}
    /* sections */
    section{padding:88px 0}
    .eyebrow{color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:.8rem}
    h2.title{font-size:clamp(1.8rem,4vw,2.6rem);margin:.5rem 0 1rem;max-width:20ch}
    .lead{color:#475569;font-size:1.1rem;max-width:60ch}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px;margin-top:2.5rem}
    .card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:18px;padding:28px;box-shadow:0 6px 24px rgba(15,23,42,.05);transition:transform .25s,box-shadow .25s}
    .card:hover{transform:translateY(-6px);box-shadow:0 18px 44px rgba(15,23,42,.12)}
    .card-ico{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--primary) 12%,transparent);color:var(--primary);font-size:1.3rem;margin-bottom:1rem}
    .card h3{font-size:1.15rem;margin-bottom:.5rem}
    .card p{color:#64748b;font-size:.96rem;margin:0}
    .about{background:var(--dark);color:#fff}
    .about .lead{color:rgba(255,255,255,.8)}
    .about ul{list-style:none;padding:0;margin:1.6rem 0 0;display:flex;flex-wrap:wrap;gap:.8rem}
    .about li{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);padding:.5rem 1rem;border-radius:999px;font-size:.9rem;font-weight:600}
    .faq{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:14px;padding:0 22px;margin-bottom:14px;overflow:hidden}
    .faq summary{cursor:pointer;font-family:Sora;font-weight:700;padding:20px 0;list-style:none;font-size:1.05rem}
    .faq summary::-webkit-details-marker{display:none}
    .faq[open] summary{color:var(--primary)}
    .faq p{margin:0 0 20px;color:#475569}
    .cta-band{background:linear-gradient(120deg,var(--primary),var(--accent));color:#fff;text-align:center;border-radius:28px;padding:64px 24px;margin:40px auto}
    .cta-band h2{font-size:clamp(1.8rem,4vw,2.6rem)}
    footer{background:var(--dark);color:rgba(255,255,255,.7);padding:48px 0;font-size:.92rem}
    footer .brand{color:#fff}
    /* Progressive enhancement: content is fully visible by default; we only
       hide + animate once JS confirms it can observe scroll (html.js). */
    .js .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease var(--d,0s),transform .7s ease var(--d,0s)}
    .js .reveal.in{opacity:1;transform:none}
    @media(max-width:640px){.btn.ghost{margin:.8rem 0 0;display:block;text-align:center}}
  </style>
</head>
<body>
  <nav><div class="wrap nav-in">
    <span class="brand">${esc(analysis.businessName)}</span>
    <a class="nav-cta" href="#contact">${esc(copy.heroCta || 'Get Started')}</a>
  </div></nav>

  <header class="hero"><div class="wrap">
    <span class="badge">✦ AI-Search Optimized · ${esc(analysis.location)}</span>
    <h1>${esc(copy.heroHeadline)}</h1>
    <p class="sub">${esc(copy.heroSub)}</p>
    <a class="btn" href="#contact">${esc(copy.heroCta || 'Get Started')}</a>
    <a class="btn ghost" href="#services">See What We Do</a>
    <div class="stats">
      <div><b>${lead.rating ? lead.rating + '★' : 'Top-Rated'}</b><span>${lead.reviewCount ? lead.reviewCount + ' reviews' : 'Trusted locally'}</span></div>
      <div><b>${esc(analysis.location.split(',')[0] || 'Local')}</b><span>Proudly serving the area</span></div>
      <div><b>AI-Ready</b><span>Built to be found by AI search</span></div>
    </div>
  </div></header>

  <section id="services"><div class="wrap">
    <span class="eyebrow">What we do</span>
    <h2 class="title">Services built around what you actually need</h2>
    <p class="lead">${esc(analysis.valueProp)}</p>
    <div class="grid">${servicesHtml}</div>
  </div></section>

  <section class="about" id="about"><div class="wrap">
    <span class="eyebrow" style="color:var(--accent)">Why us</span>
    <h2 class="title reveal">${esc(copy.aboutTitle)}</h2>
    <p class="lead reveal" style="--d:.08s">${esc(copy.aboutBody)}</p>
    <ul class="reveal" style="--d:.16s">${diffs}</ul>
  </div></section>

  <section id="faq"><div class="wrap">
    <span class="eyebrow">Answers</span>
    <h2 class="title">Questions customers (and AI assistants) ask</h2>
    <p class="lead">Clear, quotable answers — written so AI search engines surface ${esc(analysis.businessName)} when locals ask.</p>
    <div style="margin-top:2.5rem">${faqHtml}</div>
  </div></section>

  <section id="contact"><div class="wrap">
    <div class="cta-band">
      <h2>${esc(copy.heroCta || 'Ready to get started?')}</h2>
      <p style="max-width:48ch;margin:1rem auto 2rem;opacity:.92">Reach out today — we respond fast and we'd love to help.</p>
      ${lead.phone ? `<a class="btn" style="background:#fff;color:var(--primary)" href="tel:${esc(lead.phone)}">Call ${esc(lead.phone)}</a>` : `<a class="btn" style="background:#fff;color:var(--primary)" href="#">Request a Quote</a>`}
    </div>
  </div></section>

  <footer><div class="wrap">
    <span class="brand">${esc(analysis.businessName)}</span>
    <p style="margin:.6rem 0 0">${esc(analysis.location)}${lead.phone ? ' · ' + esc(lead.phone) : ''}</p>
    <p style="margin:.4rem 0 0;opacity:.6">© ${new Date().getFullYear()} ${esc(analysis.businessName)}. Built with AI-search optimization by LeadFlow Pro.</p>
  </div></footer>

  <script>
    const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
    document.querySelectorAll('#services .card').forEach(el=>el.classList.add('reveal'));
  </script>
</body>
</html>`;
}

export async function buildWebsite(lead, analysis) {
  const copy = await generateCopy(lead, analysis);
  const html = render(lead, analysis, copy);
  const outDir = path.join(config.root, config.runtime.outputDir, slugify(analysis.businessName));
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'index.html');
  fs.writeFileSync(file, html);
  log.ok(`Website built → ${path.relative(config.root, file)} (${(html.length / 1024).toFixed(0)} KB)`);
  return { path: file, relPath: path.relative(config.root, file), copy, bytes: html.length };
}

export default buildWebsite;
