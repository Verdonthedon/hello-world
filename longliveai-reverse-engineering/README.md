# @longliveai — Reverse-Engineering & Recreation Package

**Target account:** [@longliveai](https://www.instagram.com/longliveai/) — "Artificial Intelligence | ChatGPT | Technology"
**Size:** ~729K followers · ~1,011 posts · 21 following
**Date of analysis:** 2026-06-21
**Goal:** Reverse-engineer the account's content strategy, visuals, and editing → recreate one video modeled on their most recent viral reel → QA it against the original.

---

## What's in this package

| File | Purpose |
|------|---------|
| `01-account-analysis.md` | Content strategy, niche, posting formula, why it works |
| `02-viral-video-breakdown.md` | Shot-by-shot / second-by-second breakdown of the target viral reel format |
| `03-recreation-script-storyboard.md` | Full recreation: script, hook variants, storyboard, captions, audio |
| `04-generation-prompts.md` | Copy-paste prompts for video, image, voiceover & captions |
| `05-qa-rubric.md` | QA checklist to verify the recreation is visually equal-or-better |
| `assets/` | Generated keyframes / proof-of-concept stills (as credits allow) |

---

## Honest status of the environment (read this first)

This was produced inside an isolated cloud container. Three pieces of the original
request depend on resources that are **not available in this container**, so the
method was adapted rather than faked:

| Requested method | Status in this environment | What I did instead |
|---|---|---|
| **Apify scrape** of the account | ❌ No Apify token; `api.apify.com` blocked (403) | Reconstructed the account/format from web research + search metadata |
| **Claude vision frame-by-frame** on their videos | ❌ Instagram + all mirror sites return 403; no way to download the source MP4s | Reverse-engineered the *format* from captions, titles, thumbnails & the account's documented style |
| **Render a finished MP4** of the recreation | ⚠️ Higgsfield wallet had **2.27 credits** (a video gen costs several) + no local `ffmpeg` | Produced a complete, paste-ready production package + attempted keyframe stills |

**To finish the actual rendered video + automated QA, one of these unblocks it:**
1. **Top up Higgsfield credits** → I generate the full clip, voiceover, and run `virality_predictor` / `video_analysis` as the QA pass. (Recommended — everything is staged.)
2. **Provide an Apify API token** → I run the real scrape and pull exact metrics + the source video URL for true frame-by-frame vision.
3. **Upload the source reel** (the MP4) → I do genuine frame-by-frame Claude-vision analysis and a pixel-level QA comparison.

Everything in files `01`–`05` is complete and immediately usable regardless.
