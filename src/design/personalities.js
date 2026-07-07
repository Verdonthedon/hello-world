// Design personality system — implements .claude/skills/luxury-web-design.
// Each personality is a complete visual world: font pairing, restrained luxury
// palette, layout variants, texture, and a signature move. Selection is
// deterministic from category + business name, so every client gets a distinct,
// non-template design and re-runs are reproducible.
//
// HARD BANS (anti-AI-slop contract): no purple/indigo gradients, no Inter/Sora/
// Poppins display type, no three-icon-boxes, no all-centered symmetric layouts.
import { seededRand } from '../util/helpers.js';

export const PERSONALITIES = {
  editorialLuxe: {
    key: 'editorialLuxe',
    name: 'Editorial Luxe',
    mood: 'quiet money — ivory, ink, bronze; high-contrast serif at poster scale',
    fonts: {
      display: 'Fraunces',
      displayWeights: '400;600;700',
      body: 'Archivo',
      bodyWeights: '400;500;600',
      displayStack: `'Fraunces', Georgia, serif`,
      bodyStack: `'Archivo', 'Helvetica Neue', sans-serif`,
    },
    palette: {
      bg: '#F7F3EC', surface: '#FFFFFF', ink: '#17140F', muted: '#6B6357',
      accent: '#8C6A3F', accentInk: '#F7F3EC', dark: '#1C1813', darkText: '#EDE7DB',
      hairline: 'rgba(23,20,15,.14)',
    },
    hero: 'editorial-split',      // oversized serif left, meta column right
    services: 'numbered',         // 01–05 editorial index list
    radius: '2px',
    buttonStyle: 'square',
    marquee: true,
    statBand: true,
    signature: 'text-behind-rule',
  },
  modernVault: {
    key: 'modernVault',
    name: 'Modern Vault',
    mood: 'private-bank calm — deep forest, brass, bone; garamond elegance',
    fonts: {
      display: 'Cormorant Garamond',
      displayWeights: '500;600;700',
      body: 'Work Sans',
      bodyWeights: '400;500;600',
      displayStack: `'Cormorant Garamond', Georgia, serif`,
      bodyStack: `'Work Sans', 'Helvetica Neue', sans-serif`,
    },
    palette: {
      bg: '#0E211B', surface: '#12291F', ink: '#EDE6D6', muted: '#9FAF9F',
      accent: '#C9A227', accentInk: '#0E211B', dark: '#0A1813', darkText: '#EDE6D6',
      hairline: 'rgba(237,230,214,.16)',
    },
    hero: 'fullbleed-center',     // cinematic dark, centered serif, thin rules
    services: 'alternating',
    radius: '0px',
    buttonStyle: 'outline-fill',
    marquee: false,
    statBand: true,
    signature: 'gold-hairlines',
    darkBase: true,
  },
  warmArtisan: {
    key: 'warmArtisan',
    name: 'Warm Artisan',
    mood: 'handmade premium — terracotta, cream, charcoal, sage',
    fonts: {
      display: 'DM Serif Display',
      displayWeights: '400',
      body: 'DM Sans',
      bodyWeights: '400;500;700',
      displayStack: `'DM Serif Display', Georgia, serif`,
      bodyStack: `'DM Sans', 'Helvetica Neue', sans-serif`,
    },
    palette: {
      bg: '#FAF3E7', surface: '#FFFFFF', ink: '#2B2622', muted: '#7A6F63',
      accent: '#B4552D', accentInk: '#FAF3E7', dark: '#2B2622', darkText: '#F4EADA',
      hairline: 'rgba(43,38,34,.15)',
    },
    hero: 'stacked-oversize',     // huge stacked headline, image band below
    services: 'cards-offset',     // staggered cards, no icons
    radius: '14px',
    buttonStyle: 'pill',
    marquee: true,
    statBand: false,
    signature: 'arch-image',
  },
  swissPrecision: {
    key: 'swissPrecision',
    name: 'Swiss Precision',
    mood: 'engineered trust — near-monochrome grid + one signal color',
    fonts: {
      display: 'Space Grotesk',
      displayWeights: '500;700',
      body: 'IBM Plex Sans',
      bodyWeights: '400;500;600',
      displayStack: `'Space Grotesk', 'Helvetica Neue', sans-serif`,
      bodyStack: `'IBM Plex Sans', 'Helvetica Neue', sans-serif`,
    },
    palette: {
      bg: '#F4F4F2', surface: '#FFFFFF', ink: '#121212', muted: '#5D5D58',
      accent: '#E63312', accentInk: '#FFFFFF', dark: '#121212', darkText: '#F4F4F2',
      hairline: 'rgba(18,18,18,.16)',
    },
    hero: 'editorial-split',
    services: 'grid-lines',       // table-like grid with visible hairlines
    radius: '0px',
    buttonStyle: 'square',
    marquee: false,
    statBand: true,
    signature: 'grid-rules',
  },
  coastalCalm: {
    key: 'coastalCalm',
    name: 'Coastal Calm',
    mood: 'spa-grade serenity — porcelain, deep slate, seafoam, sand',
    fonts: {
      display: 'Marcellus',
      displayWeights: '400',
      body: 'Nunito Sans',
      bodyWeights: '400;600;700',
      displayStack: `'Marcellus', Georgia, serif`,
      bodyStack: `'Nunito Sans', 'Helvetica Neue', sans-serif`,
    },
    palette: {
      bg: '#EFF3F4', surface: '#FFFFFF', ink: '#16303B', muted: '#5F7783',
      accent: '#64A79B', accentInk: '#10262F', dark: '#16303B', darkText: '#E8EFF1',
      hairline: 'rgba(22,48,59,.14)',
    },
    hero: 'fullbleed-center',
    services: 'numbered',
    radius: '18px',
    buttonStyle: 'pill',
    marquee: false,
    statBand: true,
    signature: 'soft-wave',
  },
  noirCraft: {
    key: 'noirCraft',
    name: 'Noir Craft',
    mood: 'confident black — condensed poster type, gold accent, industrial edge',
    fonts: {
      display: 'Anton',
      displayWeights: '400',
      body: 'Manrope',
      bodyWeights: '400;500;700',
      displayStack: `'Anton', 'Arial Narrow', sans-serif`,
      bodyStack: `'Manrope', 'Helvetica Neue', sans-serif`,
    },
    palette: {
      bg: '#0C0C0C', surface: '#161616', ink: '#F2EFE9', muted: '#9C978D',
      accent: '#D4AF37', accentInk: '#0C0C0C', dark: '#080808', darkText: '#F2EFE9',
      hairline: 'rgba(242,239,233,.16)',
    },
    hero: 'stacked-oversize',
    services: 'grid-lines',
    radius: '4px',
    buttonStyle: 'square',
    marquee: true,
    statBand: false,
    signature: 'uppercase-poster',
    darkBase: true,
  },
};

// Category → personality affinity. Seed still rotates within the affinity list
// so two dentists in the same batch don't get identical worlds.
const AFFINITY = {
  dentist: ['coastalCalm', 'editorialLuxe', 'swissPrecision'],
  lawyer: ['modernVault', 'editorialLuxe', 'swissPrecision'],
  restaurant: ['warmArtisan', 'noirCraft', 'editorialLuxe'],
  landscaper: ['warmArtisan', 'coastalCalm', 'editorialLuxe'],
  plumber: ['swissPrecision', 'noirCraft', 'modernVault'],
  hvac: ['swissPrecision', 'modernVault', 'coastalCalm'],
  default: ['editorialLuxe', 'modernVault', 'warmArtisan', 'swissPrecision', 'coastalCalm', 'noirCraft'],
};

export function pickPersonality(lead) {
  const cat = (lead.category || '').toLowerCase();
  const list =
    Object.entries(AFFINITY).find(([k]) => k !== 'default' && cat.includes(k))?.[1] ||
    AFFINITY.default;
  const idx = Math.floor(seededRand(lead.name + '|' + cat) * list.length);
  return PERSONALITIES[list[idx]];
}

// Subtle SVG grain — the texture layer that reads "printed, not rendered".
export const NOISE_DATA_URI =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`;

export function googleFontsHref(p) {
  const fam = (name, weights) => `family=${name.replace(/ /g, '+')}:wght@${weights}`;
  return `https://fonts.googleapis.com/css2?${fam(p.fonts.display, p.fonts.displayWeights)}&${fam(p.fonts.body, p.fonts.bodyWeights)}&display=swap`;
}

export default { PERSONALITIES, pickPersonality, NOISE_DATA_URI, googleFontsHref };
