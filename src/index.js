#!/usr/bin/env node
// LeadFlow Pro CLI.
//   leadflow run --query "dentists in Austin TX" --limit 5 [--mock]
//   leadflow status      # store stats
//   leadflow queue       # show outreach queue
//   leadflow doctor      # show which capabilities are live vs mock
import { config, has } from './config.js';
import { log } from './util/log.js';
import { runPipeline } from './pipeline.js';
import { db } from './store/db.js';
import { readQueue } from './outreach/queue.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

function doctor() {
  log.title('LeadFlow Pro — capability check');
  const rows = [
    ['Claude (copy/analysis)', has.claude()],
    ['Gemini (creative/QA partner)', has.gemini()],
    ['Google Places (discovery)', has.places()],
    ['SerpAPI (discovery fallback)', has.serp()],
  ];
  for (const [name, live] of rows) {
    log[live ? 'ok' : 'warn'](`${live ? 'LIVE' : 'MOCK'}  ${name}`);
  }
  log.info(`Outreach mode: ${config.outreach.mode} · QA threshold: ${config.runtime.qaThreshold} · max leads/run: ${config.runtime.maxLeads}`);
  if (!has.anyLLM()) log.info('No LLM keys set — running in fully deterministic MOCK mode (still produces real websites + emails).');
}

function status() {
  log.title('LeadFlow Pro — store stats');
  const s = db.stats();
  console.log(JSON.stringify(s, null, 2));
}

function showQueue() {
  log.title('Outreach queue');
  const q = readQueue();
  if (!q.length) return log.info('Queue is empty. Run a pipeline first.');
  for (const item of q) {
    log.step(`[${item.status}] ${item.business} → ${item.to || 'NO CONTACT'} (QA ${item.qaScore})`);
    log.detail(`subj: ${item.subject}`);
  }
  log.info(`${q.length} item(s). ${q.filter((i) => i.status === 'ready_for_review').length} ready for review.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'help';

  switch (cmd) {
    case 'run': {
      if (!args.query) { log.err('--query is required. e.g. leadflow run --query "plumbers in Denver" --limit 5'); process.exit(1); }
      await runPipeline({
        query: String(args.query),
        limit: args.limit ? Number(args.limit) : 10,
        mock: !!args.mock,
      });
      break;
    }
    case 'doctor': doctor(); break;
    case 'status': status(); break;
    case 'queue': showQueue(); break;
    default:
      console.log(`LeadFlow Pro — autonomous discovery → website → outreach engine

Usage:
  leadflow run --query "<search>" [--limit N] [--mock]   Run the full pipeline
  leadflow doctor                                         Show live vs mock capabilities
  leadflow status                                         Show store stats
  leadflow queue                                          Show the outreach queue

Examples:
  leadflow run --query "dentists in Austin TX" --limit 5
  leadflow run --query "plumbers in Toronto ON" --limit 3 --mock
`);
  }
}

main().catch((e) => { log.err(e.stack || e.message); process.exit(1); });
