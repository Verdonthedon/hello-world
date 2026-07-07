// Outreach queue. Appends ready-to-send drafts to a local JSONL queue with
// status tracking. DRAFT-ONLY by design — nothing is ever auto-sent. A human
// (or a Gmail-drafts integration) reviews and sends. CAN-SPAM / CASL safe.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { log } from '../util/log.js';

const QUEUE_PATH = () => path.join(config.root, config.runtime.outputDir, 'outreach-queue.jsonl');

export function enqueue(item) {
  if (config.outreach.mode === 'off') {
    log.warn('OUTREACH_MODE=off — skipping queue write');
    return null;
  }
  const file = QUEUE_PATH();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const record = {
    leadId: item.leadId,
    business: item.business,
    to: item.to,
    toConfidence: item.toConfidence,
    subject: item.subject,
    body: item.body,
    framework: item.framework,
    sequence: item.sequence || null,
    websitePreview: item.websitePreview,
    demoPreview: item.demoPreview || null,
    qaScore: item.qaScore,
    status: item.to ? 'ready_for_review' : 'needs_contact',
    queuedAt: new Date().toISOString(),
    sentAt: null,
  };
  fs.appendFileSync(file, JSON.stringify(record) + '\n');
  return record;
}

export function readQueue() {
  const file = QUEUE_PATH();
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

export default { enqueue, readQueue };
