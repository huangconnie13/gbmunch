import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Presentation
} from 'lucide-react';

interface PitchPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToHome: () => void;
}

export const PitchPresentationModal: React.FC<PitchPresentationModalProps> = ({
  isOpen,
  onClose,
  onSwitchToHome,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: 'The Challenge & Student Scenario',
      subtitle: 'Part 1: The Problem of Invisible Resources & Campus Insecurity',
      content: (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900">
            <h4 className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5 text-rose-700 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Target Student Scenario</span>
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed">
              Meet <strong>Alex</strong>, a first-generation sophomore facing high tuition and financial hardship. Alex does not use Instagram (or cannot keep up with dozens of fragmented student club stories). 
              Alex struggles with food insecurity, often skipping evening meals or relying on dry ramen, completely unaware that across campus, <strong>over $500 of fresh catered pizza, tacos, and hot meals are purchased and wasted every evening</strong> by student organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-900 block mb-1">
                Fragmented Campus Socials
              </span>
              <p className="text-xs text-slate-600">
                Clubs post exclusively to ephemeral Instagram stories. If you don’t follow all 150+ clubs or aren't on the app 24/7, you miss the food entirely.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-900 block mb-1">
                Student Organization Attendance Crisis
              </span>
              <p className="text-xs text-slate-600">
                Student clubs spend hundreds of dollars on catering to boost attendance at General Body Meetings, but struggle to attract attendees outside their immediate executive bubble.
              </p>
            </div>
          </div>
        </div>
      ),
      speakerNotes:
        'Speaker Cue: Start with Alex’s story. Emphasize that free food already exists in abundance on campus, but access is blocked by fractured social media feeds and social barriers.',
    },
    {
      title: 'Introducing GBMunch',
      subtitle: 'Part 2: The Bridge Between Student Need and Campus Community',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black">
                GM
              </span>
              <h4 className="text-base font-black text-slate-900 font-['Outfit']">
                What is GBMunch?
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong>GBMunch</strong> is a dedicated student-first platform designed to alleviate campus food insecurity while dramatically boosting student engagement.
              It curates and verifies General Body Meetings (GBMs) offering free food, pairs them with campus food pantries and dining halls, and provides a drag-and-drop weekly meal scheduler.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-2xl mb-1">🍕</div>
              <span className="text-xs font-bold text-slate-900 block">Verified Food</span>
              <span className="text-[11px] text-slate-500">Highlighted free menus</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-2xl mb-1">📅</div>
              <span className="text-xs font-bold text-slate-900 block">Weekly Planner</span>
              <span className="text-[11px] text-slate-500">Drag & drop Mon–Sun</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-2xl mb-1">🥫</div>
              <span className="text-xs font-bold text-slate-900 block">Pantry Sync</span>
              <span className="text-[11px] text-slate-500">Official pantry hours</span>
            </div>
          </div>
        </div>
      ),
      speakerNotes:
        'Speaker Cue: Transition to showing how GBMunch acts as a single pane of glass. No Instagram account required. Every student can access high-quality food dignity.',
    },
    {
      title: 'Competitive Analysis: GBMunch vs. GATHR',
      subtitle: 'Part 3: Solving the Fatal Flaws of Existing Campus Event Aggregators',
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            While apps like <strong>GATHR</strong> attempt general campus event discovery, student feedback reveals severe usability bottlenecks when trying to rely on them for essential daily meals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GATHR Analysis */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-slate-700">Competitor: GATHR</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">General Events</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Strength:</strong> Pulls Instagram posts, free food filter, consolidated filters, sleek design.</span>
                </div>
                <div className="flex items-start gap-1.5 text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Fatal Weakness:</strong> Events today not updated in real-time; free food posts are mostly expired by the time students arrive. No weekly scheduling or pantry integration.</span>
                </div>
              </div>
            </div>

            {/* GBMunch Solution */}
            <div className="bg-orange-50/70 rounded-2xl border border-orange-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-orange-900">GBMunch Solution</span>
                <span className="text-[10px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">Free Food Focused</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Expired Events:</strong> Verified active date and time windows with real-time countdown tags.</span>
                </div>
                <div className="flex items-start gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Weekly Meal Scheduler:</strong> Drag-and-drop Mon–Sun planning with estimated weekly savings tracker ($70+/wk).</span>
                </div>
                <div className="flex items-start gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Pantry & Dining Integration:</strong> Harmonizes student club meetings with official campus pantry schedules.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      speakerNotes:
        'Speaker Cue: Explicitly compare with GATHR. GATHR has stale, expired posts. GBMunch gives actionable, up-to-the-minute reliability and scheduling.',
    },
    {
      title: 'Future Scaling & Technical Roadmap',
      subtitle: 'Part 4: Expanding the Vision Across Universities',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            GBMunch is built with high modularity to scale from a single campus to university systems nationwide.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-1 text-slate-900 font-bold text-xs">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Automated Instagram & Flyer Scraping</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Computer vision (OCR) and Gemini AI to parse club flyers and captions, automatically extracting meeting times, rooms, and free food items.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-1 text-slate-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Live Food Status & Leftover Alerts</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Crowdsourced live updates ("Still 3 pizzas left at 7:30pm in Hall 1200!") to eliminate post-event food waste.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-1 text-slate-900 font-bold text-xs">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Club Executive Dashboard</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Self-service portal for student organizations to post their meetings directly, manage RSVP headcounts, and estimate food catering needs.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-1 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Dietary & Allergy Filtering</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Precise allergen alerts (Halal, Kosher, Vegan, Nut-Free, Gluten-Free) ensuring every student eats safely.
              </p>
            </div>
          </div>
        </div>
      ),
      speakerNotes:
        'Speaker Cue: Conclude with our expansion vision. How AI and automation will transform this into an indispensable campus infrastructure product.',
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-orange-400" />
            <span className="font-extrabold text-sm font-['Outfit']">
              GBMunch Pitch Presentation & Case Study
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full text-slate-300">
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              {current.subtitle}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] mt-0.5">
              {current.title}
            </h3>
          </div>

          {current.content}

          {/* Speaker Notes Box */}
          <div className="mt-5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
            <span className="font-bold block mb-0.5">🗣️ Speaker Presentation Notes:</span>
            <span>{current.speakerNotes}</span>
          </div>
        </div>

        {/* Navigation Bottom Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Slide</span>
          </button>

          {/* Slide dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-orange-600' : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {currentSlide === slides.length - 1 ? (
            <button
              onClick={() => {
                onClose();
                onSwitchToHome();
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
            >
              <span>Explore Webpage</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
              className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              <span>Next Slide</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
