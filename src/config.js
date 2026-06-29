// Central configuration. Reads .env (if present) and process.env.
// No external dotenv dependency — we parse a local .env ourselves so the
// project runs with zero `npm install`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === '') process.env[key] = val;
  }
}
loadDotEnv();

const env = process.env;
const num = (v, d) => (v === undefined || v === '' || isNaN(Number(v)) ? d : Number(v));

export const config = {
  root: ROOT,
  llm: {
    router: env.LLM_ROUTER || 'auto',
    anthropic: {
      key: env.ANTHROPIC_API_KEY || '',
      model: env.ANTHROPIC_MODEL || 'claude-opus-4-8',
    },
    gemini: {
      key: env.GEMINI_API_KEY || '',
      model: env.GEMINI_MODEL || 'gemini-2.0-flash',
    },
  },
  discovery: {
    placesKey: env.GOOGLE_PLACES_API_KEY || '',
    serpKey: env.SERPAPI_KEY || '',
  },
  outreach: {
    mode: env.OUTREACH_MODE || 'queue', // queue | drafts | off
    senderName: env.SENDER_NAME || 'Evan Alexander',
    senderCompany: env.SENDER_COMPANY || 'Sortelle AI',
    senderEmail: env.SENDER_EMAIL || '',
    calendarLink: env.CALENDAR_LINK || '',
  },
  runtime: {
    maxLeads: num(env.MAX_LEADS_PER_RUN, 25),
    qaThreshold: num(env.QA_PASS_THRESHOLD, 80),
    outputDir: env.OUTPUT_DIR || 'data/output',
  },
};

// Capability flags — drive the live-vs-mock decision throughout the pipeline.
export const has = {
  claude: () => !!config.llm.anthropic.key,
  gemini: () => !!config.llm.gemini.key,
  places: () => !!config.discovery.placesKey,
  serp: () => !!config.discovery.serpKey,
  anyLLM: () => !!config.llm.anthropic.key || !!config.llm.gemini.key,
};

export default config;
