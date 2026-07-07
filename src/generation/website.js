// Luxury website renderer — implements .claude/skills/luxury-web-design +
// .claude/skills/ai-seo-geo. Produces a single self-contained HTML page with:
//   • a per-brand design personality (fonts, palette, layout variants) so no
//     two clients receive the same design and nothing reads "AI-built"
//   • editorial-scale typography, asymmetric layouts, noise texture, hairlines
//   • full GEO instrumentation (JSON-LD stack, speakable, definition-first)
//   • booking architecture: sticky nav CTA, #book section, floating button
// Zero build step; complete with JS disabled (reveal animations are additive).
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { slugify } from '../util/helpers.js';
import { generateCopy } from './copy.js';
import { pickPersonality, NOISE_DATA_URI, googleFontsHref } from '../design/personalities.js';
import { buildSchemas, writeGeoArtifacts, canonicalUrl } from '../seo/ai-seo.js';
import { log } from '../util/log.js';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- section builders (variant-aware) ---------- */

function heroHtml(p, lead, analysis, copy) {
  const meta = `
      <div class="hero-meta">
        <p class="eyebrow">${esc(analysis.category)} — ${esc(analysis.location)}</p>
        <p class="hero-def definition">${esc(copy.definition)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="#book">${esc(copy.heroCta)}</a>
          ${lead.phone ? `<a class="btn quiet" href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>` : ''}
        </div>
      </div>`;

  if (p.hero === 'editorial-split') {
    return `
  <header class="hero split">
    <div class="wrap hero-grid">
      <div class="hero-main">
        <h1 class="hero-h1">${esc(copy.heroHeadline)}</h1>
        <p class="hero-sub">${esc(copy.heroSub)}</p>
      </div>
      ${meta}
    </div>
    <div class="hero-rule" aria-hidden="true"></div>
  </header>`;
  }
  if (p.hero === 'fullbleed-center') {
    return `
  <header class="hero fullbleed">
    <div class="wrap center">
      <p class="eyebrow">${esc(analysis.category)} · ${esc(analysis.location)}</p>
      <h1 class="hero-h1">${esc(copy.heroHeadline)}</h1>
      <p class="hero-sub">${esc(copy.heroSub)}</p>
      <div class="hero-actions center-actions">
        <a class="btn primary" href="#book">${esc(copy.heroCta)}</a>
        ${lead.phone ? `<a class="btn quiet" href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>` : ''}
      </div>
      <p class="hero-def definition">${esc(copy.definition)}</p>
    </div>
  </header>`;
  }
  // stacked-oversize
  const words = copy.heroHeadline.split(' ');
  const mid = Math.ceil(words.length / 2);
  return `
  <header class="hero stacked">
    <div class="wrap">
      <p class="eyebrow">${esc(analysis.category)} — ${esc(analysis.location)}</p>
      <h1 class="hero-h1"><span>${esc(words.slice(0, mid).join(' '))}</span><span class="ln2">${esc(words.slice(mid).join(' '))}</span></h1>
      <div class="stack-row">
        <p class="hero-sub">${esc(copy.heroSub)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="#book">${esc(copy.heroCta)}</a>
          ${lead.phone ? `<a class="btn quiet" href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>` : ''}
        </div>
      </div>
      <p class="hero-def definition">${esc(copy.definition)}</p>
    </div>
  </header>`;
}

function marqueeHtml(analysis) {
  const items = [...(analysis.services || []).map((s) => (typeof s === 'string' ? s : s.name)), analysis.location, 'By appointment'];
  const seq = items.map((i) => `<span>${esc(i)}</span><span class="dot" aria-hidden="true">·</span>`).join('');
  return `
  <div class="marquee" aria-hidden="true"><div class="marquee-track">${seq}${seq}</div></div>`;
}

function servicesHtml(p, analysis, copy) {
  const items = copy.services || [];
  let inner = '';
  if (p.services === 'numbered') {
    inner = `<ol class="svc-index">` + items.map((s, i) => `
      <li class="svc-row reveal" style="--d:${i * 0.06}s">
        <span class="svc-num">${String(i + 1).padStart(2, '0')}</span>
        <div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>
      </li>`).join('') + `</ol>`;
  } else if (p.services === 'alternating') {
    inner = items.map((s, i) => `
      <div class="svc-alt ${i % 2 ? 'flip' : ''} reveal" style="--d:${i * 0.05}s">
        <h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
      </div>`).join('');
  } else if (p.services === 'grid-lines') {
    inner = `<div class="svc-grid">` + items.map((s, i) => `
      <div class="svc-cell reveal" style="--d:${i * 0.05}s">
        <span class="svc-num">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
      </div>`).join('') + `</div>`;
  } else { // cards-offset
    inner = `<div class="svc-cards">` + items.map((s, i) => `
      <article class="svc-card ${i % 2 ? 'down' : ''} reveal" style="--d:${i * 0.06}s">
        <h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
      </article>`).join('') + `</div>`;
  }
  return `
  <section id="services" class="section">
    <div class="wrap">
      <p class="eyebrow">What we do</p>
      <h2 class="title">Services, done the way ${esc(analysis.location.split(',')[0])} deserves</h2>
      ${inner}
    </div>
  </section>`;
}

function statBandHtml(copy) {
  return `
  <section class="statband" aria-label="Highlights">
    <div class="wrap stat-row">
      ${(copy.stats || []).map((s) => `<div class="stat"><b>${esc(s.n)}</b><span>${esc(s.label)}</span></div>`).join('')}
    </div>
  </section>`;
}

function aboutHtml(analysis, copy) {
  return `
  <section id="about" class="section alt">
    <div class="wrap about-grid">
      <div>
        <p class="eyebrow">Why us</p>
        <h2 class="title">${esc(copy.aboutTitle)}</h2>
      </div>
      <div>
        <p class="lead">${esc(copy.aboutBody)}</p>
        <ul class="diff-list">${(analysis.differentiators || []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
      </div>
    </div>
  </section>`;
}

function testimonialHtml(copy) {
  if (!copy.testimonial?.quote) return '';
  return `
  <section class="quote-block" aria-label="Testimonial">
    <div class="wrap">
      <blockquote>
        <p class="quote">“${esc(copy.testimonial.quote)}”</p>
        <cite>— ${esc(copy.testimonial.who)}</cite>
      </blockquote>
    </div>
  </section>`;
}

function faqHtml(analysis, copy) {
  return `
  <section id="faq" class="section">
    <div class="wrap faq-grid">
      <div>
        <p class="eyebrow">Answers</p>
        <h2 class="title">Questions ${esc(analysis.location.split(',')[0])} asks</h2>
        <p class="lead">Straight answers — written so both neighbors and AI assistants can quote them.</p>
      </div>
      <div class="faq-col">
        ${(copy.faq || []).map((f, i) => `
        <details class="faq"${i === 0 ? ' open' : ''}>
          <summary><h3>${esc(f.q)}</h3></summary>
          <p class="faq-a">${esc(f.a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>`;
}

function bookHtml(lead, analysis, copy) {
  return `
  <section id="book" class="section book">
    <div class="wrap book-inner">
      <p class="eyebrow">Booking</p>
      <h2 class="title">${esc(copy.bookTitle)}</h2>
      <p class="lead">${esc(copy.bookBody)}</p>
      <div class="book-actions">
        <a class="btn primary big" href="${lead.phone ? `tel:${esc(lead.phone)}` : '#contact'}" data-book="call">Schedule a Call</a>
        ${lead.phone ? `<span class="book-alt">or call directly: <a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a></span>` : ''}
      </div>
      <p class="book-note">Response within one business day — usually much faster.</p>
    </div>
  </section>`;
}

/* ---------- page assembly ---------- */

function render(lead, analysis, copy, p) {
  const pal = p.palette;
  const url = canonicalUrl(lead, analysis);
  const title = `${analysis.businessName} | ${analysis.category} in ${analysis.location}`;
  const desc = `${copy.definition} ${copy.heroSub}`.slice(0, 330);
  const schemas = buildSchemas({ lead, analysis, copy, url })
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');
  const city = analysis.location.split(',')[0];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script>document.documentElement.classList.add('js')</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${esc(url)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta property="og:type" content="business.business" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="${pal.accent}" />
  ${schemas}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${googleFontsHref(p)}" rel="stylesheet" />
  <style>
    :root{
      --bg:${pal.bg};--surface:${pal.surface};--ink:${pal.ink};--muted:${pal.muted};
      --accent:${pal.accent};--accent-ink:${pal.accentInk};--dark:${pal.dark};
      --dark-text:${pal.darkText};--hairline:${pal.hairline};--radius:${p.radius};
      --display:${p.fonts.displayStack};--body:${p.fonts.bodyStack};
    }
    *{box-sizing:border-box}html{scroll-behavior:smooth}
    body{margin:0;font-family:var(--body);color:var(--ink);background:var(--bg);line-height:1.65;font-size:17px;-webkit-font-smoothing:antialiased;position:relative}
    body::after{content:'';position:fixed;inset:0;pointer-events:none;background-image:${NOISE_DATA_URI};z-index:999}
    h1,h2,h3{font-family:var(--display);font-weight:${p.fonts.display === 'Anton' || p.fonts.display === 'DM Serif Display' || p.fonts.display === 'Marcellus' ? 400 : 600};line-height:1.04;letter-spacing:${p.fonts.display === 'Anton' ? '.01em' : '-.015em'};margin:0}
    a{color:inherit}
    .wrap{max-width:1180px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}
    .eyebrow{font-family:var(--body);text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;font-weight:600;color:var(--accent);margin:0 0 1.1rem}
    .title{font-size:clamp(2rem,4.4vw,3.2rem);max-width:22ch;margin-bottom:1.2rem}
    .lead{color:var(--muted);font-size:1.08rem;max-width:58ch}
    .section{padding:clamp(84px,11vw,150px) 0}
    .section.alt{background:var(--surface);border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline)}

    /* nav */
    nav{position:sticky;top:0;z-index:60;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--hairline)}
    .nav-in{display:flex;align-items:center;justify-content:space-between;height:72px}
    .brand{font-family:var(--display);font-size:1.2rem;letter-spacing:.01em}
    .nav-links{display:flex;gap:2rem;align-items:center;font-size:.92rem}
    .nav-links a{text-decoration:none;color:var(--muted)}
    .nav-links a:hover{color:var(--ink)}
    @media(max-width:760px){.nav-links a:not(.btn){display:none}}

    /* buttons */
    .btn{display:inline-block;font-family:var(--body);font-weight:600;font-size:.95rem;text-decoration:none;padding:.9rem 1.7rem;border-radius:${p.buttonStyle === 'pill' ? '999px' : 'var(--radius)'};transition:transform .25s ease,opacity .25s ease;letter-spacing:.02em}
    .btn.primary{background:var(--accent);color:var(--accent-ink)}
    .btn.primary:hover{transform:translateY(-2px)}
    .btn.quiet{border:1px solid var(--hairline);color:var(--ink)}
    .btn.big{padding:1.15rem 2.4rem;font-size:1.05rem}
    ${p.buttonStyle === 'outline-fill' ? '.btn.primary{background:transparent;border:1px solid var(--accent);color:var(--accent)}.btn.primary:hover{background:var(--accent);color:var(--accent-ink)}' : ''}

    /* hero */
    .hero{padding:clamp(90px,12vw,170px) 0 clamp(70px,9vw,130px);position:relative}
    .hero-h1{font-size:clamp(2.9rem,7.2vw,6rem);max-width:14ch}
    .hero-sub{font-size:clamp(1.05rem,1.6vw,1.28rem);color:var(--muted);max-width:46ch;margin:1.6rem 0 0}
    .hero-def{font-size:.95rem;color:var(--muted);border-left:2px solid var(--accent);padding-left:1rem;max-width:44ch;margin-top:2rem}
    .hero-actions{display:flex;gap:.9rem;flex-wrap:wrap;margin-top:2.2rem;align-items:center}
    .hero.split .hero-grid{display:grid;grid-template-columns:7fr 4fr;gap:clamp(2rem,6vw,6rem);align-items:end}
    .hero.split .hero-meta{padding-bottom:.4rem}
    .hero-rule{height:1px;background:var(--hairline);margin-top:clamp(48px,7vw,90px)}
    @media(max-width:860px){.hero.split .hero-grid{grid-template-columns:1fr}}
    .hero.fullbleed{background:var(--dark);color:var(--dark-text)}
    .hero.fullbleed .center{text-align:center;display:flex;flex-direction:column;align-items:center}
    .hero.fullbleed .hero-sub{color:color-mix(in srgb,var(--dark-text) 72%,transparent)}
    .hero.fullbleed .hero-def{border-left:0;border-top:1px solid var(--hairline);padding:1.4rem 0 0;margin-top:3rem;color:color-mix(in srgb,var(--dark-text) 62%,transparent)}
    .hero.stacked .hero-h1{font-size:clamp(3.2rem,10vw,7.2rem);text-transform:${p.fonts.display === 'Anton' ? 'uppercase' : 'none'};max-width:none}
    .hero.stacked .hero-h1 span{display:block}
    .hero.stacked .ln2{color:var(--accent)}
    .stack-row{display:flex;justify-content:space-between;gap:2.5rem;align-items:flex-end;flex-wrap:wrap;margin-top:2.2rem}

    /* marquee */
    .marquee{overflow:hidden;border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline);padding:1rem 0;background:var(--surface)}
    .marquee-track{display:flex;gap:2.4rem;white-space:nowrap;font-family:var(--display);font-size:1.05rem;animation:mq 34s linear infinite;width:max-content}
    .marquee .dot{color:var(--accent)}
    @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @media(prefers-reduced-motion:reduce){.marquee-track{animation:none}}

    /* services variants */
    .svc-index{list-style:none;margin:3.5rem 0 0;padding:0}
    .svc-row{display:grid;grid-template-columns:90px 1fr;gap:1.6rem;padding:2.1rem 0;border-top:1px solid var(--hairline)}
    .svc-row:last-child{border-bottom:1px solid var(--hairline)}
    .svc-num{font-family:var(--display);font-size:1.5rem;color:var(--accent)}
    .svc-row h3{font-size:1.5rem;margin-bottom:.45rem}
    .svc-row p{color:var(--muted);margin:0;max-width:62ch}
    .svc-alt{padding:2.4rem 0;border-top:1px solid var(--hairline);display:grid;grid-template-columns:1fr 1fr;gap:2rem}
    .svc-alt.flip h3{order:2}.svc-alt.flip p{order:1;text-align:right}
    .svc-alt h3{font-size:1.7rem}.svc-alt p{color:var(--muted);margin:0}
    @media(max-width:760px){.svc-alt{grid-template-columns:1fr}.svc-alt.flip p{text-align:left;order:2}}
    .svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));margin-top:3.5rem;border-left:1px solid var(--hairline);border-top:1px solid var(--hairline)}
    .svc-cell{border-right:1px solid var(--hairline);border-bottom:1px solid var(--hairline);padding:2rem 1.7rem;min-height:210px;display:flex;flex-direction:column;gap:.6rem}
    .svc-cell h3{font-size:1.25rem}.svc-cell p{color:var(--muted);margin:0;font-size:.95rem}
    .svc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:26px;margin-top:3.5rem}
    .svc-card{background:var(--surface);border:1px solid var(--hairline);border-radius:var(--radius);padding:2.1rem}
    .svc-card.down{transform:translateY(26px)}
    .svc-card h3{font-size:1.3rem;margin-bottom:.5rem}.svc-card p{color:var(--muted);margin:0;font-size:.96rem}
    @media(max-width:760px){.svc-card.down{transform:none}}

    /* stat band */
    .statband{background:var(--dark);color:var(--dark-text);padding:clamp(44px,6vw,70px) 0}
    .stat-row{display:flex;gap:clamp(2rem,7vw,7rem);flex-wrap:wrap}
    .stat b{font-family:var(--display);font-size:clamp(1.9rem,3.4vw,2.8rem);display:block;font-weight:600}
    .stat span{color:color-mix(in srgb,var(--dark-text) 62%,transparent);font-size:.9rem}

    /* about */
    .about-grid{display:grid;grid-template-columns:5fr 7fr;gap:clamp(2rem,6vw,6rem)}
    @media(max-width:860px){.about-grid{grid-template-columns:1fr}}
    .diff-list{list-style:none;padding:0;margin:2rem 0 0}
    .diff-list li{padding:.85rem 0;border-top:1px solid var(--hairline);font-weight:500}

    /* quote */
    .quote-block{padding:clamp(80px,10vw,140px) 0;background:var(--surface);border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline)}
    blockquote{margin:0;max-width:820px}
    .quote{font-family:var(--display);font-size:clamp(1.6rem,3.4vw,2.6rem);line-height:1.25;margin:0 0 1.6rem}
    cite{font-style:normal;color:var(--muted);font-size:.95rem;letter-spacing:.06em;text-transform:uppercase}

    /* faq */
    .faq-grid{display:grid;grid-template-columns:4fr 7fr;gap:clamp(2rem,6vw,6rem)}
    @media(max-width:860px){.faq-grid{grid-template-columns:1fr}}
    .faq{border-top:1px solid var(--hairline);padding:0}
    .faq:last-child{border-bottom:1px solid var(--hairline)}
    .faq summary{cursor:pointer;list-style:none;padding:1.5rem 2.2rem 1.5rem 0;position:relative}
    .faq summary::-webkit-details-marker{display:none}
    .faq summary::after{content:'+';position:absolute;right:.2rem;top:50%;transform:translateY(-50%);font-family:var(--display);font-size:1.5rem;color:var(--accent);transition:transform .3s}
    .faq[open] summary::after{transform:translateY(-50%) rotate(45deg)}
    .faq summary h3{font-size:1.15rem;display:inline}
    .faq-a{color:var(--muted);margin:0 0 1.6rem;max-width:60ch}

    /* booking */
    .book{background:var(--dark);color:var(--dark-text)}
    .book .title{max-width:none}
    .book .lead{color:color-mix(in srgb,var(--dark-text) 70%,transparent)}
    .book-inner{max-width:720px}
    .book-actions{display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap;margin-top:2.4rem}
    .book-alt{color:color-mix(in srgb,var(--dark-text) 70%,transparent);font-size:.95rem}
    .book-alt a{color:var(--dark-text)}
    .book-note{margin-top:1.4rem;font-size:.85rem;color:color-mix(in srgb,var(--dark-text) 55%,transparent)}

    /* floating book button */
    .float-book{position:fixed;right:22px;bottom:22px;z-index:70;box-shadow:0 14px 40px rgba(0,0,0,.28);opacity:0;pointer-events:none;transition:opacity .4s,transform .4s;transform:translateY(8px)}
    .float-book.show{opacity:1;pointer-events:auto;transform:none}
    html:not(.js) .float-book{opacity:1;pointer-events:auto;transform:none}

    footer{padding:56px 0;border-top:1px solid var(--hairline);color:var(--muted);font-size:.92rem}
    footer .brand{color:var(--ink);display:block;margin-bottom:.5rem}

    .js .reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease var(--d,0s),transform .7s ease var(--d,0s)}
    .js .reveal.in{opacity:1;transform:none}
  </style>
</head>
<body>
  <nav><div class="wrap nav-in">
    <span class="brand">${esc(analysis.businessName)}</span>
    <div class="nav-links">
      <a href="#services">Services</a><a href="#about">About</a><a href="#faq">FAQ</a>
      <a class="btn primary" href="#book">${esc(copy.heroCta)}</a>
    </div>
  </div></nav>

  ${heroHtml(p, lead, analysis, copy)}
  ${p.marquee ? marqueeHtml(analysis) : ''}
  ${servicesHtml(p, analysis, copy)}
  ${p.statBand ? statBandHtml(copy) : ''}
  ${aboutHtml(analysis, copy)}
  ${testimonialHtml(copy)}
  ${faqHtml(analysis, copy)}
  ${bookHtml(lead, analysis, copy)}

  <footer><div class="wrap">
    <span class="brand">${esc(analysis.businessName)}</span>
    <p style="margin:.2rem 0 0">${esc(lead.address || analysis.location)}${lead.phone ? ' · ' + esc(lead.phone) : ''}</p>
    <p style="margin:.4rem 0 0;opacity:.65">© ${new Date().getFullYear()} ${esc(analysis.businessName)} · Serving ${esc(city)} and surrounding communities · AI-search optimized</p>
  </div></footer>

  <a class="btn primary float-book" href="#book">Schedule a Call</a>

  <script>
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
    const fb=document.querySelector('.float-book');
    addEventListener('scroll',()=>{fb.classList.toggle('show',scrollY>420 && !isBookVisible())},{passive:true});
    function isBookVisible(){const b=document.getElementById('book');if(!b)return false;const r=b.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}
  </script>
</body>
</html>`;
}

export async function buildWebsite(lead, analysis) {
  const personality = pickPersonality(lead);
  const copy = await generateCopy(lead, analysis);
  const html = render(lead, analysis, copy, personality);
  const outDir = path.join(config.root, config.runtime.outputDir, slugify(analysis.businessName));
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'index.html');
  fs.writeFileSync(file, html);

  // GEO artifacts: llms.txt + robots.txt beside the page
  const url = canonicalUrl(lead, analysis);
  writeGeoArtifacts({ dir: outDir, lead, analysis, copy, url });

  log.ok(`Website built [${personality.name}] → ${path.relative(config.root, file)} (${(html.length / 1024).toFixed(0)} KB + llms.txt + robots.txt)`);
  return { path: file, relPath: path.relative(config.root, file), copy, bytes: html.length, personality: personality.name, dir: outDir };
}

export default buildWebsite;
