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

export interface ScheduledMeal {
  id: string; // unique schedule entry id
  sourceId: string; // id of GBM post or dining hall
  type: 'GBM' | 'Pantry' | 'Dining';
  title: string;
  subtitle: string;
  day: DayOfWeek;
  timeSlot: string;
  foodHighlight: string;
  location: string;
  estimatedSavings: number;
  dietaryTags?: DietaryTag[];
}
