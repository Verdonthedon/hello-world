// Website auditor — fetches the live page (if any) and scores how discoverable
// it is by AI search engines (Google AI Overviews / SGE, ChatGPT, Perplexity).
// This "AI-SEO / GEO" score is the wedge: it quantifies the pain we sell against.
import { clamp } from '../util/helpers.js';

const UA = 'Mozilla/5.0 (compatible; LeadFlowBot/0.1; +https://leadflowpro.app/bot)';

async function fetchHtml(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: controller.signal });
    if (!res.ok) return { ok: false, status: res.status };
    const html = await res.text();
    return { ok: true, status: res.status, html: html.slice(0, 500000) };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

// GEO (Generative Engine Optimization) signal checks. Each maps to a concrete
// reason an AI engine will or won't cite the business.
function scoreHtml(html) {
  const h = html.toLowerCase();
  const checks = {
    title: /<title[^>]*>[^<]{5,}<\/title>/i.test(html),
    metaDescription: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{30,}/i.test(html),
    structuredData: h.includes('application/ld+json') || h.includes('schema.org'),
    localBusinessSchema: h.includes('localbusiness') || h.includes('"@type": "organization') || h.includes('"@type":"organization'),
    h1: /<h1[^>]*>[^<]{3,}/i.test(html),
    headingDepth: (html.match(/<h[23][^>]*>/gi) || []).length >= 3,
    mobileViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    openGraph: h.includes('og:title') || h.includes('og:description'),
    faqContent: h.includes('faq') || h.includes('frequently asked') || h.includes('faqpage'),
    answerableContent: (html.replace(/<[^>]+>/g, ' ').match(/\b\w+\b/g) || []).length >= 300,
    https: true, // we only fetch https in mock; live caller passes real url scheme
    sitemap: h.includes('sitemap'),
  };
  const weights = {
    title: 8, metaDescription: 10, structuredData: 16, localBusinessSchema: 14,
    h1: 6, headingDepth: 8, mobileViewport: 6, openGraph: 6, faqContent: 10,
    answerableContent: 8, https: 2, sitemap: 6,
  };
  let score = 0;
  const passed = [];
  const failed = [];
  for (const [k, ok] of Object.entries(checks)) {
    if (ok) {
      score += weights[k];
      passed.push(k);
    } else {
      failed.push(k);
    }
  }
  return { score: clamp(Math.round(score), 0, 100), passed, failed, checks };
}

export async function auditWebsite(lead) {
  // No site at all → maximum opportunity, zero discoverability.
  if (!lead.website || lead.presence?.status === 'none') {
    return {
      hasSite: false,
      reachable: false,
      aiSeoScore: 0,
      gaps: ['no website at all', 'invisible to AI search engines', 'no structured data', 'no owned customer funnel'],
      summary: 'No website found. The business is effectively invisible to AI search engines and owns no digital real estate.',
    };
  }

  const fetched = await fetchHtml(lead.website);
  if (!fetched.ok) {
    // Site listed but unreachable / blocked → treat as weak.
    return {
      hasSite: true,
      reachable: false,
      aiSeoScore: 10,
      gaps: ['site is slow, down, or blocking crawlers', 'no structured data for AI engines'],
      summary: `Website listed (${lead.website}) but could not be loaded (${fetched.status || fetched.error}). Likely outdated, slow, or blocking crawlers — a red flag for AI indexing.`,
    };
  }

  const scored = scoreHtml(fetched.html);
  const gapLabels = {
    title: 'missing/empty <title>',
    metaDescription: 'missing meta description',
    structuredData: 'no structured data (JSON-LD)',
    localBusinessSchema: 'no LocalBusiness/Organization schema',
    h1: 'no clear H1',
    headingDepth: 'thin heading structure',
    mobileViewport: 'not mobile-optimized',
    openGraph: 'no Open Graph tags',
    faqContent: 'no FAQ / answer-style content',
    answerableContent: 'thin content (AI engines prefer substantive answers)',
    sitemap: 'no sitemap reference',
  };
  return {
    hasSite: true,
    reachable: true,
    aiSeoScore: scored.score,
    gaps: scored.failed.map((f) => gapLabels[f] || f),
    passed: scored.passed,
    summary:
      scored.score >= 70
        ? `Solid foundation (AI-SEO ${scored.score}/100) but ${scored.failed.length} gaps keep it from being consistently cited by AI engines.`
        : `Weak AI discoverability (${scored.score}/100). ${scored.failed.length} critical GEO gaps mean AI search engines will rarely surface this business.`,
  };
}

export default auditWebsite;
