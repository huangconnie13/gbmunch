import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  CalendarPlus, 
  Check, 
  MapPin, 
  Clock, 
  Sparkles, 
  BadgeCheck, 
  DollarSign,
  GripVertical,
  ChevronDown
} from 'lucide-react';
import { GbmPost, DayOfWeek } from '../types';

interface GbmPostCardProps {
  post: GbmPost;
  isScheduled: boolean;
  onAddToSchedule: (post: GbmPost, targetDay?: DayOfWeek) => void;
  onDragStart?: (e: React.DragEvent, post: GbmPost) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const GbmPostCard: React.FC<GbmPostCardProps> = ({
  post,
  isScheduled,
  onAddToSchedule,
  onDragStart,
}) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false);

  const toggleLike = () => {
    if (liked) {
      setLikesCount((prev) => prev - 1);
      setLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setLiked(true);
    }
  };

  const handleDragStartInternal = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'GBM', id: post.id }));
    if (onDragStart) {
      onDragStart(e, post);
    }
  };

  return (
    <article 
      id={`gbm-post-${post.id}`}
      draggable
      onDragStart={handleDragStartInternal}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group max-w-xl mx-auto w-full relative"
    >
      {/* Instagram Header */}
      <div className="p-3.5 sm:px-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Instagram story gradient ring */}
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
              <img
                src={post.avatarUrl}
                alt={post.clubName}
                className="w-full h-full rounded-full object-cover border border-white"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
              <span className="text-[10px] block leading-none">{post.flyerTheme.badgeEmoji}</span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight hover:underline cursor-pointer">
                {post.clubHandle}
              </span>
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 inline fill-blue-500/10" />
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                {post.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[220px] sm:max-w-xs">
              {post.clubName}
            </p>
          </div>
        </div>

        {/* Drag handle tooltip & day badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
            {post.dayOfWeek}
          </span>
          <div 
            title="Drag this post directly into the weekly scheduler"
            className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors hidden sm:block"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Embedded Flyer Visual Display */}
      <div 
        className={`relative w-full aspect-[4/3] sm:aspect-[16/10] bg-gradient-to-br ${post.flyerTheme.bgGradient} p-6 flex flex-col justify-between text-white overflow-hidden select-none`}
      >
        {/* Background decorative watermark pattern */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none text-9xl">
          {post.flyerTheme.badgeEmoji}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges over Flyer */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md text-xs font-bold shadow-lg border border-emerald-400/40">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>FREE FOOD VERIFIED</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium border border-white/10">
            <Clock className="w-3 h-3 text-orange-300" />
            <span>{post.timeStr}</span>
          </div>
        </div>

        {/* Center Title & Food Showcase */}
        <div className="relative z-10 my-auto">
          <p className="text-xs uppercase tracking-widest text-orange-300 font-semibold mb-1">
            General Body Meeting
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md font-['Outfit']">
            {post.title}
          </h3>
          
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/25 shadow-md">
            <span className="text-lg">{post.flyerTheme.badgeEmoji}</span>
            <span className="text-xs sm:text-sm font-bold text-amber-200">
              {post.freeFoodItem}
            </span>
          </div>
        </div>

        {/* Flyer Bottom Bar: Location & Est Savings */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 text-xs text-slate-200 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">{post.location}</span>
          </div>
          <div className="inline-flex items-center gap-0.5 text-emerald-300 font-bold shrink-0 bg-black/30 px-2 py-0.5 rounded-md">
            <DollarSign className="w-3 h-3" />
            <span>~${post.estimatedValue} Meal Value</span>
          </div>
        </div>
      </div>

      {/* Free Food Highlight Banner */}
      <div className="bg-amber-50/90 border-y border-amber-200/70 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{post.flyerTheme.badgeEmoji}</span>
          <div>
            <p className="text-xs font-extrabold text-amber-950">
              Menu: <span className="text-amber-800 font-medium">{post.freeFoodItem}</span>
            </p>
            <p className="text-[11px] text-amber-900/80 font-normal">
              {post.foodDescription}
            </p>
          </div>
        </div>

        {/* Dietary Tags */}
        <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
          {post.dietaryTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Instagram Engagement Bar */}
      <div className="p-3.5 sm:px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLike}
              className="group/btn flex items-center gap-1.5 focus:outline-none"
              title="Like this post"
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  liked
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-700 hover:text-rose-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700">
                {likesCount}
              </span>
            </button>

            <button 
              className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 focus:outline-none"
              title="Comments"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-semibold">{post.commentsCount}</span>
            </button>

            <button 
              className="text-slate-700 hover:text-slate-900 focus:outline-none"
              title="Share event"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Free Food GBM: ${post.title} by @${post.clubHandle} on ${post.dateStr} at ${post.location}! Offering: ${post.freeFoodItem}`
                );
                alert('Event link & details copied to clipboard!');
              }}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className="text-slate-700 hover:text-slate-900 focus:outline-none"
              title="Save post"
            >
              <Bookmark
                className={`w-5 h-5 ${
                  saved ? 'fill-slate-900 text-slate-900' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Instagram Caption & Hashtags */}
        <div className="text-xs text-slate-800 leading-relaxed mb-3">
          <span className="font-bold text-slate-950 mr-1.5">{post.clubHandle}</span>
          <span>
            {isExpanded ? post.caption : `${post.caption.slice(0, 110)}...`}
          </span>
          {post.caption.length > 110 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 font-semibold ml-1 hover:text-slate-700"
            >
              {isExpanded ? 'less' : 'more'}
            </button>
          )}

          <div className="mt-1 flex flex-wrap gap-1.5 text-blue-600 font-medium text-[11px]">
            <span>#GBMunch</span>
            <span>#FreeFoodOnCampus</span>
            <span>#{post.category.toLowerCase()}club</span>
            <span>#NoStudentHungry</span>
          </div>
        </div>

        {/* Action Button: Add to Scheduler */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 relative">
          <button
            id={`add-schedule-${post.id}`}
            onClick={() => onAddToSchedule(post, post.dayOfWeek)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
              isScheduled
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs hover:shadow'
            }`}
          >
            {isScheduled ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Added to {post.dayOfWeek} Schedule</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Add to {post.dayOfWeek} Schedule</span>
              </>
            )}
          </button>

          {/* Quick Day Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDaySelector(!showDaySelector)}
              title="Pick a specific day to schedule"
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {showDaySelector && (
              <div className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Schedule for:
                </p>
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      onAddToSchedule(post, day);
                      setShowDaySelector(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-orange-50 hover:text-orange-700 flex items-center justify-between ${
                      day === post.dayOfWeek ? 'font-bold text-orange-600' : 'text-slate-700'
                    }`}
                  >
                    <span>{day}</span>
                    {day === post.dayOfWeek && <span className="text-[10px] bg-orange-100 px-1 rounded">Event</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
