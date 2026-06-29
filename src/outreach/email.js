// Email drafter. Produces subject + body using the PAS / 4-Ps frameworks,
// grounded in the real audit gaps and the Google AI-search narrative.
import { complete, isLive } from '../llm/router.js';
import { config } from '../config.js';
import { frameworkSystemPrompt, PROOF_POINTS } from './frameworks.js';
import { pick } from '../util/helpers.js';

function mockEmail(lead, analysis, audit) {
  const sender = config.outreach;
  const firstGap = (audit.gaps || ['no AI-search optimization'])[0];
  const city = lead.city || analysis.location?.split(',')[0] || 'your area';
  const proof = pick(PROOF_POINTS, lead.name);
  const cal = sender.calendarLink ? `\n\nGrab a 15-min slot here: ${sender.calendarLink}` : '\n\nWorth a quick 15-minute call this week?';

  const subjects = [
    `${lead.name}: invisible to AI search (I built you a fix)`,
    `A question about how ${lead.name} shows up in AI search`,
    `${city} ${analysis.category.toLowerCase()}s are losing customers to AI search`,
    `Built ${lead.name} something — 60 seconds?`,
  ];
  const subject = pick(subjects, lead.name + 'subj');

  const openLine = audit.hasSite
    ? `I was looking at the website for ${lead.name} and noticed something most ${analysis.category.toLowerCase()} owners in ${city} are about to get blindsided by.`
    : `I noticed ${lead.name} doesn't have a website yet — and with what's happening to search right now, that's actually a bigger problem than it was even a year ago.`;

  const body = `Hi ${lead.name} team,

${openLine}

Google and AI assistants (ChatGPT, Perplexity, Gemini) are shifting from "ten blue links" to AI-native search — they now answer people directly and only cite a handful of businesses. ${proof}

Right now, ${lead.name} ${audit.hasSite ? `scores ${audit.aiSeoScore}/100 on AI-search readiness — the biggest gap being ${firstGap}` : 'has no website for these engines to find or cite at all'}. Translation: when a ${city} local asks an AI assistant for a ${analysis.category.toLowerCase()}, your competitors get named and you don't. Every week that compounds.

So I did something. I already built ${lead.name} a custom, genuinely beautiful website — fully optimized so AI search engines can find, understand, and recommend you. No obligation; I'll send the live preview.${cal}

— ${sender.senderName}
${sender.senderCompany}

P.S. The businesses that moved first on Google SEO 20 years ago owned their markets for a decade. AI search is that same window, open right now. I'd rather it be you than the shop down the street.`;

  return { subject, body, framework: 'PAS', source: 'mock', wordCount: body.split(/\s+/).length };
}

export async function draftEmail(lead, analysis, audit) {
  if (!isLive()) return mockEmail(lead, analysis, audit);

  const system = frameworkSystemPrompt(config.outreach.senderName, config.outreach.senderCompany);
  const prompt = `Write the cold email. Return JSON only with keys: subject, body, framework.

Business: ${lead.name}
Category: ${analysis.category}
City: ${lead.city || analysis.location}
Has website: ${audit.hasSite ? 'yes' : 'NO'}
AI-search readiness score: ${audit.aiSeoScore}/100
Top gap: ${(audit.gaps || [])[0] || 'no AI-search optimization'}
Value prop we offer: a custom, AI-search-optimized website (already built as proof)
Sender: ${config.outreach.senderName}, ${config.outreach.senderCompany}
CTA target: ${config.outreach.calendarLink || 'a 15-minute call'}
Proof point to weave in (pick one, paraphrase): ${PROOF_POINTS.join(' | ')}

Body must be 120-170 words, plain text, end with a signature and a P.S.`;

  const out = await complete({ system, prompt, task: 'copy', json: true, maxTokens: 900, temperature: 0.8 });
  if (!out || !out.body) return mockEmail(lead, analysis, audit);
  out.source = 'llm';
  out.wordCount = out.body.split(/\s+/).length;
  return out;
}

export default draftEmail;
