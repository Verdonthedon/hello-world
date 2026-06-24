# Avatar inputs

Drop your driving assets here and point `assets/avatar/single_example.json` at them:

- `portrait.png` — a single front-facing portrait image of the subject.
- `speech.wav` — the audio track that drives the lip-sync (mono WAV recommended).

These files are intentionally **not** committed (see `.gitignore`). Replace the
paths in the JSON spec with your own media.

Tips for good results:
- Use a clear, well-lit, front-facing portrait.
- Include verbal-action cues in the prompt ("talking", "speaking").
- Longer, descriptive prompts (appearance + action + scene) improve
  consistency and naturalness.
- `audio_cfg` between 3–5 gives the best lip-sync.
