---
name: ai-seo-geo
description: Generative Engine Optimization (GEO / AI SEO) skill — makes any website maximally discoverable and citable by AI search engines (Google AI Overviews/SGE, ChatGPT, Perplexity, Gemini, Claude). Use whenever generating, auditing, or optimizing a website in this repo.
---

# AI SEO / GEO Skill

Codified from 2026 GEO practice (Search Engine Land, LLMrefs, seotuners, awesome-GEO).
Implementation: `src/seo/ai-seo.js` (audit + artifact generation). Keep in sync.

## Why

AI engines answer users directly via RAG: they pull short, self-contained passages
and cite few sources. Optimization therefore happens at the **passage level** and the
**machine-readability level**, not just the page level.

## The GEO checklist (every generated site)

### Machine readability
- **JSON-LD**, all of: `LocalBusiness` (NAP, geo, hours, `areaServed`, `makesOffer`,
  `aggregateRating` when ≥4.5), `FAQPage`, `WebSite`, `BreadcrumbList`, and a
  `speakable` spec on hero headline + FAQ answers.
- **`llms.txt`** at site root: markdown index — one-line business definition, services,
  service area, contact, FAQ digest. (~10% adoption → cheap differentiation.)
- **`robots.txt`** explicitly allowing AI crawlers: `GPTBot`, `ClaudeBot`, `Claude-Web`,
  `PerplexityBot`, `Google-Extended`, `GoogleOther`, `Bytespider`? (no — exclude scrapers
  without citation value), plus `Sitemap:` line.
- Clean status codes, canonical URL, mobile viewport, `theme-color`.

### Passage-level content (what RAG actually retrieves)
- **Definition-first**: first body paragraph states WHO/WHAT/WHERE in one quotable
  sentence ("X is a [category] in [city] that [value prop].").
- **Question-based H2/H3s** phrased how users ask assistants ("Who is the best
  [category] in [city]?", "How much does [service] cost in [city]?").
- **Self-contained answers**: every FAQ answer 40–90 words, restating the entity name
  (never bare "we") so the passage survives extraction out of context.
- **Sourced specificity**: concrete numbers (years, counts, ratings) beat adjectives.
- Entity consistency: exact same business name string everywhere (title, schema, copy).

### Scoring
`auditAiSeo(html)` scores 0–100 across those dimensions and returns actionable gaps.
Pipeline order: render → GEO audit → auto-generate llms.txt + robots.txt → QA gate
(threshold configurable, default 80). A failing GEO score blocks "ready" status.

## Sales use

The audit runs against the PROSPECT's existing site too — the delta between their
score and our generated site's score is the core proof artifact in outreach
(demo page shows both numbers side by side).
