// Google Places API (New) — Text Search. Live business discovery for the US/CA.
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
import { config } from '../../config.js';
import { id, titleCase } from '../../util/helpers.js';

const SEARCH = 'https://places.googleapis.com/v1/places:searchText';

export async function discoverPlaces(query, limit) {
  const key = config.discovery.placesKey;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY not set');
  const fields = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.rating',
    'places.userRatingCount',
    'places.primaryType',
    'places.addressComponents',
  ].join(',');

  const out = [];
  let pageToken;
  while (out.length < limit) {
    const res = await fetch(SEARCH, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fields + ',nextPageToken',
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: Math.min(20, limit - out.length),
        ...(pageToken ? { pageToken } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Places API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    for (const p of data.places || []) {
      const comps = p.addressComponents || [];
      const get = (t) => comps.find((c) => (c.types || []).includes(t))?.shortText;
      out.push({
        id: id(p.id || p.displayName?.text),
        name: p.displayName?.text || 'Unknown',
        category: titleCase(p.primaryType?.replace(/_/g, ' ') || query),
        query,
        address: p.formattedAddress || '',
        city: get('locality') || '',
        region: get('administrative_area_level_1') || '',
        country: get('country') || '',
        phone: p.internationalPhoneNumber || p.nationalPhoneNumber || '',
        website: p.websiteUri || null,
        rating: p.rating || null,
        reviewCount: p.userRatingCount || 0,
        source: 'google_places',
      });
      if (out.length >= limit) break;
    }
    if (!data.nextPageToken || out.length >= limit) break;
    pageToken = data.nextPageToken;
  }
  return out;
}

export default discoverPlaces;
