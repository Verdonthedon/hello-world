// Deterministic mock business generator — realistic US/Canada SMB leads with a
// realistic mix of "no website", "weak website", and "decent website" so the
// rest of the pipeline has meaningful work to do. Seeded → reproducible.
import { seededRand, slugify, id, titleCase } from '../../util/helpers.js';

const CITIES = [
  { city: 'Austin', region: 'TX', country: 'US' },
  { city: 'Denver', region: 'CO', country: 'US' },
  { city: 'Portland', region: 'OR', country: 'US' },
  { city: 'Nashville', region: 'TN', country: 'US' },
  { city: 'Tampa', region: 'FL', country: 'US' },
  { city: 'Toronto', region: 'ON', country: 'CA' },
  { city: 'Vancouver', region: 'BC', country: 'CA' },
  { city: 'Calgary', region: 'AB', country: 'CA' },
  { city: 'Ottawa', region: 'ON', country: 'CA' },
  { city: 'Halifax', region: 'NS', country: 'CA' },
];

const CATEGORY_NAMES = {
  dentist: ['Bright Smile Dental', 'Cornerstone Family Dentistry', 'Maple Dental Care', 'Lakeview Orthodontics', 'Summit Dental Studio'],
  plumber: ['RapidFlow Plumbing', 'Anchor Plumbing & Heating', 'TrueLine Plumbers', 'Cascade Drain Co', 'Reliant Pipe Works'],
  landscaper: ['Evergreen Landscapes', 'Stonecreek Lawn & Garden', 'Northwind Outdoor Design', 'GreenLeaf Grounds', 'Terra Vista Landscaping'],
  hvac: ['ClimatePro HVAC', 'TrueComfort Heating & Air', 'Polar Bear Cooling', 'Hearthstone HVAC', 'AirVantage Mechanical'],
  lawyer: ['Hargrove & Associates', 'Beacon Legal Group', 'Northgate Law', 'Sterling Family Law', 'Cedar & Pine LLP'],
  restaurant: ['The Copper Spoon', 'Olive & Ember', 'Riverside Bistro', 'Harvest Table Kitchen', 'Smokehouse 41'],
  default: ['Premier Co', 'Hometown Service', 'Apex Group', 'Bluebird Co', 'Ironwood Partners'],
};

function categoryFrom(query) {
  const q = (query || '').toLowerCase();
  for (const key of Object.keys(CATEGORY_NAMES)) {
    if (key !== 'default' && q.includes(key)) return key;
  }
  if (q.includes('dental') || q.includes('ortho')) return 'dentist';
  if (q.includes('law') || q.includes('attorney')) return 'lawyer';
  if (q.includes('food') || q.includes('cafe') || q.includes('eat')) return 'restaurant';
  return 'default';
}

export async function discoverMock(query, limit) {
  const cat = categoryFrom(query);
  const names = CATEGORY_NAMES[cat];
  const out = [];
  for (let i = 0; i < limit; i++) {
    const r = seededRand(query + '#' + i);
    const loc = CITIES[Math.floor(seededRand(query + 'city' + i) * CITIES.length)];
    const baseName = names[i % names.length];
    const name = i < names.length ? baseName : `${baseName} ${loc.city}`;
    // Website status mix: 35% none, 30% weak, 35% has-site
    const websiteRoll = seededRand(name + 'web');
    let website = null;
    if (websiteRoll > 0.65) website = `https://www.${slugify(name)}.com`;
    else if (websiteRoll > 0.35) website = `https://${slugify(name)}.business.site`; // weak: GMB/site-builder

    const rating = (3.3 + r * 1.7).toFixed(1);
    const reviews = Math.floor(15 + seededRand(name + 'rev') * 480);
    out.push({
      id: id(name + loc.city),
      name,
      category: titleCase(cat === 'default' ? (query || 'local business') : cat),
      query,
      address: `${100 + Math.floor(r * 8900)} ${['Main', 'Oak', 'Maple', 'King', '1st'][i % 5]} St, ${loc.city}, ${loc.region}`,
      city: loc.city,
      region: loc.region,
      country: loc.country,
      phone: `+1 ${200 + Math.floor(r * 700)}-${String(100 + Math.floor(seededRand(name) * 899))}-${String(1000 + Math.floor(seededRand(name + 'p') * 8999))}`,
      website,
      rating: Number(rating),
      reviewCount: reviews,
      source: 'mock',
    });
  }
  return out;
}

export default discoverMock;
