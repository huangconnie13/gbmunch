import React, { useState } from 'react';
import { 
  Building2, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  CalendarPlus, 
  Check, 
  Info, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';
import { DiningResource, DayOfWeek } from '../types';

interface DiningHoursSectionProps {
  resources: DiningResource[];
  onAddResourceToSchedule: (resource: DiningResource, day: DayOfWeek, mealSlotName?: string) => void;
  isResourceScheduled: (id: string) => boolean;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DiningHoursSection: React.FC<DiningHoursSectionProps> = ({
  resources,
  onAddResourceToSchedule,
  isResourceScheduled,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');

  return (
    <section id="dining-hours-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Campus Nutrition Resources
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Food Pantry & Dining Hall Hours
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Pair free GBM meals with on-campus food pantries and dining hall services to eliminate weekly food expenses.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero-barrier free pantry access</span>
        </div>
      </div>

      {/* Grid of Campus Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {resources.map((res) => {
          const isPantry = res.type === 'Pantry';
          const scheduled = isResourceScheduled(res.id);

          return (
            <div
              key={res.id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between relative ${
                isPantry
                  ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-200/80 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-2 rounded-xl text-xs font-bold ${
                        isPantry
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {isPantry ? <ShoppingBag className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {res.type}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {res.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Badge & Cost */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isPantry
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {res.badge}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {res.costDescription}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium">{res.location}</span>
                </div>

                {/* Hours Schedule */}
                <div className="space-y-1.5 mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Operating Hours</span>
                  </p>
                  <div className="bg-white/80 rounded-xl border border-slate-100 p-2.5 text-xs space-y-1">
                    {res.schedule.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700">
                        <span className="font-medium text-slate-500">{item.days}:</span>
                        <span className="font-bold text-slate-900">{item.hours}</span>
                      </div>
                    ))}
                  </div>

                  {/* Meal Periods if available */}
                  {res.schedule[0]?.mealPeriods && (
                    <div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
                      {res.schedule[0].mealPeriods.map((mp, i) => (
                        <div key={i} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
                          <p className="font-bold text-slate-700 truncate">{mp.name}</p>
                          <p className="text-slate-400 truncate">{mp.time.split('–')[0].trim()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <p className="text-xs text-slate-500 italic mb-4 leading-relaxed bg-slate-50/50 p-2 rounded-lg">
                  "{res.notes}"
                </p>
              </div>

              {/* Add to Scheduler Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  id={`add-resource-${res.id}`}
                  onClick={() => onAddResourceToSchedule(res, res.defaultDay)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    scheduled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isPantry
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {scheduled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to {res.defaultDay} Plan</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Add to Schedule ({res.defaultDay})</span>
                    </>
                  )}
                </button>

                {/* Optional dropdown to schedule any day */}
                <select
                  aria-label="Choose day for dining resource"
                  value={selectedDay}
                  onChange={(e) => {
                    const day = e.target.value as DayOfWeek;
                    setSelectedDay(day);
                    onAddResourceToSchedule(res, day);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none cursor-pointer"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d.slice(0, 3)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
