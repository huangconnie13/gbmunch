// Scrapes recent posts from UF club Instagrams (via Apify's free monthly credit),
// reads flyer text with OCR when the caption is thin, keeps upcoming events that
// serve food, and writes public/data/instagram-snapshot.json + flyer images.
//
//   node scripts/snapshot-instagram.mjs              # full run (spends Apify credit, capped)
//   node scripts/snapshot-instagram.mjs --limit 5    # tiny test run on 5 handles
//   node scripts/snapshot-instagram.mjs --cached     # re-parse the last run, $0
//
// Needs APIFY_TOKEN in the environment or in .env.local. IG_MAX_USD caps the
// spend per run (default $0.60 ≈ 350 posts; the free plan gives $5/month).

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { needsOcr, parsePost } from './lib/parse-post.mjs';

const ACTOR = 'apify~instagram-post-scraper';
const RAW_CACHE = '.cache/instagram-raw.json';
const OUT = 'public/data/instagram-snapshot.json';
const IMG_DIR = 'public/data/ig';

const args = process.argv.slice(2);
const cached = args.includes('--cached');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

function env(name) {
  if (process.env[name]) return process.env[name];
  if (existsSync('.env.local')) {
    const m = readFileSync('.env.local', 'utf8').match(new RegExp(`^${name}\\s*=\\s*"?([^"\\n]+)"?`, 'm'));
    if (m) return m[1].trim();
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const handles = JSON.parse(readFileSync('scripts/data/instagram-handles.json', 'utf8')).slice(0, limit);
const orgByHandle = Object.fromEntries(handles.map((h) => [h.handle, h.org]));

async function scrape() {
  const token = env('APIFY_TOKEN');
  if (!token) throw new Error('APIFY_TOKEN missing — add it to .env.local or the environment.');
  const maxUsd = Number(env('IG_MAX_USD') || 0.6);
  const api = (path, init) =>
    fetch(`https://api.apify.com/v2${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }).then(async (r) => {
      const body = await r.json();
      if (!r.ok) throw new Error(`Apify ${r.status}: ${JSON.stringify(body.error || body)}`);
      return body.data ?? body;
    });

  const input = {
    username: handles.map((h) => h.handle),
    resultsLimit: 3,
    onlyPostsNewerThan: '7 days', // runs are 3-4 days apart; keeps a run ≈ $0.25
    skipPinnedPosts: true,
    dataDetailLevel: 'basicData', // detailed data is a paid add-on we don't need
  };
  const run = await api(`/acts/${ACTOR}/runs?maxTotalChargeUsd=${maxUsd}`, { method: 'POST', body: JSON.stringify(input) });
  console.log(`Apify run ${run.id} started for ${handles.length} handles (cap $${maxUsd}).`);
  let status = run;
  while (['READY', 'RUNNING'].includes(status.status)) {
    await sleep(10000);
    status = await api(`/actor-runs/${run.id}`);
    process.stdout.write(`  ${status.status} · ${status.stats?.resultCount ?? '?'} posts\r`);
  }
  console.log(`\nRun ${status.status}; charged ~$${(status.usageTotalUsd ?? 0).toFixed(3)}.`);
  if (!['SUCCEEDED', 'ABORTED', 'TIMED-OUT'].includes(status.status)) throw new Error(`Run ended ${status.status}`);
  const items = await api(`/datasets/${status.defaultDatasetId}/items?clean=true&format=json`);
  mkdirSync('.cache', { recursive: true });
  writeFileSync(RAW_CACHE, JSON.stringify({ fetchedAt: new Date().toISOString(), items }));
  return { fetchedAt: new Date().toISOString(), items };
}

let worker = null;
async function ocr(url) {
  if (!worker) {
    const { createWorker } = await import('tesseract.js');
    mkdirSync('.cache', { recursive: true });
    worker = await createWorker('eng', 1, { cachePath: '.cache' });
  }
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const { data } = await worker.recognize(buf);
    return data.text;
  } catch (err) {
    console.warn(`  OCR failed: ${err.message}`);
    return '';
  }
}

const raw = cached ? JSON.parse(readFileSync(RAW_CACHE, 'utf8')) : await scrape();
const items = raw.items.filter((p) => p.caption !== undefined || p.displayUrl);
console.log(`${items.length} posts to parse.`);

mkdirSync(IMG_DIR, { recursive: true });
const posts = [];
let ocrCount = 0;
for (const p of items) {
  const handle = (p.ownerUsername || '').toLowerCase();
  const org = orgByHandle[handle] || p.ownerFullName || handle;
  let ocrText = '';
  if (p.ocrText !== undefined) ocrText = p.ocrText;
  else if (p.displayUrl && needsOcr(p.caption) && (p.dimensionsWidth ?? 1080) >= 200) {
    ocrText = p.ocrText = await ocr(p.displayUrl);
    ocrCount++;
  }
  const ev = parsePost({ caption: p.caption, ocrText, timestamp: p.timestamp, handle, org });
  if (!ev || new Date(ev.end) < new Date()) continue;

  // Instagram CDN links expire and block hotlinking, so keep our own copy.
  let image = null;
  if (p.displayUrl) {
    try {
      const file = `${p.shortCode || p.id}.jpg`;
      writeFileSync(`${IMG_DIR}/${file}`, Buffer.from(await (await fetch(p.displayUrl)).arrayBuffer()));
      image = `/data/ig/${file}`;
    } catch { /* card falls back to the gradient flyer */ }
  }
  posts.push({ id: `ig-${p.shortCode || p.id}`, handle, org, caption: (p.caption || '').slice(0, 1500), url: p.url, image, postedAt: p.timestamp, ...ev });
  console.log(`  ✓ @${handle}: ${ev.title} — ${new Date(ev.start).toLocaleString('en-US', { timeZone: 'America/New_York' })} — ${ev.food}`);
}
if (worker) await worker.terminate();
// Remember OCR results so --cached re-parses are instant.
if (ocrCount) writeFileSync(RAW_CACHE, JSON.stringify(raw));

const keep = new Set(posts.map((p) => p.image?.split('/').pop()));
for (const f of readdirSync(IMG_DIR)) if (!keep.has(f)) rmSync(`${IMG_DIR}/${f}`);

writeFileSync(OUT, JSON.stringify({ fetchedAt: raw.fetchedAt, handles: handles.length, scanned: items.length, posts }, null, 1));
console.log(`OCR'd ${ocrCount} flyers. Saved ${posts.length} upcoming free-food posts to ${OUT}.`);
