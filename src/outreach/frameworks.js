// Sales-psychology framework library. These encode the proven structures and
// persuasion principles the email writer draws on — and double as the system
// prompt scaffolding for the LLM path.

export const FRAMEWORKS = {
  PAS: {
    name: 'Problem · Agitate · Solution',
    when: 'Default for cold outreach. Lead with a pain the prospect feels, intensify the cost of inaction, then present the solution as relief.',
    steps: ['Name the specific problem', 'Agitate the stakes / cost of inaction', 'Present the solution + proof', 'Low-friction CTA'],
  },
  BAB: {
    name: 'Before · After · Bridge',
    when: 'When the desired future state is vivid. Paint where they are, where they could be, and the bridge between.',
    steps: ['Before (current pain)', 'After (desired world)', 'Bridge (your offer)', 'CTA'],
  },
  AIDA: {
    name: 'Attention · Interest · Desire · Action',
    when: 'Classic. Strong for a punchy, momentum-building note.',
    steps: ['Attention hook', 'Interest (relevance)', 'Desire (benefit + proof)', 'Action'],
  },
  FourPs: {
    name: 'Picture · Promise · Prove · Push',
    when: 'High-ticket. Make them SEE it, promise the outcome, prove it, push to act.',
    steps: ['Picture the outcome', 'Promise the result', 'Prove with evidence', 'Push (urgency + CTA)'],
  },
};

// Cialdini + modern cold-email principles applied to every draft.
export const PRINCIPLES = [
  'Reciprocity: lead with value (a free custom website mockup) before asking for anything.',
  'Authority: cite the real Google shift to AI-native search (AI Overviews / SGE) and concrete data.',
  'Social proof: reference comparable businesses and proven campaigns winning AI-search visibility.',
  'Loss aversion: the cost of being invisible to AI search compounds daily as competitors get cited.',
  'Specificity: name their business, city, category, and a real gap from the audit — never generic.',
  'Low friction: one clear CTA (a 15-min call or "reply YES"), never multiple asks.',
  'Brevity: 120-170 words. Skimmable. One idea per line.',
];

// Reference campaigns / proof points the copy can cite (real, well-known shifts).
export const PROOF_POINTS = [
  "Google's Search Generative Experience (AI Overviews) now answers queries directly — sites without structured data and answer-style content are getting skipped.",
  'Generative Engine Optimization (GEO) studies show structured, citable content can lift AI-engine visibility 30-40%.',
  'Local businesses with LocalBusiness schema + FAQ markup are disproportionately cited by ChatGPT, Perplexity, and Gemini for "near me" style questions.',
  'Brands that moved early on SEO in the 2000s (think the first plumbers to rank on Google) captured outsized, lasting demand — the same window is open now for AI search.',
];

export function frameworkSystemPrompt(senderName, senderCompany) {
  return `You are ${senderName}, founder of ${senderCompany} — a world-class direct-response copywriter and AI-search consultant.
Write a cold outreach email that a busy local business owner will actually read and reply to.

Use the PROBLEM → AGITATE → SOLUTION (PAS) structure, enriched with PICTURE → PROMISE → PROVE → PUSH.
Apply these persuasion principles:
${PRINCIPLES.map((p) => '- ' + p).join('\n')}

Hard rules:
- 120-170 words. Plain text. No markdown, no emojis, no fluff.
- Personalize with the business name, city, category, and ONE specific gap from the audit.
- The core narrative: Google + AI assistants are shifting to AI-native search; businesses not optimized for it are becoming invisible; we already built them a custom, AI-search-ready website as proof; here's the outcome and a simple next step.
- Lead with value (we already made them something). One CTA.
- Sound human and confident, never salesy or hypey. No "I hope this email finds you well".`;
}

export default { FRAMEWORKS, PRINCIPLES, PROOF_POINTS, frameworkSystemPrompt };
