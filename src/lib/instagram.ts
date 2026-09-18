// Instagram flyers scraped by scripts/snapshot-instagram.mjs (Apify free credit +
// OCR). The scrape runs server-side on a schedule; the app only reads the output.

import { DietaryTag, GbmPost, MealCategory } from '../types';
import { WEEKDAYS } from './time';

interface IgPost {
  id: string;
  handle: string;
  org: string;
  caption: string;
  url: string;
  image: string | null;
  title: string;
  start: string;
  end: string;
  location: string;
  food: string;
  foodSnippet: string;
  emoji: string;
  isGbm: boolean;
  dietary: DietaryTag[];
}

export interface InstagramFeed {
  posts: GbmPost[];
  fetchedAt: string | null;
  handles: number;
}

const VALUE: Record<MealCategory, number> = { Dinner: 12, Lunch: 10, 'Late Night': 7, Snack: 4 };

function toPost(p: IgPost): GbmPost {
  const start = new Date(p.start);
  const end = new Date(p.end);
  const h = start.getHours();
  const mealCategory: MealCategory = /brunch|breakfast|lunch/i.test(p.food) ? 'Lunch' : /snack|refreshment|cookie|popcorn/i.test(p.food) ? 'Snack' : h >= 21 ? 'Late Night' : h >= 16 ? 'Dinner' : h >= 11 ? 'Lunch' : 'Snack';
  const t = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return {
    id: p.id,
    clubName: p.org,
    clubHandle: p.handle,
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.org)}`,
    category: 'Community',
    title: p.title,
    dayOfWeek: WEEKDAYS[start.getDay()],
    dateStr: start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    timeStr: `${t(start)} - ${t(end)}`,
    location: p.location,
    freeFoodItem: p.food,
    foodDescription: p.foodSnippet || 'Food mentioned on the club’s Instagram flyer.',
    dietaryTags: p.dietary,
    mealCategory,
    likesCount: 0,
    commentsCount: 0,
    flyerTheme: { bgGradient: 'from-fuchsia-600 via-rose-600 to-amber-500', accentColor: '#e11d48', badgeEmoji: p.emoji },
    verifiedFreeFood: false,
    caption: p.caption,
    estimatedValue: VALUE[mealCategory],
    startISO: p.start,
    endISO: p.end,
    source: 'instagram',
    isGbm: p.isGbm,
    imageUrl: p.image ?? undefined,
    sourceUrl: p.url,
  };
}

export async function loadInstagram(): Promise<InstagramFeed> {
  try {
    const res = await fetch('/data/instagram-snapshot.json');
    if (!res.ok) throw new Error(String(res.status));
    const snap = await res.json();
    return { posts: snap.posts.map(toPost), fetchedAt: snap.fetchedAt, handles: snap.handles };
  } catch {
    return { posts: [], fetchedAt: null, handles: 0 };
  }
}

// GatorConnect wins when a club posts the same meeting in both places.
export function dropDuplicates(ig: GbmPost[], gatorconnect: GbmPost[]): GbmPost[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const keys = new Set(gatorconnect.map((p) => `${norm(p.clubName)}|${new Date(p.startISO!).toDateString()}`));
  return ig.filter((p) => !keys.has(`${norm(p.clubName)}|${new Date(p.startISO!).toDateString()}`));
}
