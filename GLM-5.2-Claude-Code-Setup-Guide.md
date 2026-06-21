# 🚀 GLM 5.2 + Claude Code — The Free(ish) Setup Guide

*Run a near-Claude-Opus coding model inside Claude Code for the price of a coffee — or 100% free on your own machine.*

You commented, here it is. This is the exact, no-fluff setup. Follow it top to bottom and you'll be coding with GLM 5.2 in about 5 minutes. No degree, no fluff, copy-paste friendly.

---

## 👀 Why this is a big deal

GLM 5.2 (made by Z.ai) is an **open-weights** coding model that, on real coding benchmarks, lands within a few points of Claude Opus 4.8 — for roughly **1/6th of the cost**. It has a **1M-token context window** (it can hold a *huge* codebase in its head at once).

The magic trick: Claude Code doesn't actually care *which* brain it's plugged into. We just point it at GLM instead of Anthropic. **Same terminal, same commands, same agents** — you swap the engine and keep the seats you already broke in.

You've got two ways to do this. Pick one:

| | **Route 1 — Cheapest & Easiest** | **Route 2 — 100% Free & Local** |
|---|---|---|
| **Cost** | ~$3/mo (GLM Coding Plan) | $0 |
| **Setup time** | 5 min | 15–20 min |
| **Best for** | Everyone. Just works. | Privacy nerds + people with a beefy machine |
| **Catch** | Costs a few bucks | Needs serious hardware (or the free cloud tier) |

👉 **If you're not sure, do Route 1.** It's what 90% of people should use.

---

## ✅ Before you start (both routes)

You need **Claude Code** installed. If you already have it, skip ahead. If not:

1. Install Node.js (LTS) from [nodejs.org](https://nodejs.org).
2. Open your terminal and run:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
3. Confirm it worked:
   ```bash
   claude --version
   ```

That's it. Now pick your route. 👇

---

## 🟢 Route 1 — GLM Coding Plan (the easy one)

This routes Claude Code through Z.ai's official **Anthropic-compatible endpoint**. It's the most reliable path and it's stupid cheap.

### Step 1 — Get your key
1. Go to **[z.ai/subscribe](https://z.ai/subscribe)**.
2. Grab the **GLM Coding Lite** plan (~$3–6/mo — often cheaper on annual). This is plenty for daily coding.
3. After subscribing, open your dashboard and **copy your API key**. Keep it private — it's like a password.

### Step 2 — Tell Claude Code to use GLM
Paste these into your terminal. **Replace `PASTE_YOUR_KEY_HERE` with your actual key.**

**Mac / Linux:**
```bash
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
export ANTHROPIC_AUTH_TOKEN=PASTE_YOUR_KEY_HERE
export ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5.2
export ANTHROPIC_DEFAULT_SONNET_MODEL=glm-5.2
export ANTHROPIC_DEFAULT_HAIKU_MODEL=glm-5-turbo
export API_TIMEOUT_MS=3000000
```

**Windows (PowerShell):**
```powershell
setx ANTHROPIC_BASE_URL "https://api.z.ai/api/anthropic"
setx ANTHROPIC_AUTH_TOKEN "PASTE_YOUR_KEY_HERE"
setx ANTHROPIC_DEFAULT_OPUS_MODEL "glm-5.2"
setx ANTHROPIC_DEFAULT_SONNET_MODEL "glm-5.2"
setx ANTHROPIC_DEFAULT_HAIKU_MODEL "glm-5-turbo"
setx API_TIMEOUT_MS "3000000"
```
*(On Windows, close and reopen your terminal after running `setx`.)*

> 💡 **Make it permanent (Mac/Linux):** paste those `export` lines at the bottom of your `~/.zshrc` (Mac) or `~/.bashrc` (Linux) so you don't have to redo it every time. Then run `source ~/.zshrc`.

### Step 3 — Launch
```bash
claude
```
You're now running GLM 5.2. Jump to **[✅ Did it work?](#-did-it-work)**.

---

## 🔵 Route 2 — 100% Free & Local (Ollama)

This runs the model on **your own computer**. Nothing leaves your machine — total privacy, zero ongoing cost. Ollama speaks Claude Code's language natively, so there's **no middleware to mess with**.

> ⚠️ **Real talk on hardware:** the *full* GLM 5.2 is enormous and needs a workstation (256GB+ RAM) — not most laptops. Two honest options below.

### Step 1 — Install Ollama
Download from **[ollama.com](https://ollama.com)** and install it (Mac, Windows, Linux).

### Step 2 — Get the model
Open a terminal and pull it:

```bash
# Option A — full local model (needs a BEEFY machine)
ollama pull glm-5.2

# Option B — Ollama's free cloud tier (runs on their servers, easy on your laptop)
ollama pull glm-5.2:cloud
```
*Not sure which your machine can handle? Start with `:cloud`.* Check [ollama.com/library/glm-5.2](https://ollama.com/library/glm-5.2) for the exact current tags.

### Step 3 — Start the server
```bash
ollama serve
```
Leave that running. Open a **second** terminal window for the next step.

### Step 4 — Point Claude Code at Ollama
**Mac / Linux:**
```bash
export ANTHROPIC_BASE_URL=http://localhost:11434
export ANTHROPIC_AUTH_TOKEN=ollama
export ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5.2
export ANTHROPIC_DEFAULT_SONNET_MODEL=glm-5.2
export API_TIMEOUT_MS=3000000
```
*(Used `glm-5.2:cloud`? Put that exact name in the two MODEL lines instead.)*

### Step 5 — Launch
```bash
claude
```

---

## ✅ Did it work?

Inside Claude Code, type:

```
What model are you and what's 17 x 23?
```

If you get an answer (391, by the way 😉) and it can read/edit files in your folder, **you're live.** 🎉

Quick gut check: run `/status` inside Claude Code — it should show your GLM base URL, not the default Anthropic one.

---

## 🔥 First 3 things to try

Drop into a project folder, run `claude`, and try these:

1. **"Explain this codebase to me like I'm new here. Where do I start?"**
2. **"Build me a simple landing page for a [your niche] business — clean, modern, dark mode."**
3. **"Find and fix any bugs in this file, then explain what was wrong in plain English."**

---

## 🛠️ Troubleshooting (the 4 things that go wrong)

- **"Invalid API key" / 401** → Your key is wrong or has a typo. Re-copy it from your Z.ai dashboard. No spaces, no quotes left dangling.
- **It "forgets" your setup every new terminal** → You set the variables for one session only. Add the `export` lines to your `~/.zshrc` / `~/.bashrc` (see the 💡 tip in Route 1).
- **Long requests time out** → Make sure `API_TIMEOUT_MS=3000000` is set. Big-context jobs are slow; this gives them room.
- **Ollama: "connection refused"** → `ollama serve` isn't running, or you closed its window. Start it in its own terminal and keep it open.

> **Want to switch back to real Claude later?** Just open a fresh terminal (or `unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN`) and Claude Code goes right back to normal. Nothing is permanently changed.

---

## ❓ Quick FAQ

**Is GLM 5.2 as good as Claude?**
For everyday coding and side projects — shockingly close, especially for the price. For your most critical, high-stakes work, real Claude Opus still has the edge. Use GLM as your daily driver and save premium Claude for the boss fights.

**Is this against the rules?**
No. Claude Code is built to support custom endpoints — you're using a documented feature, just pointing it at a different provider.

**Will Route 2 really cost $0 forever?**
The local model, yes — once it's downloaded it's free to run. Ollama's cloud tier has free usage with limits.

**Cheapest realistic setup?**
Route 1 on the Lite plan. A few dollars a month for near-flagship coding is the best deal in AI right now.

---

### 💸 Cost cheat sheet (June 2026)

| Option | Price | Notes |
|---|---|---|
| GLM Coding **Lite** | ~$3–6/mo | Perfect for most people |
| GLM Coding **Pro** | ~$15–19/mo | Heavy daily development |
| GLM 5.2 pay-as-you-go API | ~$1.40 in / $4.40 out per 1M tokens | If you'd rather not subscribe |
| **Local via Ollama** | **$0** | Needs the hardware |

*Prices move around and Z.ai runs promos — always confirm at [z.ai/subscribe](https://z.ai/subscribe).*

---

**That's the whole thing. Save this, set it up once, and code with a flagship-tier model for pennies. 🚀**

*Got stuck? Reply to my DM or drop a comment and I'll help you get it running.*
