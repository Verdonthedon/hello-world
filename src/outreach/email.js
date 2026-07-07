// Outreach sequence drafter. Produces the full 3-touch protocol per lead:
//   Touch 1 (day 0)  — demo delivery: PAS + 4-Ps, pain-point-anchored, demo link
//   Touch 2 (day 3)  — value bump: one new proof point, zero pressure
//   Touch 3 (day 8)  — takeaway close: loss-aversion "should I close your file?"
// Every touch carries exactly ONE CTA: the booking link.
import { complete, isLive } from '../llm/router.js';
import { config } from '../config.js';
import { frameworkSystemPrompt, PROOF_POINTS, painPointsFor } from './frameworks.js';
import { pick } from '../util/helpers.js';

function links(website) {
  const base = process.env.DEMO_BASE_URL || '';
  const demoPath = website?.relPath ? website.relPath.replace(/index\.html$/, 'demo.html') : '';
  return {
    demo: base ? `${base.replace(/\/$/, '')}/${demoPath.replace(/^data\/output\//, '')}` : `[DEMO LINK — hosted from ${demoPath}]`,
    booking: config.outreach.calendarLink,
  };
}

// Human-sounding category phrase + correct article ("an HVAC company", "a dentist").
function categoryPhrase(category) {
  const c = (category || 'local business').trim();
  if (/^hvac$/i.test(c)) return 'HVAC company';
  return c.toLowerCase();
}
const an = (phrase) => (/^(hvac|[aeiou])/i.test(phrase) ? 'an' : 'a');

function mockSequence(lead, analysis, audit, website) {
  const sender = config.outreach;
  const city = lead.city || analysis.location?.split(',')[0] || 'your area';
  const cat = categoryPhrase(analysis.category);
  const firstGap = (audit.gaps || ['no AI-search optimization'])[0];
  const pains = painPointsFor(analysis.category, audit.hasSite ? 'weak' : 'none');
  const catPain = pains.category[0] || pains.universal[0];
  const proof = pick(PROOF_POINTS, lead.name);
  const { demo, booking } = links(website);

  const subjects = [
    `Built ${lead.name} a new website (link inside — it's yours)`,
    `${lead.name}: what AI tells ${city} customers about you`,
    `Your ${cat} competitors are getting named by AI. You're not.`,
  ];

  const touch1 = {
    day: 0,
    framework: 'PAS + 4Ps',
    subject: pick(subjects, lead.name + 't1'),
    body: `Hi ${lead.name} team,

Quick, uncomfortable fact about ${city}: ${catPain}.

${audit.hasSite
  ? `I audited your current site — it scores ${audit.aiSeoScore}/100 on AI-search readiness. Biggest gap: ${firstGap}. In practice that means when someone asks ChatGPT, Perplexity, or Google's AI for ${an(cat)} ${cat} in ${city}, competitors get named and ${lead.name} doesn't.`
  : `Right now ${lead.name} has no website these AI engines can read — to them, the business simply doesn't exist. When a ${city} local asks for ${an(cat)} ${cat}, someone else gets recommended, every single time.`}

${proof}

So instead of pitching you, I built the fix first. A complete, custom website for ${lead.name} — luxury design, and fully structured so AI engines can find, understand, and recommend you:

See it here: ${demo}

If you like it, grab 15 minutes with me and we'll put it live under your name:
${booking}

If not — no hard feelings, and the preview stays yours to keep.

— ${sender.senderName}
${sender.senderCompany}

P.S. The first ${cat} in ${city} to get AI-search-ready owns that answer box for years. I'd rather it be you.`,
  };

  const touch2 = {
    day: 3,
    framework: 'value bump',
    subject: `Re: ${touch1.subject}`,
    body: `Hi again,

One number since my last note: ${pick(PROOF_POINTS, lead.name + 't2')}

The demo I built for ${lead.name} already has that structure baked in — schema, answer-ready content, AI-crawler access. Most ${cat} sites in ${city} have none of it.

Preview: ${demo}
15 minutes to make it live: ${booking}

— ${sender.senderName}`,
  };

  const touch3 = {
    day: 8,
    framework: 'takeaway close',
    subject: `Closing the file on ${lead.name}?`,
    body: `Hi ${lead.name} team,

I built your demo site because I think ${lead.name} should be the ${cat} that ${city}'s AI assistants recommend. Haven't heard back, so I'll assume the timing's off and close the file this Friday.

Before I do — the demo is still live here: ${demo}

If you want it, one call is all it takes: ${booking}

Either way, thanks for reading — and genuinely, best of luck out there.

— ${sender.senderName}
${sender.senderCompany}`,
  };

  return {
    subject: touch1.subject,
    body: touch1.body,
    framework: touch1.framework,
    wordCount: touch1.body.split(/\s+/).length,
    sequence: [touch1, touch2, touch3],
    source: 'mock',
  };
}

export async function draftEmail(lead, analysis, audit, website) {
  if (!isLive()) return mockSequence(lead, analysis, audit, website);

  const { demo, booking } = links(website);
  const pains = painPointsFor(analysis.category, audit.hasSite ? 'weak' : 'none');
  const system = frameworkSystemPrompt(config.outreach.senderName, config.outreach.senderCompany);
  const prompt = `Write the full 3-touch sequence. Return JSON only:
{"sequence":[{"day":0,"framework":"PAS","subject":"...","body":"..."},{"day":3,...},{"day":8,...}]}

Business: ${lead.name}
Category: ${analysis.category}
City: ${lead.city || analysis.location}
Has website: ${audit.hasSite ? `yes — scores ${audit.aiSeoScore}/100, top gap: ${(audit.gaps || [])[0]}` : 'NO — invisible to AI engines'}
Category pain point: ${pains.category[0] || pains.universal[0]}
Situational pains: ${pains.situational.join(' | ')}
Demo link (the proof): ${demo}
Booking link (the ONLY CTA): ${booking}
Proof points (pick one per touch, paraphrase): ${PROOF_POINTS.join(' | ')}
Sender: ${config.outreach.senderName}, ${config.outreach.senderCompany}

Touch 1: 120-170 words, PAS+4Ps, ends with signature + P.S. (first-mover urgency).
Touch 2 (day 3): under 90 words, one new proof point, both links.
Touch 3 (day 8): under 90 words, takeaway close ("closing the file"), warm exit.`;

  const out = await complete({ system, prompt, task: 'copy', json: true, maxTokens: 2200, temperature: 0.8 });
  if (!out?.sequence?.length) return mockSequence(lead, analysis, audit, website);
  const t1 = out.sequence[0];
  return {
    subject: t1.subject,
    body: t1.body,
    framework: t1.framework || 'PAS',
    wordCount: (t1.body || '').split(/\s+/).length,
    sequence: out.sequence,
    source: 'llm',
  };
}

export default draftEmail;
