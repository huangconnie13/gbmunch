import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  ArrowUpDown, 
  Layers, 
  Coffee, 
  Heart,
  Presentation,
  Github,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { GbmPostCard } from './components/GbmPostCard';
import { DiningHoursSection } from './components/DiningHoursSection';
import { WeekCalendar, postToEntry } from './components/WeekCalendar';
import { PitchPresentationModal } from './components/PitchPresentationModal';
import { ExportGitHubModal } from './components/ExportGitHubModal';
import { INITIAL_GBM_POSTS } from './data/gbmPosts';
import { CAMPUS_DINING_RESOURCES } from './data/campusDining';
import { loadLiveGbms, LiveFeed } from './lib/gatorconnect';
import { dropDuplicates, InstagramFeed, loadInstagram } from './lib/instagram';
import { addDays, anchorSample, atMinutes, parseRange, startOfDay, WEEKDAYS } from './lib/time';
import { GbmPost, DiningResource, CalendarEntry, DayOfWeek, DietaryTag } from './types';

const SAMPLE_POSTS = INITIAL_GBM_POSTS.map((p) => anchorSample(p));

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'scheduler'>('home');
  const [live, setLive] = useState<LiveFeed | null>(null);
  const [insta, setInsta] = useState<InstagramFeed | null>(null);
  const [diningResources] = useState<DiningResource[]>(CAMPUS_DINING_RESOURCES);

  useEffect(() => {
    loadLiveGbms().then(setLive);
    loadInstagram().then(setInsta);
  }, []);

  // Real GatorConnect + Instagram events mixed with the placeholder posts, soonest first.
  const igPosts = useMemo(() => dropDuplicates(insta?.posts ?? [], live?.posts ?? []), [insta, live]);
  const gbmPosts = useMemo(
    () => [...(live?.posts ?? []), ...igPosts, ...SAMPLE_POSTS].sort((a, b) => a.startISO!.localeCompare(b.startISO!)),
    [live, igPosts],
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDayFilter, setSelectedDayFilter] = useState<'All' | DayOfWeek>('All');
  const [selectedDietary, setSelectedDietary] = useState<'All' | DietaryTag>('All');

  // Modals state
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [entries, setEntries] = useState<CalendarEntry[]>(() => {
    try {
      const saved = localStorage.getItem('gbmunch_calendar_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Unable to load from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('gbmunch_calendar_v3', JSON.stringify(entries));
    } catch (e) {
      console.warn('Unable to save to localStorage', e);
    }
  }, [entries]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleAddPostToSchedule = (post: GbmPost) => {
    if (entries.some((e) => e.sourceId === post.id)) {
      setEntries((prev) => prev.filter((e) => e.sourceId !== post.id));
      return showToast('Removed from your calendar');
    }
    setEntries((prev) => [...prev, postToEntry(post)]);
    showToast(`Added to ${post.dateStr} · ${post.timeStr.split(' - ')[0]}`);
  };

  // Next occurrence of that weekday, at the resource's default slot.
  const handleAddResourceToSchedule = (resource: DiningResource, day: DayOfWeek) => {
    const today = startOfDay(new Date());
    const date = addDays(today, (WEEKDAYS.indexOf(day) - today.getDay() + 7) % 7);
    const [a, b] = parseRange(resource.defaultTimeSlot) ?? [12 * 60, 13 * 60];
    setEntries((prev) => [
      ...prev,
      {
        id: `e-${Date.now()}`,
        sourceId: resource.id,
        kind: resource.type === 'Pantry' ? 'Pantry' : 'Dining',
        title: resource.name,
        subtitle: resource.badge,
        start: atMinutes(date, a).toISOString(),
        end: atMinutes(date, b).toISOString(),
        food: resource.type === 'Pantry' ? 'Free groceries & produce' : 'Dining hall meal',
        location: resource.location,
        savings: resource.type === 'Pantry' ? 25 : 0,
      },
    ]);
    showToast(`Added ${resource.name} to ${day}`);
  };

  // Filter posts
  const filteredPosts = gbmPosts.filter((post) => {
    if (new Date(post.endISO!) < new Date()) return false;
    // Search query matches club, title, food item, or location
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.clubName.toLowerCase().includes(q) ||
      post.clubHandle.toLowerCase().includes(q) ||
      post.title.toLowerCase().includes(q) ||
      post.freeFoodItem.toLowerCase().includes(q) ||
      post.location.toLowerCase().includes(q);

    // Category filter
    const matchesCategory =
      selectedCategory === 'All' || post.category === selectedCategory;

    // Day filter
    const matchesDay =
      selectedDayFilter === 'All' || post.dayOfWeek === selectedDayFilter;

    // Dietary filter
    const matchesDietary =
      selectedDietary === 'All' ||
      post.dietaryTags.includes(selectedDietary as DietaryTag);

    return matchesSearch && matchesCategory && matchesDay && matchesDietary;
  });

  const categories = [
    'All',
    'Tech',
    'Engineering',
    'Cultural',
    'Pre-Professional',
    'Community',
    'Creative',
  ];

  const daysList: ('All' | DayOfWeek)[] = [
    'All',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const dietaryOptions: ('All' | DietaryTag)[] = [
    'All',
    'Vegetarian',
    'Halal',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
  ];

  const totalSavedSoFar = entries.reduce((sum, m) => sum + m.savings, 0);
  const liveCount = live?.posts.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scheduledCount={entries.length}
        totalSavings={totalSavedSoFar}
        onOpenPitch={() => setShowPitchModal(true)}
        onOpenExport={() => setShowExportModal(true)}
      />

      {/* Main App Content */}
      <main className={`flex-1 mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full ${activeTab === 'scheduler' ? 'max-w-[1440px]' : 'max-w-6xl'}`}>
        {activeTab === 'home' ? (
          <div className="space-y-8">
            {/* Campus Free Food Headline & Mission Callout */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 p-6 sm:p-8 text-white shadow-lg">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black tracking-wide uppercase mb-3 border border-white/25">
                  <Flame className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Verified Campus Free Food Discovery</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] tracking-tight leading-tight">
                  Never go hungry on campus.
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-orange-50 font-medium leading-relaxed">
                  GBMunch helps you discover General Body Meetings offering free dinner, lunch, and snacks, while coordinating with campus food pantries and dining halls to completely eliminate student food insecurity.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('scheduler')}
                    className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span>Open Weekly Calendar ({entries.length} planned)</span>
                  </button>

                  <button
                    onClick={() => setShowPitchModal(true)}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl backdrop-blur-md transition-all border border-white/30"
                  >
                    <Presentation className="w-4 h-4 text-yellow-200" />
                    <span>View Student Case Study & Pitch</span>
                  </button>
                </div>
              </div>

              {/* Background decorative typography */}
              <div className="absolute right-3 bottom-0 opacity-10 text-8xl font-black font-['Outfit'] select-none pointer-events-none hidden lg:block">
                GBMUNCH
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Search Bar Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by club (ACM, SHPE), food (pizza, boba, tacos), or building..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Day Filter dropdown / quick pills */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Day:</span>
                  </span>
                  <select
                    aria-label="Filter by Day of Week"
                    value={selectedDayFilter}
                    onChange={(e) =>
                      setSelectedDayFilter(e.target.value as 'All' | DayOfWeek)
                    }
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500/20 focus:outline-none cursor-pointer"
                  >
                    {daysList.map((day) => (
                      <option key={day} value={day}>
                        {day === 'All' ? 'All Days (Mon–Sun)' : day}
                      </option>
                    ))}
                  </select>

                  {/* Dietary Filter */}
                  <select
                    aria-label="Filter by Dietary Preference"
                    value={selectedDietary}
                    onChange={(e) =>
                      setSelectedDietary(e.target.value as 'All' | DietaryTag)
                    }
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500/20 focus:outline-none cursor-pointer"
                  >
                    {dietaryOptions.map((diet) => (
                      <option key={diet} value={diet}>
                        {diet === 'All' ? 'All Diets' : `Diet: ${diet}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Club Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                  Category:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Scrolling Instagram Feed of 10 Curated Embedded GBM Posts */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <span>Active Club Meetings Feed</span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {filteredPosts.length} Posts
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                    {live === null ? (
                      <span>Checking GatorConnect for free-food events…</span>
                    ) : live.source === 'none' ? (
                      <span>GatorConnect unreachable — showing featured posts only.</span>
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${live.source === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span>
                          {liveCount} free-food events found in {live.scanned} upcoming GatorConnect events
                          {live.source === 'snapshot' && live.fetchedAt
                            ? ` (snapshot from ${new Date(live.fetchedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })})`
                            : ' · live'}
                          {igPosts.length > 0 && ` + ${igPosts.length} from ${insta!.handles} club Instagrams`}
                          {' '}+ {SAMPLE_POSTS.length} featured posts
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Deploy / Git</span>
                </button>
              </div>

              {/* The Vertical Scrolling Feed */}
              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto">
                  <p className="text-base font-bold text-slate-700">
                    No meetings found matching your filters
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Try clearing your search query or dietary preferences.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedDayFilter('All');
                      setSelectedDietary('All');
                    }}
                    className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <GbmPostCard
                      key={post.id}
                      post={post}
                      isScheduled={entries.some((m) => m.sourceId === post.id)}
                      onAddToSchedule={handleAddPostToSchedule}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Campus Dining & Food Pantry Hours Section */}
            <DiningHoursSection
              resources={diningResources}
              onAddResourceToSchedule={handleAddResourceToSchedule}
              isResourceScheduled={(id) => entries.some((m) => m.sourceId === id)}
            />
          </div>
        ) : (
          <WeekCalendar
            posts={gbmPosts}
            resources={diningResources}
            entries={entries}
            setEntries={setEntries}
            toast={showToast}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Pitch Presentation Modal */}
      <PitchPresentationModal
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
        onSwitchToHome={() => {
          setActiveTab('home');
        }}
      />

      {/* GitHub Export / Deployment Modal */}
      <ExportGitHubModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 font-['Outfit'] text-sm">
              GBM<span className="text-orange-600">Munch</span>
            </span>
            <span>• Alleviating campus food insecurity through community engagement</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setShowPitchModal(true)}
              className="text-slate-600 hover:text-orange-600 transition-colors"
            >
              Problem & Pitch Deck
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="text-slate-600 hover:text-orange-600 transition-colors"
            >
              Export to GBMunchV2
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
