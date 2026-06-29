// LLM router — picks Claude or Gemini per task, with graceful fallback.
// Exposes a single `complete()` plus `isLive` so callers can decide whether to
// use a live model or their built-in deterministic mock generator.
import { config, has } from '../config.js';
import { claudeComplete } from './claude.js';
import { geminiComplete } from './gemini.js';
import { extractJSON } from '../util/helpers.js';
import { log } from '../util/log.js';

export const isLive = () => has.anyLLM();

// task hint: "copy" (favor Claude) | "creative" (favor Gemini) | "analysis" | "qa"
function order(task) {
  const r = config.llm.router;
  if (r === 'claude') return ['claude', 'gemini'];
  if (r === 'gemini') return ['gemini', 'claude'];
  // auto: route by task strength
  if (task === 'creative' || task === 'qa') return ['gemini', 'claude'];
  return ['claude', 'gemini']; // copy + analysis default to Claude
}

const runners = { claude: claudeComplete, gemini: geminiComplete };
const available = { claude: has.claude, gemini: has.gemini };

export async function complete({ system, prompt, task = 'copy', maxTokens, temperature, json = false }) {
  const sys = json
    ? `${system || ''}\n\nRespond with ONLY valid JSON. No markdown fences, no commentary.`
    : system;
  for (const provider of order(task)) {
    if (!available[provider]()) continue;
    try {
      const text = await runners[provider]({ system: sys, prompt, maxTokens, temperature });
      return json ? extractJSON(text) : text;
    } catch (e) {
      log.warn(`${provider} failed (${e.message}); trying next provider`);
    }
  }
  return null; // no provider available / all failed → caller uses mock
}

// Run the same prompt through BOTH models when both are present — used by QA for
// an independent second opinion ("consult with the partner").
export async function dualComplete({ system, prompt, maxTokens, temperature, json = false }) {
  const out = {};
  const sys = json ? `${system || ''}\n\nRespond with ONLY valid JSON.` : system;
  if (has.claude()) {
    try {
      const t = await claudeComplete({ system: sys, prompt, maxTokens, temperature });
      out.claude = json ? extractJSON(t) : t;
    } catch (e) {
      log.warn(`claude dual failed: ${e.message}`);
    }
  }
  if (has.gemini()) {
    try {
      const t = await geminiComplete({ system: sys, prompt, maxTokens, temperature });
      out.gemini = json ? extractJSON(t) : t;
    } catch (e) {
      log.warn(`gemini dual failed: ${e.message}`);
    }
  }
  return out;
}

export default { complete, dualComplete, isLive };
