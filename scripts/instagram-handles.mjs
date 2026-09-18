// Builds scripts/data/instagram-handles.json from the Instagram links clubs put
// on their GatorConnect profiles. Re-run occasionally; the list changes slowly.
// Add clubs that don't list one on GatorConnect to scripts/data/instagram-extra.json.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = 'https://gatorconnect.ufl.edu/api/discovery';
const orgs = [];
for (let skip = 0; ; skip += 100) {
  const page = await (await fetch(`${BASE}/search/organizations?top=100&skip=${skip}&filter=&query=`)).json();
  orgs.push(...page.value);
  if (orgs.length >= page['@odata.count'] || !page.value.length) break;
}

function handleFrom(url) {
  if (!url) return null;
  const m = String(url).trim().match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{2,30})\/?(?:\?.*)?$/i);
  if (!m) return null;
  const h = m[1].toLowerCase();
  return ['p', 'explore', 'accounts', 'reel', 'stories'].includes(h) ? null : h;
}

const out = new Map();
const queue = [...orgs];
await Promise.all(Array.from({ length: 12 }, async () => {
  while (queue.length) {
    const o = queue.pop();
    try {
      const d = await (await fetch(`${BASE}/organization/bykey/${o.WebsiteKey}`)).json();
      const h = handleFrom(d.socialMedia?.InstagramUrl);
      if (h) out.set(h, { handle: h, org: o.Name });
    } catch { /* skip org */ }
  }
}));

const extraPath = 'scripts/data/instagram-extra.json';
if (existsSync(extraPath)) for (const e of JSON.parse(readFileSync(extraPath, 'utf8'))) out.set(e.handle.toLowerCase(), e);

const list = [...out.values()].sort((a, b) => a.handle.localeCompare(b.handle));
writeFileSync('scripts/data/instagram-handles.json', JSON.stringify(list, null, 1));
console.log(`${orgs.length} orgs scanned, ${list.length} Instagram handles saved.`);
