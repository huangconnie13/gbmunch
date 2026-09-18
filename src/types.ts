export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type MealCategory = 'Dinner' | 'Lunch' | 'Snack' | 'Late Night';

export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Halal' | 'Gluten-Free' | 'Dairy-Free' | 'Nut-Free';

export interface GbmPost {
  id: string;
  clubName: string;
  clubHandle: string;
  avatarUrl: string;
  category: 'Tech' | 'Pre-Professional' | 'Cultural' | 'Creative' | 'Engineering' | 'Greek' | 'Community';
  title: string;
  dayOfWeek: DayOfWeek;
  dateStr: string;
  timeStr: string;
  location: string;
  roomDetails?: string;
  freeFoodItem: string;
  foodDescription: string;
  dietaryTags: DietaryTag[];
  mealCategory: MealCategory;
  likesCount: number;
  commentsCount: number;
  flyerTheme: {
    bgGradient: string;
    accentColor: string;
    badgeEmoji: string;
  };
  verifiedFreeFood: boolean;
  caption: string;
  estimatedValue: number; // e.g. $12 saved
  // Concrete occurrence. Live events carry their real time; samples are
  // anchored to the next matching weekday at load.
  startISO?: string;
  endISO?: string;
  source?: 'gatorconnect' | 'instagram' | 'sample';
  isGbm?: boolean;
  imageUrl?: string;
  sourceUrl?: string;
}

export interface DiningResource {
  id: string;
  name: string;
  type: 'Pantry' | 'Dining Hall' | 'Cafe/Market';
  location: string;
  badge: string;
  isFreeAlways: boolean;
  costDescription: string;
  schedule: {
    days: string;
    hours: string;
    mealPeriods?: { name: string; time: string }[];
  }[];
  notes: string;
  defaultDay: DayOfWeek;
  defaultTimeSlot: string;
}

export interface CalendarEntry {
  id: string;
  sourceId: string;
  kind: 'GBM' | 'Pantry' | 'Dining';
  title: string;
  subtitle: string;
  start: string; // ISO
  end: string; // ISO
  food: string;
  location: string;
  savings: number;
  live?: boolean;
}
