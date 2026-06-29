// Contact resolution. Live discovery would use an enrichment API; here we
// derive the most probable role-based address from the business domain and
// score confidence. Never invents personal addresses.
import { slugify } from '../util/helpers.js';

function domainFrom(lead) {
  if (lead.website) {
    try {
      const u = new URL(lead.website);
      const host = u.hostname.replace(/^www\./, '');
      // skip site-builder / social hosts — those aren't real owned domains
      const weak = ['business.site', 'wixsite.com', 'weebly.com', 'facebook.com', 'instagram.com', 'square.site'];
      if (!weak.some((w) => host.includes(w))) return host;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function resolveContact(lead) {
  const domain = domainFrom(lead);
  if (domain) {
    return {
      email: `info@${domain}`,
      alternatives: [`hello@${domain}`, `contact@${domain}`, `office@${domain}`],
      domain,
      confidence: 0.6,
      method: 'role_based_guess',
      note: 'Role-based address inferred from owned domain. Verify before sending.',
    };
  }
  // No owned domain (no site / weak site) → this IS the pitch. We propose the
  // domain we would secure for them and flag manual contact via phone.
  const proposedDomain = `${slugify(lead.name)}.com`;
  return {
    email: null,
    alternatives: [],
    domain: null,
    proposedDomain,
    phone: lead.phone || null,
    confidence: 0.0,
    method: 'no_domain',
    note: `No owned domain found — strongest opening (they have no web presence). Recommend phone-first outreach (${lead.phone || 'find number'}) or secure ${proposedDomain} as part of the pitch.`,
  };
}

export default resolveContact;
