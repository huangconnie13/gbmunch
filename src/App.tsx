import React, { useState, useEffect } from 'react';
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
import { SchedulerView } from './components/SchedulerView';
import { PitchPresentationModal } from './components/PitchPresentationModal';
import { ExportGitHubModal } from './components/ExportGitHubModal';
import { INITIAL_GBM_POSTS } from './data/gbmPosts';
import { CAMPUS_DINING_RESOURCES } from './data/campusDining';
import { GbmPost, DiningResource, ScheduledMeal, DayOfWeek, DietaryTag } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'scheduler'>('home');
  const [gbmPosts] = useState<GbmPost[]>(INITIAL_GBM_POSTS);
  const [diningResources] = useState<DiningResource[]>(CAMPUS_DINING_RESOURCES);

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

  // Scheduled meals state with local persistence
  const [scheduledMeals, setScheduledMeals] = useState<ScheduledMeal[]>(() => {
    try {
      const saved = localStorage.getItem('gbmunch_schedule_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Unable to load from localStorage', e);
    }
    // Default initial scheduled week demonstrating value
    return [
      {
        id: 'sample-1',
        sourceId: 'gbm-1',
        type: 'GBM',
        title: 'Fall Kickoff & Tech Talk: AI in Production',
        subtitle: '@acm_campus',
        day: 'Monday',
        timeSlot: '6:30 PM - 8:00 PM',
        foodHighlight: 'Warm Domino’s Pepperoni & Cheese Pizza',
        location: 'Science & Engineering Hall 1200',
        estimatedSavings: 14,
        dietaryTags: ['Vegetarian', 'Halal'],
      },
      {
        id: 'sample-2',
        sourceId: 'res-pantry-main',
        type: 'Pantry',
        title: 'Campus Basic Needs Food Pantry (The Oasis)',
        subtitle: '100% Free Groceries & Emergency Meals',
        day: 'Tuesday',
        timeSlot: '11:00 AM - 12:00 PM (Weekly Restock Pickup)',
        foodHighlight: 'Free Grocery & Fresh Produce Bag',
        location: 'Student Services Center, Room 115',
        estimatedSavings: 25,
      },
      {
        id: 'sample-3',
        sourceId: 'gbm-2',
        type: 'GBM',
        title: 'Noche de Bienvenida & Career Fair Prep',
        subtitle: '@shpe_familia',
        day: 'Tuesday',
        timeSlot: '6:00 PM - 7:30 PM',
        foodHighlight: 'Authentic Street Tacos (Al Pastor & Rajas)',
        location: 'Student Union Ballroom B',
        estimatedSavings: 16,
        dietaryTags: ['Vegetarian', 'Gluten-Free'],
      },
      {
        id: 'sample-4',
        sourceId: 'gbm-4',
        type: 'GBM',
        title: 'Brotherhood & Sisterhood Welcome Dinner',
        subtitle: '@campus_msa',
        day: 'Thursday',
        timeSlot: '6:45 PM - 8:30 PM',
        foodHighlight: 'Halal Guys Chicken & Gyro over Yellow Rice',
        location: 'Memorial Union Courtyard Patio',
        estimatedSavings: 18,
        dietaryTags: ['Halal'],
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('gbmunch_schedule_v2', JSON.stringify(scheduledMeals));
    } catch (e) {
      console.warn('Unable to save to localStorage', e);
    }
  }, [scheduledMeals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Add meal handler
  const handleAddMeal = (mealData: Omit<ScheduledMeal, 'id'>) => {
    const newMeal: ScheduledMeal = {
      ...mealData,
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setScheduledMeals((prev) => [...prev, newMeal]);
    showToast(`Added "${newMeal.foodHighlight}" to ${newMeal.day}'s schedule!`);
  };

  // Add post directly from card
  const handleAddPostToSchedule = (post: GbmPost, targetDay?: DayOfWeek) => {
    const day = targetDay || post.dayOfWeek;
    handleAddMeal({
      sourceId: post.id,
      type: 'GBM',
      title: post.title,
      subtitle: `@${post.clubHandle}`,
      day: day,
      timeSlot: post.timeStr,
      foodHighlight: post.freeFoodItem,
      location: post.location,
      estimatedSavings: post.estimatedValue,
      dietaryTags: post.dietaryTags,
    });
  };

  // Add dining resource directly
  const handleAddResourceToSchedule = (resource: DiningResource, day: DayOfWeek) => {
    handleAddMeal({
      sourceId: resource.id,
      type: resource.type === 'Pantry' ? 'Pantry' : 'Dining',
      title: resource.name,
      subtitle: resource.badge,
      day: day,
      timeSlot: resource.defaultTimeSlot,
      foodHighlight:
        resource.type === 'Pantry'
          ? 'Free Weekly Groceries & Produce'
          : 'Dining Hall Meal Session',
      location: resource.location,
      estimatedSavings: resource.type === 'Pantry' ? 25 : 12,
    });
  };

  // Remove meal handler
  const handleRemoveMeal = (id: string) => {
    setScheduledMeals((prev) => prev.filter((m) => m.id !== id));
    showToast('Removed meal from schedule');
  };

  // Move meal between days
  const handleMoveMealDay = (mealId: string, newDay: DayOfWeek) => {
    setScheduledMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, day: newDay } : m))
    );
    showToast(`Moved meal to ${newDay}!`);
  };

  // Clear schedule
  const handleClearSchedule = () => {
    if (confirm('Are you sure you want to clear your weekly meal schedule?')) {
      setScheduledMeals([]);
      showToast('Schedule cleared');
    }
  };

  // Load sample week
  const handleLoadSampleWeek = () => {
    const sampleItems: ScheduledMeal[] = [
      {
        id: `sample-${Date.now()}-1`,
        sourceId: 'gbm-1',
        type: 'GBM',
        title: 'Fall Kickoff & Tech Talk: AI in Production',
        subtitle: '@acm_campus',
        day: 'Monday',
        timeSlot: '6:30 PM - 8:00 PM',
        foodHighlight: 'Warm Domino’s Pepperoni & Cheese Pizza',
        location: 'Science & Engineering Hall 1200',
        estimatedSavings: 14,
      },
      {
        id: `sample-${Date.now()}-2`,
        sourceId: 'gbm-2',
        type: 'GBM',
        title: 'Noche de Bienvenida & Career Fair Prep',
        subtitle: '@shpe_familia',
        day: 'Tuesday',
        timeSlot: '6:00 PM - 7:30 PM',
        foodHighlight: 'Authentic Street Tacos (Al Pastor, Chicken, Rajas)',
        location: 'Student Union Ballroom B',
        estimatedSavings: 16,
      },
      {
        id: `sample-${Date.now()}-3`,
        sourceId: 'gbm-3',
        type: 'GBM',
        title: 'First General Meeting & Boba Social',
        subtitle: '@apasu_official',
        day: 'Wednesday',
        timeSlot: '5:30 PM - 7:00 PM',
        foodHighlight: 'Free Tiger Sugar Brown Sugar Boba + Spring Rolls',
        location: 'Multicultural Center Lounge',
        estimatedSavings: 11,
      },
      {
        id: `sample-${Date.now()}-4`,
        sourceId: 'res-pantry-main',
        type: 'Pantry',
        title: 'Campus Basic Needs Food Pantry (The Oasis)',
        subtitle: '100% Free Groceries & Produce',
        day: 'Thursday',
        timeSlot: '11:00 AM - 12:00 PM (Weekly Restock Pickup)',
        foodHighlight: 'Free Grocery & Fresh Produce Bag',
        location: 'Student Services Center, Room 115',
        estimatedSavings: 25,
      },
      {
        id: `sample-${Date.now()}-5`,
        sourceId: 'gbm-4',
        type: 'GBM',
        title: 'Brotherhood & Sisterhood Welcome Dinner',
        subtitle: '@campus_msa',
        day: 'Thursday',
        timeSlot: '6:45 PM - 8:30 PM',
        foodHighlight: 'Halal Guys Chicken & Gyro over Yellow Rice',
        location: 'Memorial Union Courtyard Patio',
        estimatedSavings: 18,
      },
      {
        id: `sample-${Date.now()}-6`,
        sourceId: 'gbm-5',
        type: 'GBM',
        title: 'Empowerment Brunch & Peer Mentorship Match',
        subtitle: '@wics_community',
        day: 'Friday',
        timeSlot: '12:00 PM - 1:30 PM',
        foodHighlight: 'Panera Gourmet Sandwiches, Fruit, & Salad',
        location: 'Turing Computer Lab & Commons',
        estimatedSavings: 15,
      },
      {
        id: `sample-${Date.now()}-7`,
        sourceId: 'gbm-10',
        type: 'GBM',
        title: 'Open Mic Night & Late Night Sweet Bites',
        subtitle: '@campus_ink_guild',
        day: 'Sunday',
        timeSlot: '7:30 PM - 9:30 PM',
        foodHighlight: 'Krispy Kreme Glazed Donuts & Hot Apple Cider',
        location: 'Arts Pavilion Blackbox Stage',
        estimatedSavings: 9,
      },
    ];
    setScheduledMeals(sampleItems);
    showToast('Loaded full sample week! 6 free meals & 1 pantry restock.');
  };

  // Filter posts
  const filteredPosts = gbmPosts.filter((post) => {
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

  const totalSavedSoFar = scheduledMeals.reduce(
    (sum, m) => sum + m.estimatedSavings,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scheduledCount={scheduledMeals.length}
        totalSavings={totalSavedSoFar}
        onOpenPitch={() => setShowPitchModal(true)}
        onOpenExport={() => setShowExportModal(true)}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
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
                    <span>Open Weekly Scheduler ({scheduledMeals.length} planned)</span>
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
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    10 embedded student club posts with verified free food. Scroll vertically to explore.
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
                      isScheduled={scheduledMeals.some(
                        (m) => m.sourceId === post.id
                      )}
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
              isResourceScheduled={(id) =>
                scheduledMeals.some((m) => m.sourceId === id)
              }
            />
          </div>
        ) : (
          /* Scheduler Tab: Interactive Drag & Drop Mon-Sun Planner */
          <SchedulerView
            gbmPosts={gbmPosts}
            diningResources={diningResources}
            scheduledMeals={scheduledMeals}
            onAddMeal={handleAddMeal}
            onRemoveMeal={handleRemoveMeal}
            onClearSchedule={handleClearSchedule}
            onLoadSampleWeek={handleLoadSampleWeek}
            onMoveMealDay={handleMoveMealDay}
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
