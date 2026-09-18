// Turns an Instagram caption (+ OCR'd flyer text) into a dated free-food event.
// Everything is computed in Gainesville time, since the GitHub Action runs in UTC.

const TZ = 'America/New_York';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const NOT_SERVED = /\b(food (drive|insecurity|justice|systems?|science|pantry|bank|recovery|safety|waste)|canned food|meal packing|donat(e|ing|ions?) food)\b/gi;

export const FOOD_TERMS = [
  [/\bpizza\b/i, '🍕'],
  [/\btacos?\b|\bburritos?\b/i, '🌮'],
  [/\bboba\b|\bbubble tea\b/i, '🧋'],
  [/\bchick-?fil-?a\b|\bwings\b|\bchicken\b/i, '🍗'],
  [/\bdonuts?\b|\bdoughnuts?\b/i, '🍩'],
  [/\bice cream\b|\bgelato\b/i, '🍦'],
  [/\bcookies?\b|\bdesserts?\b|\bcupcakes?\b|\bsweets\b/i, '🍪'],
  [/\bbagels?\b|\bbreakfast\b|\bbrunch\b/i, '🥯'],
  [/\bsandwich(es)?\b|\bsubs\b/i, '🥪'],
  [/\bbbq\b|\bbarbecue\b|\bcookout\b|\bburgers?\b/i, '🍔'],
  [/\bpasta\b|\bdinner\b|\blunch\b|\bcater(ed|ing)\b|\bpotluck\b|\bfeast\b/i, '🍽️'],
  [/\bsnacks?\b|\brefreshments\b|\blight bites\b|\bpopcorn\b/i, '🍿'],
  [/\bfree food\b|\bfood (will be|is|provided|served)\b|\bfood\b/i, '🍽️'],
];

const GBM_RE = /\bGBM\b|\bgeneral (body )?meeting\b|\bgeneral member(ship)? meeting\b/i;

// Common UF buildings, so "come to Little 101" becomes a location.
const BUILDINGS = /\b(reitz( union)?|jwru|turlington|marston|library west|smathers|little hall|matherly|anderson|keene-?flint|carleton|pugh|norman|weil|neb|new engineering building|larsen|newell|malachowsky|cse|computer science|heavener|bryan|stuzin|gerson|rinker|fine arts [abcd]|fac|fad|the hub|gannett|plaza of the americas|century tower|hume|broward|rawlings|yulee|newins-ziegler|mcCarty [abcd]?|fifield|chemistry lab|nanoscale|black hall|benton|rolfs|griffin-floyd|flint|dauer|tigert|criser|ustler|nrn|southwest rec|student rec|o'?connell|flavet( field)?|healthy gators|hssb)\b(\s*(hall|auditorium|room|rm\.?|#)?\s*[a-z]?\d{2,4}[a-z]?)?/i;

function etParts(date) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month - 1, d: +p.day, wd: WEEKDAYS.indexOf(p.weekday.toLowerCase().slice(0, 3)), h: +p.hour % 24, min: +p.minute };
}

// Wall-clock Gainesville time -> Date.
export function etDate(y, m, d, minutes) {
  const guess = Date.UTC(y, m, d, 0, minutes);
  const p = etParts(new Date(guess));
  const asUtc = Date.UTC(p.y, p.m, p.d, p.h, p.min);
  return new Date(guess - (asUtc - guess));
}

function dayDiff(a, b) {
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86400000);
}

function addDaysYmd({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
}

function findDate(text, posted) {
  const withYear = (m, d) => {
    let y = posted.y;
    if (dayDiff(posted, { y, m, d }) < -60) y += 1;
    return { y, m, d };
  };
  let mt = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (mt) return withYear(MONTHS.indexOf(mt[1].toLowerCase().slice(0, 3)), +mt[2]);
  mt = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i);
  if (mt) return withYear(MONTHS.indexOf(mt[2].toLowerCase()), +mt[1]);
  mt = text.match(/(?<![\d/])(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?(?![\d/])/);
  if (mt && +mt[1] >= 1 && +mt[1] <= 12 && +mt[2] >= 1 && +mt[2] <= 31) return withYear(+mt[1] - 1, +mt[2]);
  if (/\b(tonight|today)\b/i.test(text)) return { y: posted.y, m: posted.m, d: posted.d };
  if (/\btomorrow\b/i.test(text)) return addDaysYmd(posted, 1);
  mt = text.match(/\b(mon|tue|tues|wed|wednes|thu|thur|thurs|fri|sat|satur|sun)(?:day)?s?\b/i);
  if (mt) {
    const wd = WEEKDAYS.indexOf(mt[1].toLowerCase().slice(0, 3));
    return addDaysYmd(posted, (wd - posted.wd + 7) % 7);
  }
  return null;
}

function toMin(h, m, ap) {
  let hh = +h % 12;
  if (ap.startsWith('p')) hh += 12;
  return hh * 60 + +(m || 0);
}

function findTime(text) {
  // "6P" / "6:30p" -> "6pm", so the patterns below catch flyer shorthand.
  const t = text.replace(/\./g, '').toLowerCase().replace(/(\d)\s?([ap])\b/g, '$1$2m');
  let mt = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until|till)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (mt) {
    const endAp = mt[6];
    let startAp = mt[3] || endAp;
    // "11-1pm": the start is in the morning.
    if (!mt[3] && +mt[1] % 12 > +mt[4] % 12) startAp = endAp === 'pm' ? 'am' : 'pm';
    const s = toMin(mt[1], mt[2], startAp);
    let e = toMin(mt[4], mt[5], endAp);
    if (e <= s) e += 24 * 60;
    return [s, e];
  }
  mt = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (mt) {
    const s = toMin(mt[1], mt[2], mt[3]);
    return [s, s + 90];
  }
  // "5:30-7" with no am/pm: club meetings between 1 and 11 are afternoon/evening.
  // Needs a colon somewhere so "9/21-9/25" or "grades 5-7" don't match.
  mt = t.match(/(?<![\d/])(\d{1,2})(?::(\d{2}))?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?(?![\d/])/);
  if (mt && (mt[2] || mt[4]) && +mt[1] >= 1 && +mt[1] <= 11 && +mt[3] <= 11) {
    const s = toMin(mt[1], mt[2], 'pm');
    let e = toMin(mt[3], mt[4], 'pm');
    if (e <= s) e += 12 * 60;
    return [s, e];
  }
  return null;
}

function findLocation(text) {
  const tagged = text.match(/(?:📍|location\s*[:\-]|where\s*[:\-]|room\s*[:\-])\s*([^\n#|•\p{Extended_Pictographic}]{3,70})/iu);
  if (tagged) return tagged[1].trim().replace(/[.,!]+$/, '');
  const b = text.match(BUILDINGS);
  if (b) return b[0].trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return null;
}

const clean = (l) => l.replace(/#[\w.]+/g, '').replace(/@[\w.]+/g, (m) => m.slice(1)).replace(/[^\p{L}\p{N}\s&'’!?:,./\-]/gu, '').replace(/\s+/g, ' ').trim();
const GENERIC = /^(see you (there|soon)|join us|come (out|through)|save the date|don'?t miss (it|out)|link in bio)[!. ]*$/i;

// Caption's first real line. If that's filler ("See you there!!"), fall back to
// "Club — Free brunch": OCR'd headlines on stylized flyers are too garbled to show.
function titleFrom(caption, org, isGbm, food) {
  const t = (caption || '').split('\n').map(clean).find((l) => l.length >= 12 && !GENERIC.test(l));
  if (!t) return `${org} ${isGbm ? 'GBM' : ''} — ${food}`.replace(/\s+—/, ' —');
  return t.length > 70 ? t.slice(0, 67).trimEnd() + '…' : t;
}

export function needsOcr(caption) {
  const c = caption || '';
  return !findTime(c) || !findDate(c, etParts(new Date())) || !FOOD_TERMS.some(([re]) => re.test(c.replace(NOT_SERVED, ' ')));
}

// Returns null unless the post advertises an upcoming event with food.
export function parsePost({ caption, ocrText, timestamp, handle, org }) {
  const text = `${caption || ''}\n${ocrText || ''}`;
  const scrubbed = text.replace(NOT_SERVED, ' ');
  const term = FOOD_TERMS.find(([re]) => re.test(scrubbed));
  if (!term) return null;

  const posted = etParts(new Date(timestamp));
  // Posts often list several events; the line that mentions food is the one we
  // want, so read date/time/place from it first. Then caption, then OCR (noisier).
  const foodLines = text.split('\n').filter((l) => term[0].test(l.replace(NOT_SERVED, ' ')));
  const sources = [...foodLines, caption || '', ocrText || ''];
  const pick = (fn) => { for (const src of sources) { const v = fn(src); if (v) return v; } return null; };
  const date = pick((src) => findDate(src, posted));
  const time = pick(findTime);
  if (!date || !time) return null;
  const ahead = dayDiff(posted, date);
  if (ahead < 0 || ahead > 45) return null;

  const start = etDate(date.y, date.m, date.d, time[0]);
  const end = etDate(date.y, date.m, date.d, time[1]);
  const isGbm = GBM_RE.test(text);
  const word = scrubbed.match(term[0])[0].toLowerCase();
  const sentence = (caption || '').replace(NOT_SERVED, ' ').split(/(?<=[.!?\n])\s+/).find((s) => term[0].test(s)) || '';

  return {
    title: titleFrom(caption, org, isGbm, word === 'food' || word === 'free food' ? 'Free food' : `Free ${word}`),
    start: start.toISOString(),
    end: end.toISOString(),
    location: pick(findLocation) || 'See Instagram post',
    food: word === 'food' || word === 'free food' ? 'Free food' : `Free ${word}`,
    foodSnippet: sentence.replace(/\s+/g, ' ').trim().slice(0, 140),
    emoji: term[1],
    isGbm,
    dietary: ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Dairy-Free'].filter((t) => new RegExp(`\\b${t.replace('-', '[- ]')}\\b`, 'i').test(text)),
  };
}
