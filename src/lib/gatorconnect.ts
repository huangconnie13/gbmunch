// Live GBM data from GatorConnect (UF's Campus Labs Engage instance).
// The discovery API is public (no login, no key), but it sends no CORS headers,
// so the browser goes through /api/gc — a Vite dev proxy locally and a Vercel
// rewrite in production. If that fails we fall back to the committed snapshot
// that the GitHub Action refreshes every 6 hours.

import { DayOfWeek, DietaryTag, GbmPost, MealCategory } from '../types';

export interface RawGcEvent {
  id: string;
  organizationName: string;
  organizationProfilePicture: string | null;
  name: string;
  description: string | null;
  location: string | null;
  startsOn: string;
  endsOn: string;
  imagePath: string | null;
  benefitNames: string[] | null;
  rsvpTotal: number | null;
}

export interface LiveFeed {
  posts: GbmPost[];
  source: 'live' | 'snapshot' | 'none';
  fetchedAt: string | null;
  scanned: number;
}

const IMG = 'https://se-images.campuslabs.com/clink/images/';
const WINDOW_DAYS = 35;

// Phrases that contain food words but don't mean food is served.
const NOT_SERVED = /\b(food (drive|insecurity|justice|systems?|science|pantry|bank|recovery|safety|waste)|canned food|meal packing|donat(e|ing|ions?) food)\b/gi;

const FOOD_TERMS: [RegExp, string][] = [
  [/\bpizza\b/i, '🍕'],
  [/\btacos?\b|\bburritos?\b/i, '🌮'],
  [/\bboba\b|\bbubble tea\b/i, '🧋'],
  [/\bchick-?fil-?a\b|\bwings\b|\bchicken\b/i, '🍗'],
  [/\bdonuts?\b|\bdoughnuts?\b/i, '🍩'],
  [/\bice cream\b|\bgelato\b/i, '🍦'],
  [/\bcookies?\b|\bdesserts?\b|\bcupcakes?\b|\bcake\b|\bsweets\b/i, '🍪'],
  [/\bbagels?\b|\bbreakfast\b|\bbrunch\b|\bcoffee\b/i, '🥯'],
  [/\bsandwich(es)?\b|\bsubs\b|\bwraps?\b/i, '🥪'],
  [/\bbbq\b|\bbarbecue\b|\bcookout\b|\bburgers?\b/i, '🍔'],
  [/\bpasta\b|\bdinner\b|\blunch\b|\bmeal\b|\bcater(ed|ing)\b|\bpotluck\b|\bfeast\b/i, '🍽️'],
  [/\bsnacks?\b|\brefreshments\b|\blight bites\b|\bpopcorn\b/i, '🍿'],
  [/\bfree food\b|\bfood (will be|is|provided|served)\b|\bfood\b/i, '🍽️'],
];

const GBM_RE = /\bGBM\b|\bgeneral (body )?meeting\b|\bgeneral member(ship)? meeting\b/i;

const GRADIENTS = [
  'from-orange-600 via-amber-600 to-rose-800',
  'from-blue-700 via-indigo-700 to-slate-900',
  'from-emerald-600 via-teal-700 to-slate-900',
  'from-fuchsia-600 via-purple-700 to-slate-900',
  'from-rose-600 via-red-700 to-slate-900',
  'from-sky-600 via-cyan-700 to-slate-900',
];

const CATEGORY_RULES: [RegExp, GbmPost['category']][] = [
  [/\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b.*\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b|sorority|fraternity/i, 'Greek'],
  [/engineer|ieee|asme|aiche|shpe|nsbe|\bswe\b|robot|aerospace|rocket/i, 'Engineering'],
  [/comput|\bacm\b|\bdata\b|\bai\b|artificial|cyber|software|coding|hack|tech|machine learning/i, 'Tech'],
  [/\bpre-|business|finance|consult|law|medic|health|pharm|dental|nurs|accounting|marketing|invest|professional|career|leadership/i, 'Pre-Professional'],
  [/asian|hispanic|latin|african|black|chinese|indian|korean|vietnam|filipino|caribbean|haitian|muslim|jewish|hillel|chabad|cultur|arab|persian|japanese|taiwan|brazil|international|students? association|scholars/i, 'Cultural'],
  [/\bart|music|danc|theat|film|photo|design|writ|a cappella|choir|poetry|improv/i, 'Creative'],
];

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function stripHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function hashIndex(s: string, n: number): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % n;
}

function mealCategoryFor(start: Date, text: string): MealCategory {
  const h = start.getHours();
  if (/\bsnacks?\b|\brefreshments\b|\blight bites\b|\bcookies?\b/i.test(text) && !/\bdinner|lunch|pizza|catered\b/i.test(text)) return 'Snack';
  if (h >= 21) return 'Late Night';
  if (h >= 16) return 'Dinner';
  if (h >= 11) return 'Lunch';
  return 'Snack';
}

const VALUE: Record<MealCategory, number> = { Dinner: 12, Lunch: 10, 'Late Night': 7, Snack: 4 };

// Pull the sentence that mentions food, so the card can say what's being served.
function foodSnippet(text: string, re: RegExp): string | null {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const hit = sentences.find((s) => re.test(s));
  if (!hit) return null;
  return hit.length > 140 ? hit.slice(0, 137).trimEnd() + '…' : hit;
}

export function classify(ev: RawGcEvent): GbmPost | null {
  const description = stripHtml(ev.description);
  const text = `${ev.name}. ${description}`;
  const scrubbed = text.replace(NOT_SERVED, ' ');
  const tagged = (ev.benefitNames || []).includes('Free Food');
  const term = FOOD_TERMS.find(([re]) => re.test(scrubbed));
  if (!tagged && !term) return null;

  const start = new Date(ev.startsOn);
  const end = new Date(ev.endsOn);
  // Multi-day tabling / retreats aren't meals.
  if (end.getTime() - start.getTime() > 8 * 3600 * 1000) return null;

  const emoji = term ? term[1] : '🍽️';
  const snippet = term ? foodSnippet(scrubbed, term[0]) : null;
  const word = term ? scrubbed.match(term[0])![0].toLowerCase() : null;
  const freeFoodItem = !word || word === 'food' || word === 'free food' ? 'Free food' : `Free ${word}`;
  const dietaryTags: DietaryTag[] = [];
  if (/\bvegan\b/i.test(text)) dietaryTags.push('Vegan');
  if (/\bvegetarian\b|\bveggie\b/i.test(text)) dietaryTags.push('Vegetarian');
  if (/\bhalal\b/i.test(text)) dietaryTags.push('Halal');
  if (/gluten[- ]free/i.test(text)) dietaryTags.push('Gluten-Free');
  if (/dairy[- ]free/i.test(text)) dietaryTags.push('Dairy-Free');

  const category = CATEGORY_RULES.find(([re]) => re.test(ev.organizationName))?.[1] ?? 'Community';
  const mealCategory = mealCategoryFor(start, scrubbed);

  return {
    id: `gc-${ev.id}`,
    clubName: ev.organizationName,
    clubHandle: ev.organizationName,
    avatarUrl: ev.organizationProfilePicture
      ? `${IMG}${ev.organizationProfilePicture}?preset=small-sq`
      : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(ev.organizationName)}`,
    category,
    title: ev.name,
    dayOfWeek: DAYS[start.getDay()],
    dateStr: start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    timeStr: `${formatTime(start)} - ${formatTime(end)}`,
    location: ev.location || 'Location on GatorConnect',
    freeFoodItem,
    foodDescription: snippet || 'The club tagged this event as having free food on GatorConnect.',
    dietaryTags,
    mealCategory,
    likesCount: ev.rsvpTotal || 0,
    commentsCount: 0,
    flyerTheme: { bgGradient: GRADIENTS[hashIndex(ev.id, GRADIENTS.length)], accentColor: '#f97316', badgeEmoji: emoji },
    verifiedFreeFood: tagged,
    caption: description || ev.name,
    estimatedValue: VALUE[mealCategory],
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    source: 'gatorconnect',
    isGbm: GBM_RE.test(text),
    imageUrl: ev.imagePath ? `${IMG}${ev.imagePath}?preset=med-w` : undefined,
    sourceUrl: `https://gatorconnect.ufl.edu/event/${ev.id}`,
  };
}

async function fetchLive(): Promise<RawGcEvent[]> {
  const now = new Date();
  const until = new Date(now.getTime() + WINDOW_DAYS * 86400000);
  const base =
    `/api/gc/event/search?endsAfter=${encodeURIComponent(now.toISOString())}` +
    `&startsBefore=${encodeURIComponent(until.toISOString())}` +
    `&orderByField=endsOn&orderByDirection=ascending&status=Approved&take=100`;
  const out: RawGcEvent[] = [];
  for (let skip = 0; skip < 1000; skip += 100) {
    const res = await fetch(`${base}&skip=${skip}`);
    if (!res.ok) throw new Error(`GatorConnect ${res.status}`);
    const page = await res.json();
    out.push(...page.value);
    if (out.length >= page['@odata.count'] || page.value.length === 0) break;
  }
  return out;
}

function toPosts(raw: RawGcEvent[]): GbmPost[] {
  const now = Date.now();
  const seen = new Set<string>();
  return raw
    .map(classify)
    .filter((p): p is GbmPost => {
      if (!p || new Date(p.endISO!).getTime() <= now) return false;
      // Clubs sometimes publish the same meeting twice.
      const key = `${p.clubName}|${p.title}|${p.startISO}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function loadLiveGbms(): Promise<LiveFeed> {
  try {
    const raw = await fetchLive();
    return { posts: toPosts(raw), source: 'live', fetchedAt: new Date().toISOString(), scanned: raw.length };
  } catch (err) {
    console.warn('Live GatorConnect fetch failed, using snapshot', err);
  }
  try {
    const res = await fetch('/data/gatorconnect-snapshot.json');
    const snap = await res.json();
    return { posts: toPosts(snap.events), source: 'snapshot', fetchedAt: snap.fetchedAt, scanned: snap.events.length };
  } catch (err) {
    console.warn('Snapshot unavailable', err);
    return { posts: [], source: 'none', fetchedAt: null, scanned: 0 };
  }
}
