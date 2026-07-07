# The LeadFlow Outreach & Marketing Protocol

The complete, end-to-end protocol for contacting a discovered business and
delivering their website demo. The pipeline automates steps 1–5; a human (or
a wired Gmail/ESP integration) executes sends after review. Draft-only by
design — CAN-SPAM (US) and CASL (Canada) compliant.

## The offer, in one line

> "We already built you a custom, luxury website that AI search engines can
> actually find and recommend. Here's the live demo — if you want it, book a
> 15-minute call."

Reciprocity does the selling: the demo is finished **before** the first email.
The prospect's only decision is whether to look, then whether to talk.

## The pain narrative (why now)

Every touch is anchored to the same market shift, sharpened per category
(`src/outreach/frameworks.js → PAIN_POINTS`):

1. **Google went AI-native.** AI Overviews answer customers directly, above
   the map pack. AI assistants (ChatGPT, Perplexity, Gemini) recommend 2-3
   businesses by name — everyone else is invisible.
2. **Their situation.** No site → AI has nothing to read; the business doesn't
   exist to it. Weak site → nearly as invisible, and they don't know it.
   We show the number: their AI-search readiness score.
3. **Compounding loss.** Every week, engines reinforce whom they cite.
   Ad costs rise while organic clicks shrink. First-movers own answer boxes
   the way early-SEO businesses owned page one for a decade.
4. **The relief.** The demo — already built, already scored — plus one
   15-minute call to launch it.

## The sequence (automated; see `src/outreach/email.js`)

| Touch | Day | Framework | Job |
|---|---|---|---|
| 1 | 0 | PAS + Picture-Promise-Prove-Push | Deliver the demo. Pain → their score → proof point → demo link → booking link → P.S. with first-mover urgency. 120–170 words. |
| 2 | +3 | Value bump | One new proof point, both links, zero pressure. <90 words. |
| 3 | +8 | Takeaway close | "Closing the file Friday." Loss aversion + warm exit. Demo stays live. <90 words. |

Rules enforced by QA (`src/qa/checker.js`): one CTA (the booking link),
AI-search narrative present, business name + city personalization, no spam
phrases, full 3-touch sequence with a takeaway close.

**Reply handling:**
- *Positive / curious* → send booking link again with 2 concrete time options.
- *"How much?"* → never price in email. "Depends on what you want it to do —
  that's the 15 minutes." Anchor on value of one recovered customer/month.
- *Objection: "we get business from word of mouth"* → "That's exactly what AI
  search is replacing — referrals now get vetted by asking an assistant about
  you first."
- *No / unsubscribe* → suppress immediately, log in queue, never touch again.

## Channels

- **Email** (primary): role-based address from their domain, confidence-scored.
- **Phone-first** (no-domain leads): the strongest pitch — "you have no website
  at all; I built you one anyway, can I text you the link?"
- **Follow the demo**: the demo page is private, `noindex`, and personalized —
  it is the landing page for every channel.

## The demo page (`demo.html`, auto-generated per lead)

Structure (see `src/generation/demo.js`):
1. "Prepared exclusively for {business}" — exclusivity + reciprocity
2. Before/after AI-readiness scorecard — the quantified pain
3. Live iframe of their new site in a browser frame — the proof
4. One CTA: **Schedule a Call** (`CALENDAR_LINK`) — the ask
5. Private-preview framing in the footer — scarcity without pressure

## The call (15 minutes)

1. (2 min) Their story — how customers find them today.
2. (5 min) Screen-share the demo. Let them react. Change something live if
   possible ("want the accent warmer?") — ownership effect.
3. (3 min) The shift, one chart: AI answers → citations → the score delta.
4. (3 min) Offer: launch package (site live on their domain + AI-SEO setup +
   Google Business sync) and a monthly visibility retainer. Anchor high-ticket.
5. (2 min) Close: "Want me to put this live this week?"

## Compliance rails (non-negotiable)

- Draft-only queue; a human approves every send (`OUTREACH_MODE=queue`).
- Real sender identity + physical address in production sends; honor opt-outs
  instantly and permanently.
- CASL: for Canadian leads prefer implied-consent grounds (published business
  contact, relevant to their role) and keep records; when in doubt, phone first.
- Role-based emails only (`info@`) — we never scrape or guess personal inboxes.

## Metrics that matter

Track per batch in `data/store.json`: demo open → call booked → close rate.
The system's economics: one $5–25K close pays for thousands of generated demos.
Optimize the booking rate, not the send volume.
