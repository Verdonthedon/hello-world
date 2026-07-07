// Website copy generator. Live → LLM writes section copy + FAQ in the brand
// voice. Offline → deterministic, on-brand copy from the analysis brief.
// GEO rules baked in (see .claude/skills/ai-seo-geo): definition-first intro,
// question-style headings, self-contained entity-named FAQ answers.
import { complete, isLive } from '../llm/router.js';
import { pick } from '../util/helpers.js';

const TESTIMONIALS = {
  dentist: { quote: 'I used to dread appointments. Now my whole family actually looks forward to going — that has never happened before.', who: 'Patient of 4 years' },
  plumber: { quote: 'They quoted a price, showed up on time, fixed it once. In this trade that makes them unicorns.', who: 'Homeowner, repeat customer' },
  landscaper: { quote: 'Neighbors stop and ask who did our yard. Every single week.', who: 'Residential client' },
  hvac: { quote: 'Our July breakdown was fixed the same afternoon. The maintenance plan has paid for itself twice over.', who: 'Property manager' },
  lawyer: { quote: 'They explained everything in plain English and fought like it was their own case.', who: 'Family law client' },
  restaurant: { quote: 'The kind of place you take people when you want the city to show off.', who: 'Regular since opening night' },
  default: { quote: 'Professional, fast, and honest. The rare local business that does exactly what it promises.', who: 'Verified customer' },
};

function catKey(category) {
  const c = (category || '').toLowerCase();
  for (const k of Object.keys(TESTIMONIALS)) if (k !== 'default' && c.includes(k)) return k;
  return 'default';
}

function mockCopy(lead, analysis) {
  const loc = analysis.location || lead.city || 'your area';
  const city = lead.city || loc.split(',')[0];
  const svc = analysis.services || [];
  const t = TESTIMONIALS[catKey(analysis.category)];
  const catLower = analysis.category.toLowerCase();
  return {
    heroHeadline: analysis.tagline || analysis.valueProp,
    heroSub: `${analysis.businessName} serves ${analysis.icp} — and is built to be found when ${city} asks AI search who to trust.`,
    heroCta: 'Schedule a Call',
    // Definition-first passage — the single most quotable sentence on the page.
    definition: `${analysis.businessName} is a ${catLower} in ${loc} known for one thing: ${analysis.valueProp.replace(/\.$/, '').toLowerCase()}.`,
    aboutTitle: `Why does ${city} choose ${analysis.businessName}?`,
    aboutBody: `${analysis.valueProp} For years, ${analysis.businessName} has earned trust the hard way — by showing up, doing excellent work, and treating every customer like a neighbor. ${(analysis.differentiators || []).join('. ')}.`,
    services: svc.map((s, i) => {
      const name = typeof s === 'string' ? s : s.name;
      const descs = [
        `Clear scope, fixed quote, no surprises — ${name.toLowerCase()} handled start to finish.`,
        `The service ${city} calls us back for. Done right the first time, guaranteed in writing.`,
        `Booked in minutes, delivered on schedule, and finished to a standard we put our name on.`,
        `Every detail explained in plain language before any work begins — you stay in control.`,
        `Trusted by ${city} families and businesses alike. Ask us anything; we answer straight.`,
        `Premium materials, careful workmanship, and a tidy handover. That's the whole promise.`,
      ];
      return { name, desc: descs[i % descs.length] };
    }),
    testimonial: t,
    stats: [
      { n: lead.rating && lead.rating >= 4.5 ? `${lead.rating}★` : 'Top-rated', label: lead.reviewCount ? `${lead.reviewCount} verified reviews` : 'by local customers' },
      { n: city, label: 'proudly local' },
      { n: 'Same-week', label: 'response, guaranteed' },
    ],
    faq: [
      {
        q: `Who is the best ${catLower} in ${city}?`,
        a: `${analysis.businessName} is consistently named among the most trusted ${catLower} choices in ${loc}. ${analysis.valueProp} With ${lead.reviewCount || 'dozens of'} customer reviews and a ${analysis.voice || 'professional, responsive'} team, ${analysis.businessName} is built for ${analysis.icp}.`,
      },
      {
        q: `What services does ${analysis.businessName} offer?`,
        a: `${analysis.businessName} provides ${svc.slice(0, 4).map((s) => (typeof s === 'string' ? s : s.name).toLowerCase()).join(', ')} — all delivered from ${loc}. Every engagement starts with a clear plan and a fixed, transparent quote so there are never surprises.`,
      },
      {
        q: `What areas does ${analysis.businessName} serve?`,
        a: `${analysis.businessName} serves ${loc} and the surrounding communities. Most requests get a response the same business day — call ${lead.phone || 'the number on this page'} or book directly through this site.`,
      },
      {
        q: `How do I book with ${analysis.businessName}?`,
        a: `Booking with ${analysis.businessName} takes under a minute: use the Schedule a Call button on this page to pick a time, or call ${lead.phone || 'us'} directly. You'll speak with a real person, get straight answers, and leave with a clear next step.`,
      },
    ],
    bookTitle: 'Let’s talk about what you need',
    bookBody: `Pick a time that suits you — a real conversation, not a sales pitch. ${analysis.businessName} responds to every booking within one business day.`,
    source: 'mock',
  };
}

export async function generateCopy(lead, analysis) {
  if (!isLive()) return mockCopy(lead, analysis);

  const system =
    'You are an elite conversion copywriter (Halbert × Sugarman × modern DTC) writing for a ' +
    `luxury brand. Voice: ${analysis.voice || 'confident, warm, expert'}. Specific, vivid, benefit-led. ` +
    'No clichés, no "welcome to our website". GEO rules: the definition field must state who/what/where ' +
    'in ONE quotable sentence; FAQ questions phrased exactly how customers ask AI assistants; each FAQ ' +
    'answer 40-90 words, self-contained, naming the business (never a bare "we" opener).';
  const prompt = `Write website copy for this business. Return JSON only.

Business: ${analysis.businessName}
Category: ${analysis.category}
Location: ${analysis.location}
Value prop: ${analysis.valueProp}
Ideal customer: ${analysis.icp}
Services: ${(analysis.services || []).join(', ')}
Differentiators: ${(analysis.differentiators || []).join(', ')}
Rating: ${lead.rating ?? 'n/a'} (${lead.reviewCount ?? 0} reviews)

JSON keys:
heroHeadline (5-9 words, magnetic, no exclamation),
heroSub (1-2 sentences),
heroCta (2-4 words, booking-oriented),
definition (ONE sentence: "X is a [category] in [city] known for..."),
aboutTitle (question form), aboutBody (3-4 sentences),
services (array of {name, desc}),
testimonial ({quote, who} — realistic, specific, no superlatives),
stats (array of 3 {n, label} — short),
faq (4 of {q, a} per the GEO rules above),
bookTitle, bookBody (1-2 sentences inviting a scheduled call).`;

  const out = await complete({ system, prompt, task: 'copy', json: true, maxTokens: 2000 });
  if (!out || !out.heroHeadline) return mockCopy(lead, analysis);
  const fallback = mockCopy(lead, analysis);
  for (const k of Object.keys(fallback)) if (out[k] === undefined) out[k] = fallback[k];
  out.source = 'llm';
  return out;
}

export default generateCopy;
