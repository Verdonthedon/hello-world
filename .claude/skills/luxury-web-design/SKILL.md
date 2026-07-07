---
name: luxury-web-design
description: Design system + hard rules for generating luxury, $20K-agency-grade websites that never look AI-built. Use whenever generating or reviewing any website/landing page in this repo (or anywhere). Encodes researched principles from award-gallery (Awwwards-tier) and luxury-brand design practice.
---

# Luxury Web Design Skill

Codified from research on award-winning/luxury web design (2026) and documented
"AI slop" failure patterns. Apply to EVERY generated site. The implementation
lives in `src/design/personalities.js` + `src/generation/website.js` — keep this
doc and that code in sync.

## The Anti-AI-Slop Contract (hard bans)

Never ship a page with these fingerprints of AI-generated design:

- ❌ Purple/indigo/violet gradients (the `bg-indigo-500` legacy). No blue→purple hero.
- ❌ Inter/Sora/Poppins as display font. Body may use a neutral grotesk, never as headline voice.
- ❌ "Three boxes with icons" as the default features layout.
- ❌ Everything center-aligned; symmetrical hero with badge-pill + H1 + two buttons.
- ❌ Emoji as icons; generic rocket/sparkle/checkmark iconography.
- ❌ Same palette/typography across two different clients. Design must be **derived from the brand**, not from a default.

## The Luxury Contract (what premium actually looks like)

1. **Typography is the design.** Oversized editorial display type (clamp up to 5.5–7rem),
   high-contrast serif or characterful display face paired with a quiet body face.
   Tight leading (0.95–1.05) and slight negative tracking on display; wide-tracked
   (0.14–0.2em) uppercase eyebrow labels at 11–12px.
2. **Restrained palette = confidence.** 2 neutrals + 1 ink + ONE accent. Luxury cores:
   ivory/ink/bronze, forest/brass/bone, terracotta/cream/charcoal, porcelain/slate/seafoam,
   monochrome + single signal color. Accent appears in <10% of the page.
3. **Whitespace is the price tag.** Section padding 120–160px desktop. Let type breathe.
4. **Asymmetry.** Split heroes (7/5), offset images, numbered editorial lists (01–05),
   alternating rows — never a uniform centered stack.
5. **Texture & depth, subtly.** SVG noise/grain overlay at 2–4% opacity; hairline rules
   (1px, 10–15% opacity); layered text-behind-image; no drop-shadow soup.
6. **Motion with intent.** One or two signature moves (slow reveal on scroll, marquee strip,
   hover underline grow). 200–700ms ease. Never bouncing cards everywhere. Progressive
   enhancement: page must be complete with JS off.
7. **Editorial details sell.** Pull-quote testimonial in display type, stat band with
   thin rules, footer with real NAP (name/address/phone), running section numbers.
8. **Photography discipline.** If no real photos, use abstract CSS/SVG compositions in
   brand colors — never stocky placeholders or unrelated Unsplash hero images.
9. **Conversion architecture.** Sticky nav with ONE primary action ("Book a call").
   Floating booking button after first scroll. CTA repeats at natural decision points
   (post-services, post-proof, footer). Every CTA opens the calendar link.
10. **Deterministic uniqueness.** Personality (fonts+palette+layout variants) is selected
    per business from category + name seed, so no two clients ever receive the same design.

## Personality system

Six personalities ship in `src/design/personalities.js` (Editorial Luxe, Modern Vault,
Warm Artisan, Swiss Precision, Coastal Calm, Noir Craft). Each defines: font pairing
(Google Fonts), full palette, hero layout, services layout, button geometry, texture,
and marquee/stat-band flags. Category maps to a personality; seed rotates variants.

When adding a personality: pick fonts with genuine character (Fraunces, Cormorant,
DM Serif Display, Space Grotesk, Marcellus, Anton...), build the palette from the
luxury cores above, and give it one signature layout move the others don't have.

## QA hooks

`src/qa/checker.js` enforces: no banned fonts in display role, no purple-gradient hex
pairs, booking CTA present, personality CSS variables present. A page failing the
anti-slop contract fails QA — regenerate, don't hand-wave.
