// Saves the next 35 days of approved GatorConnect events to
// public/data/gatorconnect-snapshot.json. The app classifies them client-side;
// this file is only the fallback when the live proxy is unreachable.
// Run: node scripts/snapshot-gatorconnect.mjs  (Node 18+, no dependencies)

import { mkdirSync, writeFileSync } from 'node:fs';

const API = 'https://gatorconnect.ufl.edu/api/discovery/event/search';
const KEEP = ['id', 'organizationName', 'organizationProfilePicture', 'name', 'description', 'location', 'startsOn', 'endsOn', 'imagePath', 'benefitNames', 'rsvpTotal'];

const now = new Date();
const until = new Date(now.getTime() + 35 * 86400000);
const events = [];
for (let skip = 0; skip < 1000; skip += 100) {
  const url = `${API}?endsAfter=${encodeURIComponent(now.toISOString())}&startsBefore=${encodeURIComponent(until.toISOString())}&orderByField=endsOn&orderByDirection=ascending&status=Approved&take=100&skip=${skip}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GatorConnect ${res.status} at skip=${skip}`);
  const page = await res.json();
  for (const e of page.value) {
    const slim = Object.fromEntries(KEEP.map((k) => [k, e[k] ?? null]));
    if (slim.description && slim.description.length > 3000) slim.description = slim.description.slice(0, 3000);
    events.push(slim);
  }
  if (events.length >= page['@odata.count'] || page.value.length === 0) break;
}

mkdirSync('public/data', { recursive: true });
writeFileSync('public/data/gatorconnect-snapshot.json', JSON.stringify({ fetchedAt: now.toISOString(), events }));
const tagged = events.filter((e) => (e.benefitNames || []).includes('Free Food')).length;
console.log(`Saved ${events.length} events (${tagged} tagged Free Food).`);
