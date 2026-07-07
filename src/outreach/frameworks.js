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
  breakup: {
    name: 'Takeaway close ("should I close your file?")',
    when: 'Final touch. Loss aversion + autonomy — pulling the offer away triggers response.',
    steps: ['Reference prior value given', 'Announce the takeaway', 'Leave door open, zero pressure'],
  },
};

// Cialdini + modern cold-email principles applied to every draft.
export const PRINCIPLES = [
  'Reciprocity: lead with value (a finished custom website demo) before asking for anything.',
  'Authority: cite the real Google shift to AI-native search (AI Overviews / SGE) and concrete data.',
  'Social proof: reference comparable businesses and proven campaigns winning AI-search visibility.',
  'Loss aversion: the cost of being invisible to AI search compounds daily as competitors get cited.',
  'Specificity: name their business, city, category, and a real gap from the audit — never generic.',
  'Low friction: one clear CTA (the booking link), never multiple asks.',
  'Brevity: 120-170 words. Skimmable. One idea per line.',
  'Autonomy: "no obligation", "if it\'s not for you, keep the ideas" — pressure kills high-ticket trust.',
];

// Business-owner pain points, by category and universal. The copy engine picks
// the sharpest pains for the audit context — this is what makes the email land.
export const PAIN_POINTS = {
  universal: [
    'Google is answering customers directly now — AI Overviews sit above the map pack, and businesses not structured for AI get skipped entirely',
    'ChatGPT and Perplexity recommend a handful of local businesses by name; everyone else is invisible',
    'ad costs keep climbing while organic clicks shrink — owning an AI-citable web presence is the only compounding channel left',
    'the businesses that moved first on Google SEO 20 years ago owned their markets for a decade; the same land-grab is happening in AI search right now',
    'every week of invisibility compounds: AI assistants learn which businesses to cite, and incumbency is sticky',
  ],
  no_site: [
    'without a website, AI assistants have nothing to read, verify, or recommend — the business does not exist to them',
    'relying on a Facebook page or Google profile means renting your presence on land someone else owns',
    'competitors with a structured site are being quoted by name to your would-be customers',
  ],
  weak_site: [
    'a site-builder page with no structured data is nearly as invisible to AI engines as no site at all',
    'slow, outdated sites get skipped by AI crawlers and silently dropped from consideration',
  ],
  dentist: ['new patients now ask AI "best dentist near me that takes my insurance" — and act on the answer without ever seeing page one of Google'],
  plumber: ['emergency searches are exactly where AI answers first — "burst pipe, who do I call" returns 2-3 names, not ten blue links'],
  lawyer: ['high-intent legal queries are moving to private AI chats; referrals now get vetted by asking an assistant about you'],
  hvac: ['seasonal demand spikes go to whoever the AI names first when a furnace dies at 11pm'],
  restaurant: ['"where should we eat tonight" is now an AI conversation — menus and details AI can read decide who gets the table'],
  landscaper: ['homeowners ask AI for design ideas first, then ask who nearby can build them — you want to be the name in that answer'],
};

// Reference campaigns / proof points the copy can cite (real, well-known shifts).
export const PROOF_POINTS = [
  "Google's AI Overviews now answer queries directly — sites without structured data and answer-style content are getting skipped.",
  'Generative Engine Optimization (GEO) studies show structured, citable content can lift AI-engine visibility 30-40%.',
  'Local businesses with LocalBusiness schema + FAQ markup are disproportionately cited by ChatGPT, Perplexity, and Gemini for "near me" style questions.',
  'Brands that moved early on SEO in the 2000s (think the first plumbers to rank on Google) captured outsized, lasting demand — the same window is open now for AI search.',
];

export function painPointsFor(category, presenceStatus) {
  const cat = (category || '').toLowerCase();
  const catKey = Object.keys(PAIN_POINTS).find((k) => !['universal', 'no_site', 'weak_site'].includes(k) && cat.includes(k));
  return {
    universal: PAIN_POINTS.universal,
    situational: presenceStatus === 'none' ? PAIN_POINTS.no_site : PAIN_POINTS.weak_site,
    category: catKey ? PAIN_POINTS[catKey] : [],
  };
}

export function frameworkSystemPrompt(senderName, senderCompany) {
  return `You are ${senderName}, founder of ${senderCompany} — a world-class direct-response copywriter and AI-search consultant.
Write cold outreach a busy local business owner will actually read and reply to.

Touch 1 uses PROBLEM → AGITATE → SOLUTION enriched with PICTURE → PROMISE → PROVE → PUSH.
Touch 2 is a short value-add bump. Touch 3 is a takeaway close.
Apply these persuasion principles:
${PRINCIPLES.map((p) => '- ' + p).join('\n')}

Hard rules:
- 120-170 words for touch 1; under 90 for touches 2-3. Plain text. No markdown, no emojis.
- Personalize with the business name, city, category, and ONE specific gap from the audit.
- Core narrative: Google + AI assistants shifted to AI-native search; unstructured businesses are becoming invisible; we already built them a custom, AI-search-ready website as proof; here is the demo link and a booking link.
- One CTA per email: the booking link. The demo link is the proof, the call is the ask.
- Sound human and confident, never salesy or hypey. No "I hope this email finds you well".`;
}

export default { FRAMEWORKS, PRINCIPLES, PAIN_POINTS, PROOF_POINTS, painPointsFor, frameworkSystemPrompt };
