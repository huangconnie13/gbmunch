import { DiningResource } from '../types';

export const CAMPUS_DINING_RESOURCES: DiningResource[] = [
  {
    id: 'res-pantry-main',
    name: 'Campus Basic Needs Food Pantry (The Oasis)',
    type: 'Pantry',
    location: 'Student Services Center, Room 115',
    badge: '100% Free Groceries & Emergency Meals',
    isFreeAlways: true,
    costDescription: 'Completely free for all enrolled students (No income proof needed)',
    schedule: [
      { days: 'Monday – Thursday', hours: '9:00 AM – 6:00 PM' },
      { days: 'Friday', hours: '9:00 AM – 3:30 PM' },
      { days: 'Saturday – Sunday', hours: 'Closed (Emergency food lockers 24/7)' },
    ],
    notes: 'Fresh organic produce, pantry staples (pasta, oats, rice, beans), milk, refrigerated ready-to-eat wraps, and personal care supplies.',
    defaultDay: 'Tuesday',
    defaultTimeSlot: '11:00 AM - 12:00 PM (Weekly Restock Pickup)',
  },
  {
    id: 'res-pantry-satellite',
    name: 'North Campus Satellite Food Locker & Grab-and-Go',
    type: 'Pantry',
    location: 'Engineering Science Annex, Lobby Floor 1',
    badge: 'Quick Grab & Go Snack & Meal Station',
    isFreeAlways: true,
    costDescription: 'Free quick pantry bags & microwaveable meals',
    schedule: [
      { days: 'Monday – Friday', hours: '8:00 AM – 8:00 PM' },
      { days: 'Saturday', hours: '10:00 AM – 4:00 PM' },
    ],
    notes: 'Pre-packed ramen, oatmeal cups, granola bars, tuna packets, and fresh fruit bowls for students on the go.',
    defaultDay: 'Thursday',
    defaultTimeSlot: '2:00 PM - 3:00 PM (Snack & Pantry Bag)',
  },
  {
    id: 'res-dining-central',
    name: 'Central Commons Dining Pavilion',
    type: 'Dining Hall',
    location: 'Central Campus Quad, 1st & 2nd Floor',
    badge: 'All-You-Care-To-Eat Dining Hall',
    isFreeAlways: false,
    costDescription: 'Meal plan swipe or $9.50 breakfast / $12 lunch / $13 dinner',
    schedule: [
      {
        days: 'Monday – Friday',
        hours: '7:30 AM – 9:00 PM',
        mealPeriods: [
          { name: 'Hot Breakfast', time: '7:30 AM – 10:30 AM' },
          { name: 'Lunch & Salad Bar', time: '11:00 AM – 2:30 PM' },
          { name: 'Chef’s Dinner Buffet', time: '4:45 PM – 8:30 PM' },
        ],
      },
      {
        days: 'Saturday – Sunday',
        hours: '9:00 AM – 8:00 PM',
        mealPeriods: [
          { name: 'Weekend Brunch', time: '9:00 AM – 2:00 PM' },
          { name: 'Dinner', time: '5:00 PM – 8:00 PM' },
        ],
      },
    ],
    notes: 'Full allergen-free station, hot grill, brick oven pizza, salad bar, rotisserie chicken, and vegan deli.',
    defaultDay: 'Monday',
    defaultTimeSlot: '12:00 PM - 1:15 PM (Lunch)',
  },
  {
    id: 'res-dining-west',
    name: 'Westside Market & Late Night Bistro',
    type: 'Dining Hall',
    location: 'West Campus Residence Complex Plaza',
    badge: 'Late Night Hot Grill & Fresh Sandwiches',
    isFreeAlways: false,
    costDescription: 'Meal plan or pay per item ($6–$11)',
    schedule: [
      {
        days: 'Sunday – Thursday',
        hours: '4:00 PM – 12:00 AM (Midnight)',
        mealPeriods: [
          { name: 'Dinner Service', time: '5:00 PM – 8:30 PM' },
          { name: 'Late-Night Grill', time: '8:30 PM – 12:00 AM' },
        ],
      },
      {
        days: 'Friday – Saturday',
        hours: '4:00 PM – 10:00 PM',
      },
    ],
    notes: 'Burgers, chicken tenders, halal bowls, artisan wraps, hot soups, and ice cream soft serve.',
    defaultDay: 'Friday',
    defaultTimeSlot: '7:00 PM - 8:30 PM (Dinner / Late Grill)',
  },
];
