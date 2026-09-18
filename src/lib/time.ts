import { DayOfWeek, DiningResource, GbmPost } from '../types';

export const WEEKDAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "6:30 PM" -> minutes after midnight. "12:00 AM" at the end of a range means midnight (1440).
function parseClock(s: string): number | null {
  const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2] || 0);
}

// "6:30 PM - 8:00 PM" / "7:30 AM – 10:30 AM" -> [start, end] in minutes.
export function parseRange(s: string): [number, number] | null {
  const parts = s.split(/\s*[-–—]\s*/);
  if (parts.length < 2) return null;
  const a = parseClock(parts[0]);
  let b = parseClock(parts[1]);
  if (a == null || b == null) return null;
  if (b <= a) b += 24 * 60;
  return [a, b];
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function atMinutes(day: Date, minutes: number): Date {
  const x = startOfDay(day);
  x.setMinutes(minutes);
  return x;
}

export function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Placeholder posts only know a weekday + time string. Pin each to its next
// occurrence (today counts if it hasn't ended) so it lands on the calendar.
export function anchorSample(post: GbmPost, now = new Date()): GbmPost {
  const range = parseRange(post.timeStr) ?? [18 * 60, 19 * 60];
  const target = WEEKDAYS.indexOf(post.dayOfWeek);
  let day = startOfDay(now);
  let offset = (target - day.getDay() + 7) % 7;
  if (offset === 0 && atMinutes(day, range[1]) < now) offset = 7;
  day = addDays(day, offset);
  const start = atMinutes(day, range[0]);
  return {
    ...post,
    source: 'sample',
    isGbm: true,
    startISO: start.toISOString(),
    endISO: atMinutes(day, range[1]).toISOString(),
    dateStr: start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}

// Which opening windows a dining/pantry resource has on a given weekday.
export function resourceSlots(res: DiningResource, day: Date): { name: string; range: [number, number] }[] {
  const wd = day.getDay();
  const slots: { name: string; range: [number, number] }[] = [];
  for (const block of res.schedule) {
    if (!daysInclude(block.days, wd)) continue;
    const periods = block.mealPeriods?.length ? block.mealPeriods : [{ name: res.type === 'Pantry' ? 'Open' : 'Open hours', time: block.hours }];
    for (const p of periods) {
      if (/closed/i.test(p.time)) continue;
      const r = parseRange(p.time);
      if (r) slots.push({ name: p.name, range: r });
    }
  }
  return slots;
}

function daysInclude(spec: string, wd: number): boolean {
  if (/daily|every ?day/i.test(spec)) return true;
  const names = spec.split(/\s*[-–—]\s*/).map((n) => WEEKDAYS.findIndex((w) => n.trim().toLowerCase().startsWith(w.toLowerCase().slice(0, 3))));
  if (names.length === 1) return names[0] === wd;
  const [a, b] = names;
  if (a < 0 || b < 0) return false;
  return a <= b ? wd >= a && wd <= b : wd >= a || wd <= b;
}
