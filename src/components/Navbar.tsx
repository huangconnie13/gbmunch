import React from 'react';
import { Utensils, Calendar, Home, Presentation, Github, Sparkles, Heart } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'scheduler';
  setActiveTab: (tab: 'home' | 'scheduler') => void;
  scheduledCount: number;
  totalSavings: number;
  onOpenPitch: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  scheduledCount,
  totalSavings,
  onOpenPitch,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Utensils className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-['Outfit']">
                GBM<span className="text-orange-600">Munch</span>
              </span>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-orange-200">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-none">
              Free Food & Campus Club Scheduler
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 shadow-inner">
          <button
            id="nav-home-btn"
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'home'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-orange-500" />
            <span>Feed & Hours</span>
          </button>

          <button
            id="nav-scheduler-btn"
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
              activeTab === 'scheduler'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Weekly Scheduler</span>
            {scheduledCount > 0 && (
              <span className="bg-orange-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
                {scheduledCount}
              </span>
            )}
          </button>
        </nav>

        {/* Secondary Action Controls */}
        <div className="flex items-center gap-2">
          {/* Pitch & Mission Button */}
          <button
            id="pitch-mission-btn"
            onClick={onOpenPitch}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            title="View Pitch Deck, Scenario & Competitive Analysis"
          >
            <Presentation className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden md:inline">Pitch & Mission</span>
          </button>

          {/* GitHub Export / Deploy Button */}
          <button
            id="github-export-btn"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            title="Export to GitHub repository: GBMunchV2"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GBMunchV2</span>
          </button>
        </div>
      </div>
    </header>
  );
};
