import React, { useState } from 'react';
import { 
  Calendar, 
  Trash2, 
  Plus, 
  Sparkles, 
  DollarSign, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  Building2, 
  GripVertical, 
  ArrowRight,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GbmPost, DiningResource, ScheduledMeal, DayOfWeek } from '../types';

interface SchedulerViewProps {
  gbmPosts: GbmPost[];
  diningResources: DiningResource[];
  scheduledMeals: ScheduledMeal[];
  onAddMeal: (meal: Omit<ScheduledMeal, 'id'>) => void;
  onRemoveMeal: (id: string) => void;
  onClearSchedule: () => void;
  onLoadSampleWeek: () => void;
  onMoveMealDay?: (mealId: string, newDay: DayOfWeek) => void;
}

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  gbmPosts,
  diningResources,
  scheduledMeals,
  onAddMeal,
  onRemoveMeal,
  onClearSchedule,
  onLoadSampleWeek,
  onMoveMealDay,
}) => {
  const [activeDayFilter, setActiveDayFilter] = useState<'All' | DayOfWeek>('All');
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);
  const [paletteTab, setPaletteTab] = useState<'all' | 'gbm' | 'dining'>('all');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Financial and meal metrics
  const totalSavings = scheduledMeals.reduce((sum, item) => sum + item.estimatedSavings, 0);
  const freeGbmCount = scheduledMeals.filter((m) => m.type === 'GBM').length;
  const pantryCount = scheduledMeals.filter((m) => m.type === 'Pantry').length;

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverDay !== day) {
      setDragOverDay(day);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: DayOfWeek) => {
    e.preventDefault();
    setDragOverDay(null);
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      // Check if moving an existing scheduled meal
      if (data.type === 'SCHEDULED_ITEM' && data.mealId) {
        if (onMoveMealDay) {
          onMoveMealDay(data.mealId, targetDay);
        }
        return;
      }

      // Check if dropping a GBM post
      if (data.type === 'GBM' && data.id) {
        const post = gbmPosts.find((p) => p.id === data.id);
        if (post) {
          onAddMeal({
            sourceId: post.id,
            type: 'GBM',
            title: post.title,
            subtitle: `@${post.clubHandle} (${post.clubName})`,
            day: targetDay,
            timeSlot: post.timeStr,
            foodHighlight: post.freeFoodItem,
            location: post.location,
            estimatedSavings: post.estimatedValue,
            dietaryTags: post.dietaryTags,
          });
        }
      }

      // Check if dropping a Dining Resource
      if (data.type === 'DINING' && data.id) {
        const res = diningResources.find((r) => r.id === data.id);
        if (res) {
          onAddMeal({
            sourceId: res.id,
            type: res.type === 'Pantry' ? 'Pantry' : 'Dining',
            title: res.name,
            subtitle: res.badge,
            day: targetDay,
            timeSlot: res.defaultTimeSlot,
            foodHighlight: res.type === 'Pantry' ? 'Free Grocery & Produce Bag' : 'Dining Hall Meal Session',
            location: res.location,
            estimatedSavings: res.type === 'Pantry' ? 25 : 12,
          });
        }
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };

  // Drag start from palette items
  const startDragPost = (e: React.DragEvent, post: GbmPost) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'GBM', id: post.id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const startDragDining = (e: React.DragEvent, res: DiningResource) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'DINING', id: res.id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const startDragScheduledMeal = (e: React.DragEvent, mealId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'SCHEDULED_ITEM', mealId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Export schedule to text/iCal summary
  const handleExportText = () => {
    if (scheduledMeals.length === 0) {
      alert('Your schedule is empty! Drag or add some GBM events or pantry visits first.');
      return;
    }

    let text = `📅 GBMunch Weekly Meal Schedule (${scheduledMeals.length} events planned)\n`;
    text += `💰 Estimated Food Savings: $${totalSavings}\n`;
    text += `--------------------------------------------------\n\n`;

    DAYS.forEach((day) => {
      const dayMeals = scheduledMeals.filter((m) => m.day === day);
      if (dayMeals.length > 0) {
        text += `[${day.toUpperCase()}]\n`;
        dayMeals.forEach((m) => {
          text += `  • ${m.timeSlot} | ${m.title}\n`;
          text += `    Food: ${m.foodHighlight}\n`;
          text += `    Location: ${m.location}\n`;
          text += `    Source: ${m.subtitle} (Saved ~$${m.estimatedSavings})\n\n`;
        });
      }
    });

    navigator.clipboard?.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const displayedDays = activeDayFilter === 'All' ? DAYS : [activeDayFilter];

  return (
    <div id="scheduler-container" className="space-y-6">
      {/* Top Banner & Weekly Summary Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Weekly Meal Planner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight">
              Drag & Drop Campus Scheduler
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
              Drag any of the 10 embedded General Body Meetings or campus pantry visits into your weekly schedule to eliminate out-of-pocket food costs.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
                Saved This Week
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit'] flex items-center justify-center">
                ${totalSavings}
              </div>
              <span className="text-[10px] text-slate-300">estimated cash</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
                Free GBM Meals
              </span>
              <div className="text-xl sm:text-2xl font-black text-orange-400 font-['Outfit']">
                {freeGbmCount}
              </div>
              <span className="text-[10px] text-slate-300">secured dinners</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
                Pantry Visits
              </span>
              <div className="text-xl sm:text-2xl font-black text-teal-400 font-['Outfit']">
                {pantryCount}
              </div>
              <span className="text-[10px] text-slate-300">grocery restocks</span>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          {/* Day Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveDayFilter('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeDayFilter === 'All'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Full Week (Mon–Sun)
            </button>
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDayFilter(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeDayFilter === day
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Quick Schedule Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLoadSampleWeek}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors flex items-center gap-1.5"
              title="Quickly fill Monday-Sunday with recommended free meals"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Fill Sample Week</span>
            </button>

            <button
              onClick={handleExportText}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
              title="Copy formatted schedule text for phone or calendar"
            >
              {copiedNotification ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Export Schedule</span>
                </>
              )}
            </button>

            {scheduledMeals.length > 0 && (
              <button
                onClick={onClearSchedule}
                className="p-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 transition-colors"
                title="Clear all scheduled meals"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Drag-and-Drop Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Palette (4 Cols): Draggable Event Cards */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 lg:sticky lg:top-20 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-1.5">
                <GripVertical className="w-4 h-4 text-orange-600" />
                <span>Drag-and-Drop Palette</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Drag cards to any day, or click "+ Add" button
              </p>
            </div>
          </div>

          {/* Palette Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPaletteTab('all')}
              className={`py-1 rounded-lg transition-all ${
                paletteTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : ''
              }`}
            >
              All (14)
            </button>
            <button
              onClick={() => setPaletteTab('gbm')}
              className={`py-1 rounded-lg transition-all ${
                paletteTab === 'gbm' ? 'bg-white text-slate-900 shadow-xs font-bold' : ''
              }`}
            >
              GBMs (10)
            </button>
            <button
              onClick={() => setPaletteTab('dining')}
              className={`py-1 rounded-lg transition-all ${
                paletteTab === 'dining' ? 'bg-white text-slate-900 shadow-xs font-bold' : ''
              }`}
            >
              Dining (4)
            </button>
          </div>

          {/* Palette Scrollable List */}
          <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
            {/* 10 GBM Posts */}
            {(paletteTab === 'all' || paletteTab === 'gbm') && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  10 Embedded Club Meetings (Free Food)
                </p>
                {gbmPosts.map((post) => {
                  const alreadyScheduled = scheduledMeals.some((m) => m.sourceId === post.id);

                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => startDragPost(e, post)}
                      className="p-3 rounded-2xl border border-slate-200/90 hover:border-orange-300 bg-white hover:bg-orange-50/30 transition-all cursor-grab active:cursor-grabbing shadow-2xs group relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{post.flyerTheme.badgeEmoji}</span>
                          <div>
                            <span className="text-[10px] font-bold text-orange-600 uppercase">
                              {post.dayOfWeek} • {post.category}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {post.title}
                            </h4>
                          </div>
                        </div>

                        <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          +${post.estimatedValue}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between">
                        <span className="font-semibold text-amber-900 truncate max-w-[170px]">
                          {post.freeFoodItem.split('+')[0]}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {post.timeStr.split('-')[0].trim()}
                        </span>
                      </div>

                      {/* Add Button for mobile / quick click */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <GripVertical className="w-3 h-3" />
                          <span>Drag to schedule</span>
                        </span>

                        <button
                          onClick={() =>
                            onAddMeal({
                              sourceId: post.id,
                              type: 'GBM',
                              title: post.title,
                              subtitle: `@${post.clubHandle}`,
                              day: post.dayOfWeek,
                              timeSlot: post.timeStr,
                              foodHighlight: post.freeFoodItem,
                              location: post.location,
                              estimatedSavings: post.estimatedValue,
                              dietaryTags: post.dietaryTags,
                            })
                          }
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                            alreadyScheduled
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to {post.dayOfWeek.slice(0, 3)}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4 Dining Resources */}
            {(paletteTab === 'all' || paletteTab === 'dining') && (
              <div className="space-y-2 mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Campus Pantry & Dining Hours
                </p>
                {diningResources.map((res) => {
                  const isPantry = res.type === 'Pantry';

                  return (
                    <div
                      key={res.id}
                      draggable
                      onDragStart={(e) => startDragDining(e, res)}
                      className={`p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing shadow-2xs group ${
                        isPantry
                          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg text-white ${
                              isPantry ? 'bg-emerald-600' : 'bg-slate-800'
                            }`}
                          >
                            {isPantry ? (
                              <ShoppingBag className="w-3.5 h-3.5" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {res.type}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {res.name}
                            </h4>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPantry
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {isPantry ? 'Free Grocery' : 'Dining'}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {res.defaultDay}
                        </span>

                        <button
                          onClick={() =>
                            onAddMeal({
                              sourceId: res.id,
                              type: isPantry ? 'Pantry' : 'Dining',
                              title: res.name,
                              subtitle: res.badge,
                              day: res.defaultDay,
                              timeSlot: res.defaultTimeSlot,
                              foodHighlight:
                                isPantry
                                  ? 'Free Grocery & Produce Bag'
                                  : 'Dining Hall Meal Session',
                              location: res.location,
                              estimatedSavings: isPantry ? 25 : 12,
                            })
                          }
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
                            isPantry
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to {res.defaultDay.slice(0, 3)}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Schedule Board (8 Cols): 7 Days (Mon-Sun) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-slate-900 font-['Outfit']">
              Weekly Meal Plan ({displayedDays.length} {displayedDays.length === 1 ? 'Day' : 'Days'} Shown)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              💡 Tip: Drag items directly between days to rearrange!
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedDays.map((day) => {
              const dayMeals = scheduledMeals.filter((m) => m.day === day);
              const isOver = dragOverDay === day;

              return (
                <div
                  key={day}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                  className={`rounded-3xl border-2 transition-all p-4 sm:p-5 ${
                    isOver
                      ? 'border-orange-500 bg-orange-50/50 shadow-md ring-4 ring-orange-500/10'
                      : dayMeals.length > 0
                      ? 'border-slate-200/90 bg-white shadow-xs'
                      : 'border-dashed border-slate-200 bg-slate-50/60'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-black text-sm font-['Outfit']">
                        {day.slice(0, 2)}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 font-['Outfit']">
                          {day}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {dayMeals.length === 0
                            ? 'No meals planned yet'
                            : `${dayMeals.length} planned (${dayMeals.filter((m) => m.type === 'GBM').length} free GBM)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {dayMeals.length > 0 && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          +${dayMeals.reduce((acc, m) => acc + m.estimatedSavings, 0)} saved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Items in this Day */}
                  <div className="mt-3 space-y-2.5">
                    {dayMeals.length === 0 ? (
                      <div className="py-7 text-center rounded-2xl border border-dashed border-slate-200 bg-white/60">
                        <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-500">
                          Drop a GBM post or Dining hall slot here for {day}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Drag from the left palette or click "+ Add"
                        </p>
                      </div>
                    ) : (
                      dayMeals.map((meal) => (
                        <div
                          key={meal.id}
                          draggable
                          onDragStart={(e) => startDragScheduledMeal(e, meal.id)}
                          className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600 rounded-md hover:bg-slate-100 hidden sm:block shrink-0 mt-0.5">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    meal.type === 'GBM'
                                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                      : meal.type === 'Pantry'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  }`}
                                >
                                  {meal.type === 'GBM' ? 'FREE GBM MEAL' : meal.type}
                                </span>

                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{meal.timeSlot}</span>
                                </span>
                              </div>

                              <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                                {meal.title}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium">
                                {meal.subtitle}
                              </p>

                              {/* Food Item Highlight */}
                              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                                <span>🍽️ {meal.foodHighlight}</span>
                              </div>

                              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{meal.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Item Actions & Value */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              +${meal.estimatedSavings} saved
                            </span>

                            <button
                              onClick={() => onRemoveMeal(meal.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove from schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
