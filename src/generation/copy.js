// Website copy generator. Live → LLM writes section copy + FAQ in the brand
// voice. Offline → deterministic, on-brand copy from the analysis brief.
import { complete, isLive } from '../llm/router.js';

function mockCopy(lead, analysis) {
  const loc = analysis.location || lead.city || 'your area';
  const svc = analysis.services || [];
  return {
    heroHeadline: analysis.tagline || analysis.valueProp,
    heroSub: `${analysis.businessName} helps ${analysis.icp}. Now built to be found by AI search — so the right customers discover you first.`,
    heroCta: 'Book Your Free Consultation',
    aboutTitle: `Why ${loc} chooses ${analysis.businessName}`,
    aboutBody: `${analysis.valueProp} For years, ${analysis.businessName} has earned trust the hard way — by showing up, doing excellent work, and treating every customer like a neighbor. ${(analysis.differentiators || []).join(' • ')}.`,
    services: svc.map((s) => ({
      name: s,
      desc: `Expert ${s.toLowerCase()} delivered with care, clear pricing, and zero guesswork.`,
    })),
    faq: [
      {
        q: `What makes ${analysis.businessName} different?`,
        a: `${analysis.valueProp} We combine ${analysis.voice || 'professional, trusted'} service with a relentless focus on results for ${analysis.icp}.`,
      },
      {
        q: `Where is ${analysis.businessName} located and what areas do you serve?`,
        a: `We proudly serve ${loc} and the surrounding communities. Reach us at ${lead.phone || 'the number on this page'} to get started.`,
      },
      {
        q: `How do I get started?`,
        a: `Getting started is simple — book a free consultation through this site or call us directly. We'll listen first, then build a plan around your goals.`,
      },
      {
        q: `Why should I choose a local ${analysis.category} business?`,
        a: `Local means accountable. ${analysis.businessName} is invested in ${loc}, responds fast, and stakes its reputation on every job.`,
      },
    ],
    source: 'mock',
  };
}

export async function generateCopy(lead, analysis) {
  if (!isLive()) return mockCopy(lead, analysis);

  const system =
    'You are an elite conversion copywriter (think Halbert × Sugarman × modern DTC). ' +
    `Write in a ${analysis.voice || 'confident, warm, expert'} voice. Specific, vivid, ` +
    'benefit-led. No clichés, no "welcome to our website".';
  const prompt = `Write website copy for this business. Return JSON only.

Business: ${analysis.businessName}
Category: ${analysis.category}
Location: ${analysis.location}
Value prop: ${analysis.valueProp}
Ideal customer: ${analysis.icp}
Services: ${(analysis.services || []).join(', ')}
Differentiators: ${(analysis.differentiators || []).join(', ')}

JSON keys:
heroHeadline (6-10 words, magnetic),
heroSub (1-2 sentences, mention being discoverable by AI search),
heroCta (3-4 words),
aboutTitle, aboutBody (3-4 sentences),
services (array of {name, desc} — desc 1 sentence, benefit-led),
faq (4 items of {q, a} — questions phrased the way a real customer would ASK AN AI ASSISTANT; answers 2-3 sentences, directly quotable so AI engines cite them).`;

  const out = await complete({ system, prompt, task: 'copy', json: true, maxTokens: 1600 });
  if (!out || !out.heroHeadline) return mockCopy(lead, analysis);
  out.source = 'llm';
  return out;
}

export default generateCopy;
