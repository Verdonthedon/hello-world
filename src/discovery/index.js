// Discovery orchestrator. Chooses the best available provider, dedupes, and
// classifies each lead's website status (the core targeting signal).
import { has } from '../config.js';
import { log } from '../util/log.js';
import { discoverPlaces } from './providers/places.js';
import { discoverMock } from './providers/mock.js';

// Heuristic: classify the web-presence opportunity from the discovery record.
// Real quality scoring happens later in analysis/website-audit.js (which can
// actually fetch the page); this is the cheap first-pass triage.
export function classifyWebPresence(lead) {
  if (!lead.website) return { status: 'none', priority: 'high' };
  const url = lead.website.toLowerCase();
  const weakHosts = ['business.site', 'wixsite.com', 'weebly.com', 'godaddysites.com',
    'square.site', 'facebook.com', 'instagram.com', 'linktr.ee', 'wordpress.com'];
  if (weakHosts.some((h) => url.includes(h))) return { status: 'weak', priority: 'high' };
  return { status: 'has_site', priority: 'medium' };
}

export async function discover({ query, limit = 10, mock = false }) {
  let provider = 'mock';
  let leads = [];
  if (!mock && has.places()) {
    try {
      log.step(`Discovering via Google Places: "${query}" (limit ${limit})`);
      leads = await discoverPlaces(query, limit);
      provider = 'google_places';
    } catch (e) {
      log.warn(`Places discovery failed (${e.message}); falling back to mock`);
    }
  }
  if (leads.length === 0) {
    log.step(`Discovering via mock generator: "${query}" (limit ${limit})`);
    leads = await discoverMock(query, limit);
    provider = 'mock';
  }

  // dedupe by id, attach presence classification
  const seen = new Set();
  const out = [];
  for (const lead of leads) {
    if (seen.has(lead.id)) continue;
    seen.add(lead.id);
    out.push({ ...lead, presence: classifyWebPresence(lead) });
  }

  const counts = out.reduce((a, l) => ((a[l.presence.status] = (a[l.presence.status] || 0) + 1), a), {});
  log.ok(`Discovered ${out.length} leads via ${provider} — ${JSON.stringify(counts)}`);
  return out;
}

export default discover;
