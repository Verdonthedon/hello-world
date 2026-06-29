// Anthropic Claude client via REST (native fetch, no SDK dependency).
import { config } from '../config.js';

const API = 'https://api.anthropic.com/v1/messages';

export async function claudeComplete({ system, prompt, maxTokens = 2000, temperature = 0.7 }) {
  const key = config.llm.anthropic.key;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.llm.anthropic.model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content || []).map((b) => b.text || '').join('').trim();
}
