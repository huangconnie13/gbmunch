import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, GripVertical, MapPin, Plus, Search, Check, Trash2, Wand2, X, Radio } from 'lucide-react';
import { CalendarEntry, DiningResource, GbmPost } from '../types';
import { addDays, atMinutes, fmtTime, minutesOf, resourceSlots, sameDay, startOfDay } from '../lib/time';

const START_HOUR = 7;
const END_HOUR = 24;
const HOUR_PX = 56;
const GRID_PX = (END_HOUR - START_HOUR) * HOUR_PX;

type DragItem =
  | { type: 'post'; post: GbmPost }
  | { type: 'resource'; res: DiningResource }
  | { type: 'entry'; entry: CalendarEntry; res: DiningResource };

interface Ghost {
  dayIdx: number;
  start: Date;
  end: Date;
  label: string;
  closed?: boolean;
}

interface Props {
  posts: GbmPost[];
  resources: DiningResource[];
  entries: CalendarEntry[];
  setEntries: React.Dispatch<React.SetStateAction<CalendarEntry[]>>;
  toast: (msg: string) => void;
}

function uid() {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function postToEntry(post: GbmPost): CalendarEntry {
  return {
    id: uid(),
    sourceId: post.id,
    kind: 'GBM',
    title: post.title,
    subtitle: post.clubName,
    start: post.startISO!,
    end: post.endISO!,
    food: post.freeFoodItem,
    location: post.location,
    savings: post.estimatedValue,
    live: post.source === 'gatorconnect' || post.source === 'instagram',
  };
}

function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}

// Where a pantry/dining drop lands: the open window nearest the cursor. Short
// windows (a meal period) are taken whole; long ones (a pantry open 9–6) become
// a 1-hour visit at the cursor, clamped inside the window.
function snapResource(res: DiningResource, day: Date, cursorMin: number): Ghost | null {
  const slots = resourceSlots(res, day);
  if (!slots.length) return null;
  const dist = (r: [number, number]) => (cursorMin < r[0] ? r[0] - cursorMin : cursorMin > r[1] ? cursorMin - r[1] : 0);
  const slot = slots.reduce((best, s) => (dist(s.range) < dist(best.range) ? s : best));
  const [a, b] = slot.range;
  let s = a;
  let e = b;
  if (b - a > 180) {
    const len = res.type === 'Pantry' ? 60 : 90;
    s = Math.min(Math.max(Math.round(cursorMin / 30) * 30, a), b - len);
    e = s + len;
  }
  return { dayIdx: -1, start: atMinutes(day, s), end: atMinutes(day, e), label: slot.name };
}

// Side-by-side columns for overlapping blocks within one day.
function layoutDay(items: CalendarEntry[]) {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
  const out = new Map<string, { col: number; cols: number }>();
  let group: CalendarEntry[] = [];
  let groupEnd = 0;
  const flush = () => {
    const colEnds: number[] = [];
    const cols = new Map<string, number>();
    for (const it of group) {
      const s = new Date(it.start).getTime();
      let c = colEnds.findIndex((end) => end <= s);
      if (c < 0) c = colEnds.length;
      colEnds[c] = new Date(it.end).getTime();
      cols.set(it.id, c);
    }
    for (const it of group) out.set(it.id, { col: cols.get(it.id)!, cols: colEnds.length });
    group = [];
  };
  for (const it of sorted) {
    const s = new Date(it.start).getTime();
    if (group.length && s >= groupEnd) flush();
    group.push(it);
    groupEnd = Math.max(groupEnd, new Date(it.end).getTime());
  }
  if (group.length) flush();
  return out;
}

function toIcs(entries: CalendarEntry[]) {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GBMunch//EN'];
  for (const e of entries) {
    lines.push('BEGIN:VEVENT', `UID:${e.id}@gbmunch`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`,
      `SUMMARY:${esc(`🍽️ ${e.title}`)}`, `LOCATION:${esc(e.location)}`, `DESCRIPTION:${esc(`${e.subtitle} — ${e.food}`)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

const KIND_STYLE: Record<string, string> = {
  live: 'bg-orange-50 border-orange-500 text-orange-950',
  sample: 'bg-amber-50 border-amber-400 text-amber-950',
  Pantry: 'bg-emerald-50 border-emerald-500 text-emerald-950',
  Dining: 'bg-indigo-50 border-indigo-500 text-indigo-950',
};

export const WeekCalendar: React.FC<Props> = ({ posts, resources, entries, setEntries, toast }) => {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()));
  const [tab, setTab] = useState<'gbm' | 'food'>('gbm');
  const [query, setQuery] = useState('');
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Most GBMs are in the evening; open the grid at 11 AM.
    if (scrollRef.current) scrollRef.current.scrollTop = (11 - START_HOUR) * HOUR_PX;
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = days[6];
  const inWeek = (iso: string) => {
    const d = new Date(iso);
    return d >= weekStart && d < addDays(weekStart, 7);
  };

  const weekPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => p.startISO && inWeek(p.startISO))
      .filter((p) => !q || `${p.title} ${p.clubName} ${p.freeFoodItem} ${p.location}`.toLowerCase().includes(q))
      .sort((a, b) => a.startISO!.localeCompare(b.startISO!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, weekStart, query]);

  const weekEntries = entries.filter((e) => inWeek(e.start));
  const scheduledIds = new Set(entries.map((e) => e.sourceId));

  const cursorMinutes = (e: React.DragEvent, col: HTMLElement) => {
    const y = e.clientY - col.getBoundingClientRect().top;
    return START_HOUR * 60 + Math.round(((y / HOUR_PX) * 60) / 15) * 15;
  };

  const computeGhost = (item: DragItem, dayIdx: number, cursorMin: number): Ghost | null => {
    if (item.type === 'post') {
      const start = new Date(item.post.startISO!);
      const idx = days.findIndex((d) => sameDay(d, start));
      if (idx < 0) return null;
      return { dayIdx: idx, start, end: new Date(item.post.endISO!), label: item.post.clubName };
    }
    const g = snapResource(item.res, days[dayIdx], cursorMin);
    if (!g) return { dayIdx, start: atMinutes(days[dayIdx], cursorMin), end: atMinutes(days[dayIdx], cursorMin + 60), label: 'Closed this day', closed: true };
    return { ...g, dayIdx };
  };

  const onColumnDragOver = (e: React.DragEvent<HTMLDivElement>, dayIdx: number) => {
    if (!drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = drag.type === 'entry' ? 'move' : 'copy';
    const g = computeGhost(drag, dayIdx, cursorMinutes(e, e.currentTarget));
    setGhost((prev) =>
      prev && g && prev.dayIdx === g.dayIdx && prev.start.getTime() === g.start.getTime() && prev.end.getTime() === g.end.getTime() ? prev : g,
    );
  };

  const addEntry = (entry: CalendarEntry) => {
    const clash = entries.find((x) => x.id !== entry.id && overlaps(x, entry));
    setEntries((prev) => [...prev.filter((x) => x.id !== entry.id), entry]);
    return clash;
  };

  const onColumnDrop = (e: React.DragEvent<HTMLDivElement>, dayIdx: number) => {
    e.preventDefault();
    const item = drag;
    const g = item ? computeGhost(item, dayIdx, cursorMinutes(e, e.currentTarget)) : null;
    setDrag(null);
    setGhost(null);
    if (!item || !g) return;
    if (g.closed) {
      toast(`${item.type === 'post' ? '' : item.res.name} is closed ${days[dayIdx].toLocaleDateString('en-US', { weekday: 'long' })}`);
      return;
    }
    const when = `${g.start.toLocaleDateString('en-US', { weekday: 'short' })} ${fmtTime(g.start)}`;
    if (item.type === 'post') {
      if (scheduledIds.has(item.post.id)) return toast('Already on your calendar');
      const clash = addEntry(postToEntry(item.post));
      const snapped = g.dayIdx !== dayIdx ? ` — snapped to ${when}, when it actually meets` : ` at ${when}`;
      return toast(`Added ${item.post.clubName}${snapped}${clash ? ` (overlaps "${clash.title}")` : ''}`);
    }
    const base = item.type === 'entry' ? item.entry : null;
    const res = item.res;
    const entry: CalendarEntry = {
      id: base?.id ?? uid(),
      sourceId: res.id,
      kind: res.type === 'Pantry' ? 'Pantry' : 'Dining',
      title: res.name,
      subtitle: g.label,
      start: g.start.toISOString(),
      end: g.end.toISOString(),
      food: res.type === 'Pantry' ? 'Free groceries & produce' : 'Dining hall meal',
      location: res.location,
      savings: res.type === 'Pantry' ? 25 : 0,
    };
    const clash = addEntry(entry);
    toast(clash ? `Snapped to ${when}, but it overlaps "${clash.title}"` : `Snapped to ${g.label} · ${when}–${fmtTime(g.end)}`);
  };

  const endDrag = () => {
    setDrag(null);
    setGhost(null);
  };

  const clickAddPost = (post: GbmPost) => {
    if (scheduledIds.has(post.id)) return toast('Already on your calendar');
    const clash = addEntry(postToEntry(post));
    toast(clash ? `Added, but it overlaps "${clash.title}"` : `Added ${post.clubName}`);
  };

  const autoPlan = () => {
    let added = 0;
    const next = [...entries];
    for (const p of weekPosts) {
      if (scheduledIds.has(p.id) || new Date(p.endISO!) < now) continue;
      const e = postToEntry(p);
      if (next.some((x) => overlaps(x, e))) continue;
      next.push(e);
      added++;
    }
    setEntries(next);
    toast(added ? `Auto-planned ${added} free-food event${added > 1 ? 's' : ''} with no overlaps` : 'Nothing new fits this week');
  };

  const exportIcs = () => {
    if (!weekEntries.length) return toast('Nothing to export this week');
    const url = URL.createObjectURL(new Blob([toIcs(weekEntries)], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `gbmunch-${weekStart.toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearWeek = () => {
    setEntries((prev) => prev.filter((e) => !inWeek(e.start)));
    toast('Cleared this week');
  };

  const saved = weekEntries.reduce((s, e) => s + e.savings, 0);
  const meals = weekEntries.filter((e) => e.kind !== 'Dining' || e.savings > 0).length;
  const targetDay = drag?.type === 'post' ? days.findIndex((d) => sameDay(d, new Date(drag.post.startISO!))) : -1;
  const rangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
      {/* Left rail: things you can drag */}
      <aside className="lg:w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:max-h-[calc(100vh-7rem)] lg:sticky lg:top-20">
        <div className="p-3 border-b border-slate-100 space-y-2.5">
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button onClick={() => setTab('gbm')} className={`flex-1 py-1.5 rounded-lg ${tab === 'gbm' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}>
              Free-food events ({weekPosts.length})
            </button>
            <button onClick={() => setTab('food')} className={`flex-1 py-1.5 rounded-lg ${tab === 'food' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}>
              Pantries & dining
            </button>
          </div>
          {tab === 'gbm' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search club, food, building…"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
            </div>
          )}
          <p className="text-[11px] text-slate-500 leading-snug">
            {tab === 'gbm'
              ? 'Drag onto the calendar — events snap to their real day and time.'
              : 'Drop on any day — snaps to that day’s open hours.'}
          </p>
        </div>

        <div className="overflow-y-auto p-2 space-y-1.5 max-h-80 lg:max-h-none lg:flex-1">
          {tab === 'gbm' &&
            (weekPosts.length === 0 ? (
              <div className="text-center p-6 text-xs text-slate-500">
                No free-food events this week.
                <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="block mx-auto mt-2 font-bold text-orange-600">Next week →</button>
              </div>
            ) : (
              weekPosts.map((p) => {
                const done = scheduledIds.has(p.id);
                const start = new Date(p.startISO!);
                const past = new Date(p.endISO!) < now;
                return (
                  <div key={p.id} draggable={!done && !past}
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'copy'; setDrag({ type: 'post', post: p }); }}
                    onDragEnd={endDrag}
                    className={`group flex gap-2 p-2 rounded-xl border transition-colors ${done || past ? 'opacity-50 border-slate-100 bg-slate-50' : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40 cursor-grab active:cursor-grabbing'}`}>
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-orange-100 flex items-center justify-center text-lg">{p.flyerTheme.badgeEmoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        {p.source === 'gatorconnect' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">
                            <Radio className="w-2.5 h-2.5" />LIVE
                          </span>
                        )}
                        {p.source === 'instagram' && (
                          <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded">IG</span>
                        )}
                        {p.isGbm && <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1 rounded">GBM</span>}
                        <span className="text-[10px] font-bold text-orange-700 truncate">
                          {start.toLocaleDateString('en-US', { weekday: 'short' })} {fmtTime(start)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">{p.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{p.clubName} · {p.freeFoodItem}</p>
                    </div>
                    <button onClick={() => clickAddPost(p)} disabled={done || past} title={done ? 'On your calendar' : 'Add at its scheduled time'}
                      className="self-center p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-100 disabled:hover:bg-transparent">
                      {done ? <Check className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })
            ))}

          {tab === 'food' &&
            resources.map((r) => (
              <div key={r.id} draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'copy'; setDrag({ type: 'resource', res: r }); }}
                onDragEnd={endDrag}
                className="flex gap-2 p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-slate-300 self-center shrink-0" />
                <div className="min-w-0">
                  <span className={`text-[9px] font-black px-1 rounded ${r.type === 'Pantry' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {r.type === 'Pantry' ? 'FREE PANTRY' : r.type.toUpperCase()}
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{r.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{r.schedule.map((s) => `${s.days}: ${s.hours}`).join(' · ')}</p>
                </div>
              </div>
            ))}
        </div>
      </aside>

      {/* Week grid */}
      <section className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-100">
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Previous week"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Next week"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setWeekStart(startOfDay(new Date()))} className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50">Today</button>
          </div>
          <h2 className="font-black font-['Outfit'] text-lg text-slate-900 flex items-center gap-1.5">
            <CalendarDays className="w-4.5 h-4.5 text-orange-600" />{rangeLabel}
          </h2>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {meals} free meal{meals === 1 ? '' : 's'} · ~${saved} saved
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={autoPlan} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700"><Wand2 className="w-3.5 h-3.5" />Auto-plan</button>
            <button onClick={exportIcs} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50"><Download className="w-3.5 h-3.5" />.ics</button>
            <button onClick={clearWeek} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50" aria-label="Clear week"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div ref={scrollRef} className="overflow-auto max-h-[calc(100vh-11rem)] min-h-[420px]">
          <div className="grid grid-cols-[52px_repeat(7,minmax(104px,1fr))] min-w-[780px]">
            {/* Day headers */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200" />
            {days.map((d, i) => {
              const today = sameDay(d, now);
              return (
                <div key={i} className={`sticky top-0 z-20 bg-white border-b border-l border-slate-200 py-2 text-center transition-colors ${targetDay === i ? 'bg-orange-50' : ''}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${today ? 'text-orange-600' : 'text-slate-400'}`}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-black ${today ? 'bg-orange-600 text-white' : 'text-slate-800'}`}>{d.getDate()}</div>
                </div>
              );
            })}

            {/* Hour gutter */}
            <div className="relative" style={{ height: GRID_PX }}>
              {Array.from({ length: END_HOUR - START_HOUR }, (_, h) => (
                <div key={h} className="absolute right-1.5 -translate-y-1/2 text-[10px] font-semibold text-slate-400" style={{ top: h * HOUR_PX }}>
                  {h === 0 ? '' : fmtTime(atMinutes(new Date(), (START_HOUR + h) * 60)).replace(':00', '')}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, i) => {
              const dayEntries = weekEntries.filter((e) => sameDay(new Date(e.start), d));
              const layout = layoutDay(dayEntries);
              const dimmed = drag?.type === 'post' && targetDay !== i;
              return (
                <div key={i}
                  onDragOver={(e) => onColumnDragOver(e, i)}
                  onDrop={(e) => onColumnDrop(e, i)}
                  className={`relative border-l border-slate-200 transition-colors ${dimmed ? 'bg-slate-50/80' : ''} ${targetDay === i ? 'bg-orange-50/50' : ''}`}
                  style={{
                    height: GRID_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, #e2e8f0 0, #e2e8f0 1px, transparent 1px, transparent ${HOUR_PX / 2}px, #f1f5f9 ${HOUR_PX / 2}px, #f1f5f9 ${HOUR_PX / 2 + 1}px, transparent ${HOUR_PX / 2 + 1}px, transparent ${HOUR_PX}px)`,
                  }}>
                  {dayEntries.map((e) => {
                    const s = new Date(e.start);
                    const en = new Date(e.end);
                    const top = Math.max(0, ((minutesOf(s) - START_HOUR * 60) / 60) * HOUR_PX);
                    const endMin = sameDay(s, en) ? minutesOf(en) : END_HOUR * 60;
                    const height = Math.max(24, ((Math.min(endMin, END_HOUR * 60) - Math.max(minutesOf(s), START_HOUR * 60)) / 60) * HOUR_PX - 2);
                    const { col, cols } = layout.get(e.id)!;
                    const res = e.kind !== 'GBM' ? resources.find((r) => r.id === e.sourceId) : undefined;
                    const style = e.kind === 'GBM' ? (e.live ? KIND_STYLE.live : KIND_STYLE.sample) : KIND_STYLE[e.kind];
                    return (
                      <div key={e.id}
                        draggable={!!res}
                        onDragStart={(ev) => { if (!res) return; ev.dataTransfer.setData('text/plain', e.id); ev.dataTransfer.effectAllowed = 'move'; setDrag({ type: 'entry', entry: e, res }); }}
                        onDragEnd={endDrag}
                        title={`${e.title}\n${fmtTime(s)}–${fmtTime(en)} · ${e.location}\n${e.food}`}
                        className={`group absolute rounded-lg border-l-4 px-1.5 py-1 shadow-xs overflow-hidden text-[11px] leading-tight ${style} ${res ? 'cursor-grab active:cursor-grabbing' : ''} ${drag?.type === 'entry' && drag.entry.id === e.id ? 'opacity-40' : ''}`}
                        style={{ top: top + 1, height, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` }}>
                        <button onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded bg-white/80 text-slate-500 hover:text-rose-600 opacity-0 group-hover:opacity-100" aria-label="Remove">
                          <X className="w-3 h-3" />
                        </button>
                        <p className="font-bold truncate pr-3">{e.title}</p>
                        <p className="opacity-75 truncate">{fmtTime(s)}–{fmtTime(en)}</p>
                        {height > 60 && <p className="opacity-75 truncate flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 shrink-0" />{e.location}</p>}
                        {height > 80 && <p className="font-semibold truncate">{e.food}</p>}
                      </div>
                    );
                  })}

                  {ghost && ghost.dayIdx === i && (
                    <div className={`absolute left-1 right-1 rounded-lg border-2 border-dashed pointer-events-none flex flex-col justify-center px-1.5 text-[11px] font-bold z-10 ${ghost.closed ? 'border-rose-400 bg-rose-50/80 text-rose-700' : 'border-orange-500 bg-orange-100/70 text-orange-800'}`}
                      style={{ top: ((minutesOf(ghost.start) - START_HOUR * 60) / 60) * HOUR_PX + 1, height: Math.max(26, ((ghost.end.getTime() - ghost.start.getTime()) / 3600000) * HOUR_PX - 2) }}>
                      <span className="truncate">{ghost.closed ? ghost.label : `${fmtTime(ghost.start)}–${fmtTime(ghost.end)}`}</span>
                      {!ghost.closed && <span className="truncate font-medium opacity-80">{ghost.label}</span>}
                    </div>
                  )}

                  {sameDay(d, now) && minutesOf(now) >= START_HOUR * 60 && (
                    <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: ((minutesOf(now) - START_HOUR * 60) / 60) * HOUR_PX }}>
                      <div className="h-0.5 bg-rose-500" />
                      <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
