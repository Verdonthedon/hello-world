# LeadFlow Pro

**An autonomous AI engine that finds local businesses across the US & Canada, audits their web presence, generates a stunning AI‑SEO‑optimized website for each one, and drafts an expert‑level, psychology‑driven outreach email — with a QA gate on every deliverable.**

Built for the Sortelle AI Revenue Engine. Runs **fully offline in deterministic mock mode with zero dependencies**, and upgrades automatically to live APIs (Google Places, Claude, Gemini) when keys are present.

```
discover → analyze + audit → generate website → resolve contact → draft email → QA gate → queue
```

---

## Why this exists

Search is shifting from "ten blue links" to **AI‑native answers** (Google AI Overviews/SGE, ChatGPT, Perplexity, Gemini). These engines answer users directly and only cite a handful of businesses. A local business that isn't structured for **GEO (Generative Engine Optimization)** is becoming invisible — and most don't know it yet. That gap is the wedge: LeadFlow Pro quantifies the pain, builds the fix, and writes the pitch.

## Quick start

```bash
# No install, no keys required — runs in mock mode out of the box
node src/index.js doctor                                   # show live vs mock capabilities
node src/index.js run --query "dentists in Austin TX" --limit 5 --mock
node src/index.js queue                                    # review drafted outreach
open data/output/report.html                               # the run dashboard
```

Every run produces, per lead:

- `data/output/<business>/index.html` — a complete, self‑contained website (open in any browser)
- an outreach email appended to `data/output/outreach-queue.jsonl` (**draft‑only, never sent**)
- a QA score + issue list
- `data/output/report.html` — a dashboard of the whole batch

## Going live

Copy `.env.example` → `.env` and add any of these (all optional; each missing key falls back to mock):

| Key | Unlocks |
|-----|---------|
| `ANTHROPIC_API_KEY` | Claude — analysis + conversion copywriting (primary) |
| `GEMINI_API_KEY` | Gemini — creative variants + **independent QA second opinion** (partner) |
| `GOOGLE_PLACES_API_KEY` | Live business discovery across the US/CA |
| `SERPAPI_KEY` | Discovery fallback / SERP checks |

The LLM router (`LLM_ROUTER=auto`) sends copy/analysis to Claude and creative/QA to Gemini, with automatic failover. With both keys set, the QA checker consults **both** models for an independent score ("consult with the partner").

## Architecture

```
src/
  index.js              CLI (run · doctor · status · queue)
  pipeline.js           orchestrator — runs the full flow per lead, persists state
  config.js             .env loader + capability flags (live vs mock)
  report.js             run dashboard (HTML)
  discovery/
    index.js            provider selection, dedupe, web‑presence triage
    providers/places.js Google Places API (New) — live discovery
    providers/mock.js   deterministic US/CA lead generator
  analysis/
    website-audit.js    fetches the live page, scores AI‑SEO / GEO readiness (0‑100)
    analyze.js          strategic brief: ICP, value prop, services, voice, palette
  generation/
    copy.js             conversion copy + answer‑style FAQ (LLM or deterministic)
    website.js          renders self‑contained HTML: design + JSON‑LD + full meta
  outreach/
    frameworks.js       PAS / BAB / AIDA / 4‑Ps + Cialdini principles + proof points
    contact.js          role‑based contact resolution + confidence
    email.js            tailored cold email (Problem→Agitate→Solution→Push)
    queue.js            draft‑only outreach queue (CAN‑SPAM / CASL safe)
  qa/
    checker.js          structural QA + optional partner‑model second opinion
  store/db.js           resumable JSON document store (mirrors a Supabase schema)
```

## What makes the generated websites AI‑search‑ready

Each page ships with the concrete signals AI engines use to find, understand, and cite a business:

- **JSON‑LD `LocalBusiness` schema** (name, address, phone, geo, ratings, services)
- **JSON‑LD `FAQPage` schema** with answer‑style Q&A phrased the way people ask AI assistants
- Full `<title>`, meta description, canonical, Open Graph, Twitter cards, `theme-color`
- Semantic heading structure, mobile viewport, substantive answerable content
- Modern, responsive design (gradient hero, service grid, scroll animations) — **all styling inlined**, so it renders beautifully even if the CDN is blocked, and degrades gracefully with JS off

## The QA gate

Nothing is marked "ready" until it clears `QA_PASS_THRESHOLD` (default 80/100). The checker validates the website (schema present, no broken templates, substantial content), the email (length, AI‑search narrative, single CTA, no spam/banned phrases, personalization), and — when LLM keys are present — folds in an independent score from the partner model.

## Safety & compliance

- **Outreach is draft‑only.** The queue is built for human review; nothing auto‑sends. Wire it to Gmail drafts or your ESP after review. (`OUTREACH_MODE=queue|drafts|off`)
- `MAX_LEADS_PER_RUN` hard‑caps batch size.
- Contact resolution only ever infers **role‑based** addresses (`info@`, `hello@`) and flags confidence — it never fabricates personal emails.
- Respect CAN‑SPAM (US) and CASL (Canada): include a real sender identity, a physical address, and honor opt‑outs before sending.

## Testing

```bash
npm test    # deterministic unit + integration tests, no network/keys
```

## Roadmap

- Supabase persistence (schema already mirrored in `store/db.js`)
- Vercel one‑click deploy of generated sites (preview URL in the pitch)
- Gmail‑drafts writer + reply tracking
- A/B subject‑line bandit; follow‑up sequence generator
- Live SERP/AI‑Overview presence check per lead

---

*Part of Captain's AIOS — the Sortelle AI Revenue Engine. Build quality, ship value, never spam.*
