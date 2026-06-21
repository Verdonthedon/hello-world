# 05 — QA Rubric: "Visually the same or better"

Use this to grade the recreation (`home-robot-promo-vs-reality.mp4`) against the
@longliveai reference format. Target: **every row ≥ "Match"**, with several at "Better".
Score each row 0 (worse) / 1 (match) / 2 (better). **Pass = no 0s and total ≥ 14/20.**

When the source MP4 is supplied, the "Reference" column is filled from a true
frame-by-frame Claude-vision pass and each row is scored side-by-side.

## A. Visual fidelity

| # | Criterion | Reference (@longliveai) | Recreation target | Score |
|---|-----------|--------------------------|-------------------|:-----:|
| 1 | Aspect ratio | 9:16 full-bleed | 9:16 1080×1920 |  |
| 2 | Hook readable in frame 1 | yes, upper third | yes, ≤0.5s |  |
| 3 | Two-grade contrast (promo vs reality) | warm→cool | warm→cool, distinct |  |
| 4 | Subject consistency (same robot throughout) | consistent | consistent across all shots |  |
| 5 | Resolution / sharpness | HD | ≥ reference, 1080p, no artifacts |  |
| 6 | Uncanny/scroll-stopping hero visual | yes | yes |  |

## B. Editing & pacing

| # | Criterion | Reference | Recreation target | Score |
|---|-----------|-----------|-------------------|:-----:|
| 7 | Length | ~10–12s | ~11s |  |
| 8 | TURN beat present & early | ~40% | ~32% (earlier = better retention) |  |
| 9 | Hard cut + audio flip on TURN | yes | yes, frame-accurate |  |
| 10 | Cut rhythm (0.8–1.8s/shot) | fast | fast, varied |  |
| 11 | Clean loop (last≈first frame) | yes | yes |  |

## C. Captions & text

| # | Criterion | Reference | Recreation target | Score |
|---|-----------|-----------|-------------------|:-----:|
| 12 | Bold hook title, upper third | yes | yes |  |
| 13 | Word-by-word pop captions | yes | yes, keyword highlight |  |
| 14 | Muted-viewing safe (message lands silent) | yes | yes |  |
| 15 | Text inside IG safe margins | yes | yes (central 80%) |  |

## D. Audio

| # | Criterion | Reference | Recreation target | Score |
|---|-----------|-----------|-------------------|:-----:|
| 16 | Bright→comedic audio arc | yes | yes |  |
| 17 | Drop/sting aligned to TURN | yes | yes |  |
| 18 | Loudness normalized (~–14 LUFS) | yes | yes |  |
| 19 | VO ducked under music (if VO used) | n/a | yes, clear |  |

## E. Strategy fit

| # | Criterion | Reference | Recreation target | Score |
|---|-----------|-----------|-------------------|:-----:|
| 20 | On-brand: faceless, curiosity-gap, robot lane, comment-bait caption, CTA | yes | yes |  |

---

## Automated QA pass (when credits available)

1. **`virality_predictor`** on the finished MP4 → hook strength, retention risk,
   attention, predicted engagement. Target: score ≥ the format's baseline; iterate the
   hook/first 3s if retention risk is flagged.
2. **`video_analysis_create`** → objective shot/scene/caption breakdown to confirm the
   beat sheet (TURN timing, cut count, caption coverage) matches the storyboard.
3. **Side-by-side** with the source reel (once supplied): score every row above; any row
   at 0 → revise that element and re-render.

## Iteration loop

```
generate → assemble → virality_predictor + video_analysis → score rubric
   → any 0s? fix that element → re-render → re-score
   → all ≥1 and total ≥14 and hook ≥ baseline? → SHIP
```
