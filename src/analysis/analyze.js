// Business analyzer. Builds the strategic brief that drives both the website
// and the email: positioning, ICP, services, brand voice, palette, pain points.
// Live path uses the LLM; offline path uses a deterministic category model.
import { complete, isLive } from '../llm/router.js';
import { pick, titleCase } from '../util/helpers.js';
import { auditWebsite } from './website-audit.js';
import { log } from '../util/log.js';

const PALETTES = [
  { name: 'Deep Trust', primary: '#0F4C81', accent: '#2EC4B6', dark: '#0B1B2B', light: '#F7FAFC' },
  { name: 'Warm Premium', primary: '#1A1A2E', accent: '#E94560', dark: '#16213E', light: '#FFF8F0' },
  { name: 'Fresh Growth', primary: '#14532D', accent: '#84CC16', dark: '#052e16', light: '#F0FDF4' },
  { name: 'Modern Slate', primary: '#1E293B', accent: '#38BDF8', dark: '#0F172A', light: '#F8FAFC' },
  { name: 'Bold Sunrise', primary: '#7C2D12', accent: '#F59E0B', dark: '#431407', light: '#FFFBEB' },
];

const CATEGORY_MODEL = {
  Dentist: {
    icp: 'busy families and professionals within 15 miles seeking a trusted long-term dental home',
    services: ['Preventive & Family Dentistry', 'Cosmetic Dentistry & Whitening', 'Invisalign / Clear Aligners', 'Emergency Dental Care', 'Dental Implants'],
    valueProp: 'Gentle, modern dentistry that patients actually look forward to.',
    voice: 'warm, reassuring, expert',
    painPoints: ['fear of the dentist', 'surprise costs', 'hard to get appointments'],
  },
  Plumber: {
    icp: 'homeowners and property managers needing fast, reliable, fairly-priced plumbing',
    services: ['24/7 Emergency Plumbing', 'Drain Cleaning & Hydro-Jetting', 'Water Heater Repair & Install', 'Leak Detection', 'Repiping & Fixtures'],
    valueProp: 'On-time, upfront-priced plumbing that fixes it right the first time.',
    voice: 'straight-talking, dependable, local',
    painPoints: ['no-show contractors', 'surprise invoices', 'repeat failures'],
  },
  Landscaper: {
    icp: 'homeowners and HOAs who want a standout, low-maintenance outdoor space',
    services: ['Landscape Design & Build', 'Lawn Care & Maintenance', 'Hardscaping & Patios', 'Irrigation Systems', 'Seasonal Cleanups'],
    valueProp: 'Outdoor spaces the whole neighborhood notices.',
    voice: 'creative, grounded, proud',
    painPoints: ['unreliable crews', 'designs that look generic', 'poor communication'],
  },
  Hvac: {
    icp: 'homeowners needing year-round comfort and lower energy bills',
    services: ['AC Repair & Installation', 'Furnace & Heating Service', 'Indoor Air Quality', 'Preventive Maintenance Plans', 'Smart Thermostats'],
    valueProp: 'Comfort you can count on in every season — no surprises.',
    voice: 'trustworthy, efficient, expert',
    painPoints: ['breakdowns at the worst time', 'high energy bills', 'oversold equipment'],
  },
  Lawyer: {
    icp: 'individuals and small businesses needing clear, confident legal guidance',
    services: ['Free Case Evaluation', 'Family Law', 'Estate Planning', 'Business & Contracts', 'Personal Injury'],
    valueProp: 'Clear advice, real advocacy, no legalese.',
    voice: 'authoritative, calm, human',
    painPoints: ['confusing process', 'unclear fees', 'feeling unheard'],
  },
  Restaurant: {
    icp: 'locals and visitors looking for a memorable, shareable dining experience',
    services: ['Dine-In Experience', 'Online Ordering & Takeout', 'Private Events & Catering', 'Seasonal Menu', 'Reservations'],
    valueProp: 'A neighborhood table worth coming back for.',
    voice: 'inviting, vibrant, sensory',
    painPoints: ['hard to find online', 'no easy ordering', 'menus out of date'],
  },
};

function mockAnalysis(lead, audit) {
  const model = CATEGORY_MODEL[lead.category] || {
    icp: `local customers in ${lead.city || 'the area'} who value quality and trust`,
    services: ['Core Service', 'Premium Service', 'Consultation', 'Ongoing Support'],
    valueProp: `${lead.name} — local expertise you can trust.`,
    voice: 'professional, warm, credible',
    painPoints: ['hard to find online', 'unclear offerings', 'no easy way to get in touch'],
  };
  const palette = pick(PALETTES, lead.name);
  return {
    businessName: lead.name,
    category: lead.category,
    location: [lead.city, lead.region].filter(Boolean).join(', '),
    icp: model.icp,
    valueProp: model.valueProp,
    services: model.services,
    voice: model.voice,
    painPoints: model.painPoints,
    differentiators: [
      // Only lead with the rating when it actually sells (≥4.5)
      ...(lead.rating >= 4.5 && lead.reviewCount >= 10
        ? [`${lead.rating}★ from ${lead.reviewCount} verified reviews`]
        : [`Trusted by ${lead.city || 'local'} customers for years`]),
      'Locally owned & operated',
      'Straight answers, honest pricing',
    ],
    palette,
    tagline: model.valueProp,
    aiSeoOpportunity: audit.summary,
    source: 'mock',
  };
}

export async function analyze(lead) {
  const audit = await auditWebsite(lead);
  log.detail(`audit: ${lead.name} → AI-SEO ${audit.aiSeoScore}/100 (${audit.hasSite ? 'has site' : 'no site'})`);

  if (!isLive()) {
    return { audit, analysis: mockAnalysis(lead, audit) };
  }

  const system =
    'You are a senior brand strategist and conversion copywriter. Produce a tight, ' +
    'specific strategic brief for a local business. Be concrete, never generic.';
  const prompt = `Business: ${lead.name}
Category: ${lead.category}
Location: ${[lead.city, lead.region, lead.country].filter(Boolean).join(', ')}
Rating: ${lead.rating ?? 'n/a'} (${lead.reviewCount ?? 0} reviews)
Current website: ${lead.website || 'NONE'}
Website audit: ${audit.summary} Gaps: ${(audit.gaps || []).join(', ')}

Return JSON with keys: businessName, category, location, icp (1 sentence),
valueProp (1 punchy sentence), services (array of 4-6), voice (3 adjectives),
painPoints (array of 3 customer pains), differentiators (array of 3),
palette {name, primary (#hex), accent (#hex), dark (#hex), light (#hex)},
tagline, aiSeoOpportunity (1-2 sentences on what AI-search visibility unlocks).`;

  const out = await complete({ system, prompt, task: 'analysis', json: true, maxTokens: 1200 });
  if (!out) return { audit, analysis: mockAnalysis(lead, audit) };
  out.source = 'llm';
  if (!out.palette) out.palette = pick(PALETTES, lead.name);
  return { audit, analysis: out };
}

export default analyze;
