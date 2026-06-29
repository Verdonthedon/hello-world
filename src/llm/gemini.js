// Google Gemini client via REST (native fetch). Used as the "partner" model:
// creative website variants, analysis cross-checks, and independent QA scoring.
import { config } from '../config.js';

export async function geminiComplete({ system, prompt, maxTokens = 2000, temperature = 0.7 }) {
  const key = config.llm.gemini.key;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const model = config.llm.gemini.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
}
