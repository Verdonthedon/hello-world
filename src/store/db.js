// Dead-simple JSON document store. Zero deps. Persists pipeline state so runs
// are resumable and auditable. For production scale swap this for Supabase
// (schema mirrors the `leads` record shape below).
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const DB_PATH = path.join(config.root, 'data', 'store.json');

function ensure() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ leads: {}, runs: [] }, null, 2));
}

function read() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { leads: {}, runs: [] };
  }
}

function write(data) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
  upsertLead(lead) {
    const data = read();
    const existing = data.leads[lead.id] || {};
    data.leads[lead.id] = { ...existing, ...lead, updatedAt: new Date().toISOString() };
    write(data);
    return data.leads[lead.id];
  },
  getLead(id) {
    return read().leads[id] || null;
  },
  allLeads() {
    return Object.values(read().leads);
  },
  recordRun(run) {
    const data = read();
    data.runs.push(run);
    write(data);
  },
  stats() {
    const leads = Object.values(read().leads);
    return {
      total: leads.length,
      analyzed: leads.filter((l) => l.analysis).length,
      sitesBuilt: leads.filter((l) => l.website?.path).length,
      emailsDrafted: leads.filter((l) => l.email?.body).length,
      qaPassed: leads.filter((l) => l.qa?.passed).length,
    };
  },
};

export default db;
