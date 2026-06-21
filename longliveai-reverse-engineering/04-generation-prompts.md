# 04 — Generation Prompts (paste-ready)

These are tuned for **Higgsfield** (`generate_video` / `generate_image` /
`generate_audio`) but work in any modern text-to-video model (Veo 3, Kling, Runway,
Sora-class). Each shot is written as an independent clip so they can be generated in
parallel and assembled per the storyboard in `03`.

All clips: **9:16 vertical, 1080×1920, 30fps**. Keep a consistent robot design across
shots — generate Shot 1 first, then use its keyframe as an image reference for the rest
so the robot looks identical throughout.

---

## VIDEO — Promo segment (warm, glossy, saturated)

**Shot 1 — Hook (1.2s)**
```
Cinematic commercial shot, vertical 9:16. A sleek white-and-chrome humanoid home
robot gently pours coffee in a sun-drenched modern kitchen. A happy family blurred
in the soft-focus background. Warm golden morning light, subtle lens flare, smooth
slow gimbal push-in, glossy high-end product-ad aesthetic, shallow depth of field,
4k, hyperreal. Optimistic, aspirational mood.
```

**Shot 2 — Setup (1.8s)**
```
Same white humanoid home robot, vertical 9:16, neatly folding laundry then handing a
toy to a smiling toddler, gliding across a spotless designer living room. Bright,
saturated, cinematic slow motion, lens flare, premium tech commercial look, 4k.
```

## VIDEO — Reality segment (cool, degraded, comedic)

**Shot 4 — Payoff 1 (1.6s)**
```
The same white humanoid robot, but now a low-quality home security-camera / phone
clip, vertical 9:16. The robot wobbles and clumsily knocks a ceramic vase off a
table; it shatters. Slightly desaturated, cool tone, mild grain, handheld realism,
awkward and funny, ordinary apartment. Security-cam timestamp in corner.
```

**Shot 5 — Payoff 2 (1.6s)**
```
Same humanoid robot hopelessly tangled in a bedsheet it was trying to fold, arms
caught, a house cat watching unimpressed. Vertical 9:16, phone-shot look, cool flat
grade, comedic, realistic messy bedroom.
```

**Shot 6 — Payoff 3 (1.8s)**
```
Same humanoid robot stuck in a doorway, gently and repeatedly bumping the door frame,
unable to pass. Static home security-camera angle, vertical 9:16, desaturated, grainy,
deadpan comedy, fixed wide shot.
```

**Shot 7 — Button (1.2s)**
```
The humanoid robot lying toppled on its back on the floor, legs slightly twitching,
vertical 9:16, security-cam aesthetic, comedic, cool grade, quiet ordinary room.
```

> Shot 8 (loop) reuses Shot 1's final pristine frame — no new generation needed.

---

## IMAGE — keyframes (if generating stills first for consistency)

**Hero keyframe (promo look)**
```
Vertical 9:16 product-commercial still: a sleek white-and-chrome humanoid home robot
pouring coffee in a sunlit luxury kitchen, warm golden light, lens flare, glossy,
hyperreal, shallow depth of field, aspirational tech-ad aesthetic.
```

**Reality keyframe**
```
Vertical 9:16 home-security-camera still of the SAME white humanoid robot toppled on
the floor next to a shattered vase, cool desaturated grade, grain, timestamp overlay,
candid and comedic.
```

---

## AUDIO — music + SFX (generate_audio / music model)

**Bed A (promo, 0–3s)**
```
Bright, optimistic, modern synth swell, "the future is here" tech-commercial music,
uplifting, clean, builds anticipation. ~3 seconds.
```

**TURN sting (3.0–3.8s)**
```
Record-scratch / tape-stop into a comedic beat drop, abrupt mood flip from hopeful to
awkward.
```

**Bed B (reality, 3.8–10s)**
```
Light, awkward, comedic background music, quirky pizzicato or muted bounce, low-key,
sitcom-blooper vibe. ~6 seconds, loops back to bright on the final note.
```

---

## VOICEOVER — TTS (neutral US AI voice, calm, slightly wry)

```
Home robots — the future is finally here. At least… that's what the ads show you.
Reality? It knocked over the vase, lost a fight with the laundry, and got stuck in a
doorway. Yeah… we're not quite ready. Follow for your daily dose of AI.
```
Voice: neutral US English, measured, dry humor on "Reality?". Duck music –12 dB under VO.

---

## CAPTIONS — burned-in subtitle spec

- Auto-transcribe the VO; render **word-by-word pop** captions, bold sans-serif
  (Inter/Montserrat), white with subtle shadow, centered lower-third.
- Highlight keywords in **yellow**: "reality", "vase", "laundry", "doorway", "daily AI".
- Hook text (upper third) is a separate, larger title layer per the storyboard timings.
- Safe margins: keep all text within the central 80% so the IG UI never covers it.

---

## ASSEMBLY (when you have the clips)

Order: `Shot1 → Shot2 → [hard cut] Shot4 → Shot5 → Shot6 → Shot7 → Shot1(loop)`.
- Place the TURN sting exactly on the Shot2→Shot4 cut (~3.0s).
- Apply the two-grade contrast (warm promo vs cool reality).
- Normalize to –14 LUFS, export H.264, 1080×1920, 30fps.
- Verify a clean loop (last frame ≈ first frame).

If you give me Higgsfield credits, I run all of the above through the MCP tools and
hand back the finished MP4 + the QA report.
