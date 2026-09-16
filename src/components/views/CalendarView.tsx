import React, { useState, useMemo, useEffect, useCallback } from 'react';
import appLogo from '../../assets/images/app_logo_1789532070520.jpg';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Sparkles,
  Filter,
  Check,
  X,
  Globe,
  RefreshCw,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Task, CalendarViewMode, Priority } from '../../types';
import { HolidayEvent, HolidayType } from '../../services/holidays';
import {
  CountryInfo,
  SUPPORTED_COUNTRIES,
  detectUserCountry,
  saveUserCountry,
  getUnifiedHolidays,
  filterUpcoming,
} from '../../services/holidaysApi';
import { HolidayModal } from '../HolidayModal';

interface CalendarViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTaskDate: (taskId: string, newDate: string, newStartTime?: string) => void;
  onOpenNewTask: (initialDate?: string, initialTime?: string) => void;
  onAddHolidayAsTask?: (title: string, date: string, description?: string) => void;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onUpdateTaskDate,
  onOpenNewTask,
  onAddHolidayAsTask,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // User location and Public Holidays API state
  const [userCountry, setUserCountry] = useState<CountryInfo>(() => detectUserCountry());
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isLiveApiConnected, setIsLiveApiConnected] = useState(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());

  // Holiday data state
  const [unifiedHolidays, setUnifiedHolidays] = useState<HolidayEvent[]>([]);
  const [showHolidays, setShowHolidays] = useState(true);
  const [holidayFilter, setHolidayFilter] = useState<HolidayType | 'all'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayEvent | null>(null);
  const [showUpcomingRibbon, setShowUpcomingRibbon] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = useMemo(() => formatDate(new Date()), []);
  const currentYear = currentDate.getFullYear();

  // Fetch holidays whenever year or country changes
  const loadHolidays = useCallback(
    async (year: number, countryCode: string, forceRefresh = false) => {
      setIsLoadingApi(true);
      if (forceRefresh) {
        try {
          localStorage.removeItem(`publicholidays_api_${countryCode}_${year}`);
        } catch {
          // ignore
        }
      }

      try {
        const result = await getUnifiedHolidays(year, countryCode);
        setUnifiedHolidays(result.holidays);
        setIsLiveApiConnected(result.isLiveApi);
        setLastSyncedTime(result.lastSynced);
      } catch (err) {
        console.error('Failed to load unified holidays:', err);
      } finally {
        setIsLoadingApi(false);
      }
    },
    []
  );

  useEffect(() => {
    loadHolidays(currentYear, userCountry.code);
  }, [currentYear, userCountry.code, loadHolidays]);

  // Handle Country Selection
  const handleSelectCountry = (country: CountryInfo) => {
    setUserCountry(country);
    saveUserCountry(country.code);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
  };

  // Map of dateStr -> HolidayEvent[]
  const holidaysMap = useMemo(() => {
    const map = new Map<string, HolidayEvent[]>();
    for (const h of unifiedHolidays) {
      // Apply category filter
      if (holidayFilter !== 'all' && h.type !== holidayFilter) {
        continue;
      }
      // Apply search query filter if typed
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !h.name.toLowerCase().includes(q) &&
          !h.categoryName.toLowerCase().includes(q) &&
          !h.description.toLowerCase().includes(q)
        ) {
          continue;
        }
      }

      const existing = map.get(h.date) || [];
      existing.push(h);
      map.set(h.date, existing);
    }
    return map;
  }, [unifiedHolidays, holidayFilter, searchQuery]);

  // Month holiday count for badge
  const monthHolidaysCount = useMemo(() => {
    const prefix = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    return unifiedHolidays.filter((h) => h.date.startsWith(prefix)).length;
  }, [unifiedHolidays, currentYear, currentDate]);

  // Upcoming festivals & public holidays based on current date
  const upcomingHolidays = useMemo(() => {
    const baseDate = formatDate(currentDate) < todayStr ? formatDate(currentDate) : todayStr;
    return filterUpcoming(unifiedHolidays, baseDate, 10);
  }, [unifiedHolidays, currentDate, todayStr]);

  // Filtered country list for picker
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return SUPPORTED_COUNTRIES;
    const q = countrySearch.toLowerCase();
    return SUPPORTED_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid calculation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Days in week: Start from Monday (1) to Sunday (0)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }> = [];

    // Prev month padding
    for (let i = startDay; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, dateStr: formatDate(d), isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: formatDate(d), isCurrentMonth: true });
    }

    // Next month padding to make full 35 or 42 grid
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, dateStr: formatDate(d), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    let day = d.getDay() - 1;
    if (day === -1) day = 6; // Monday is 0
    d.setDate(d.getDate() - day);

    const days: Array<{ date: Date; dateStr: string; dayName: string; dayNumber: number }> = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(d);
      current.setDate(d.getDate() + i);
      days.push({
        date: current,
        dateStr: formatDate(current),
        dayName: current.toLocaleDateString([], { weekday: 'short' }),
        dayNumber: current.getDate(),
      });
    }
    return days;
  }, [currentDate]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnDate = (dateStr: string, timeStr?: string) => {
    if (!draggedTaskId) return;
    onUpdateTaskDate(draggedTaskId, dateStr, timeStr);
    setDraggedTaskId(null);
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'border-l-2 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200';
      case 'medium':
        return 'border-l-2 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200';
      case 'low':
        return 'border-l-2 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200';
    }
  };

  const handleAddHolidayToSchedule = (h: HolidayEvent) => {
    if (onAddHolidayAsTask) {
      onAddHolidayAsTask(
        `${h.emoji} ${h.name}`,
        h.date,
        `${h.categoryName} • ${h.description} ${h.traditions ? '\nTraditions: ' + h.traditions : ''}`
      );
    } else {
      onOpenNewTask(h.date);
    }
  };

  const isHolidayAlreadyInTasks = (h: HolidayEvent): boolean => {
    return tasks.some(
      (t) => t.date === h.date && (t.title.includes(h.name) || (h.emoji && t.title.includes(h.emoji)))
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none">
      {/* Calendar Top Control Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
        {/* Brand Logo & Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Logo with clean styling */}
          <div className="flex items-center gap-2.5">
            <img
              src={appLogo}
              alt="Calendar Suite Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-2xs border border-neutral-200/70 dark:border-neutral-700/70"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Prev / Today / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Month & Year Display */}
          <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </span>

          {/* Month Festival Count Badge */}
          {showHolidays && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>
                {monthHolidaysCount} {monthHolidaysCount === 1 ? 'festival & holiday' : 'festivals & holidays'}
              </span>
            </span>
          )}
        </div>

        {/* Location & Public Holidays API Selector + View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Public Holidays API Location Selector */}
          <div className="relative">
            <button
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition cursor-pointer shadow-2xs"
              title="Change country for public holidays API"
            >
              <span className="text-base">{userCountry.flag}</span>
              <span className="font-semibold">{userCountry.name}</span>
              <span className="text-[10px] text-neutral-400 font-mono">({userCountry.code})</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Public Holidays API Active" />
            </button>

            {/* Country Dropdown Picker */}
            {isCountryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsCountryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 z-40 p-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Public Holidays Location</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">Live API</span>
                  </div>

                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />

                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => handleSelectCountry(c)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                          userCountry.code === c.code
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <span>{c.name}</span>
                        </div>
                        {userCountry.code === c.code && (
                          <Check className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between px-1">
                    <span>Powered by Public Holidays API</span>
                    <button
                      onClick={() => {
                        loadHolidays(currentYear, userCountry.code, true);
                        setIsCountryDropdownOpen(false);
                      }}
                      className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync Now</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={() => loadHolidays(currentYear, userCountry.code, true)}
            disabled={isLoadingApi}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            title="Refresh public holidays and festivals from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApi ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* Festivals & Holidays Toggle & Filter */}
          <div className="relative">
            <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 p-0.5">
              <button
                onClick={() => setShowHolidays(!showHolidays)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                  showHolidays
                    ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Toggle Festivals & Important Dates on calendar"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Holidays & Festivals</span>
              </button>

              {showHolidays && (
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`p-1.5 text-xs rounded-lg transition cursor-pointer ${
                    holidayFilter !== 'all'
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Filter categories"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdown Menu */}
            {isFilterDropdownOpen && showHolidays && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsFilterDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 z-30 p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Filter Dates & Festivals
                  </div>
                  {[
                    { id: 'all', label: 'All Dates & Festivals', icon: '✨' },
                    { id: 'national', label: `${userCountry.name} Public Holidays`, icon: userCountry.flag },
                    { id: 'festival', label: 'Festivals & Celebrations', icon: '🎉' },
                    { id: 'cultural', label: 'Cultural Traditions', icon: '🏮' },
                    { id: 'observance', label: 'Global Observances', icon: '🌍' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setHolidayFilter(item.id as any);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                        holidayFilter === item.id
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      {holidayFilter === item.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => onOpenNewTask(formatDate(currentDate))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* UPCOMING FESTIVALS & PUBLIC HOLIDAYS RIBBON */}
      {showHolidays && showUpcomingRibbon && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-purple-500/10 dark:from-amber-950/30 dark:via-emerald-950/20 dark:to-purple-950/30 border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Upcoming Festivals & Public Holidays for {userCountry.flag} {userCountry.name}
              </h4>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Fetched live via Public Holidays API • Click any card for traditions or to add to your schedule
              </span>
            </div>

            <button
              onClick={() => setShowUpcomingRibbon(false)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer flex items-center gap-1"
              title="Dismiss ribbon"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontal scroll cards */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            {upcomingHolidays.map((h) => {
              const [y, m, d] = h.date.split('-').map(Number);
              const eventD = new Date(y, m - 1, d);
              const dayStrFormatted = eventD.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const isToday = h.date === todayStr;

              // Calculate days away
              const todayD = new Date();
              todayD.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((eventD.getTime() - todayD.getTime()) / (1000 * 60 * 60 * 24));
              const relativeBadge =
                diffDays === 0
                  ? 'Today!'
                  : diffDays === 1
                  ? 'Tomorrow'
                  : diffDays < 0
                  ? `${Math.abs(diffDays)}d ago`
                  : `In ${diffDays} days`;

              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHoliday(h)}
                  className="shrink-0 group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/90 dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 hover:border-amber-400 dark:hover:border-amber-600/70 shadow-2xs transition-all cursor-pointer text-left"
                >
                  <span className="text-xl select-none group-hover:scale-110 transition-transform">
                    {h.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[140px]">
                      {h.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {isToday ? 'Today!' : dayStrFormatted}
                      </span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-medium text-neutral-600 dark:text-neutral-300">
                        {relativeBadge}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: MONTH */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 text-center py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/40">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-neutral-100 dark:divide-neutral-800">
            {monthDays.map(({ date, dateStr, isCurrentMonth }) => {
              const isToday = dateStr === todayStr;
              const dayTasks = tasks.filter((t) => t.date === dateStr);
              const dayHolidays = showHolidays ? holidaysMap.get(dateStr) || [] : [];
              const hasHoliday = dayHolidays.length > 0;

              return (
                <div
                  key={dateStr}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropOnDate(dateStr)}
                  onClick={() => onOpenNewTask(dateStr)}
                  className={`min-h-[115px] p-2 transition group hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 cursor-pointer relative ${
                    !isCurrentMonth ? 'opacity-35 bg-neutral-50/30 dark:bg-neutral-950/20' : ''
                  } ${hasHoliday ? 'bg-amber-50/15 dark:bg-amber-950/10' : ''}`}
                >
                  {/* Top Bar: Date Number + Holiday indicator + Quick Add */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {/* Small holiday dot indicator */}
                      {hasHoliday && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                          title="Public holiday or festival on this date"
                        />
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewTask(dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
                      title="Add task on this date"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Festivals & Public Holidays Badges in Date Cell */}
                  {hasHoliday && (
                    <div className="space-y-1 mb-1.5">
                      {dayHolidays.slice(0, 2).map((h) => {
                        return (
                          <div
                            key={h.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHoliday(h);
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 truncate cursor-pointer transition shadow-2xs hover:shadow-xs border ${
                              h.type === 'national'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                            }`}
                            title={`${h.emoji} ${h.name} (${h.categoryName}) - Click for details`}
                          >
                            <span className="shrink-0 text-xs">{h.emoji}</span>
                            <span className="truncate">{h.name}</span>
                          </div>
                        );
                      })}

                      {dayHolidays.length > 2 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHoliday(dayHolidays[2]);
                          }}
                          className="text-[9px] font-bold text-amber-700 dark:text-amber-300 hover:underline px-1"
                        >
                          +{dayHolidays.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks on this day */}
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, task.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className={`px-1.5 py-1 rounded text-[11px] font-medium truncate cursor-grab active:cursor-grabbing border ${getPriorityColor(
                          task.priority
                        )} ${task.completed ? 'line-through opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {task.startTime && (
                            <span className="font-mono text-[9px] opacity-75">{task.startTime}</span>
                          )}
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: WEEK */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs overflow-x-auto">
          <div className="min-w-[750px]">
            {/* Week Header */}
            <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 divide-x divide-neutral-100 dark:divide-neutral-800">
              {weekDays.map((wd) => {
                const isToday = wd.dateStr === todayStr;
                return (
                  <div key={wd.dateStr} className="p-3 text-center">
                    <div className="text-xs font-semibold text-neutral-500 uppercase">{wd.dayName}</div>
                    <div
                      className={`text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full mt-1 ${
                        isToday
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                          : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {wd.dayNumber}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week All-Day Festival / Public Holiday Row */}
            {showHolidays && (
              <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/30 dark:bg-amber-950/20 divide-x divide-neutral-100 dark:divide-neutral-800">
                {weekDays.map((wd) => {
                  const dayHolidays = holidaysMap.get(wd.dateStr) || [];
                  if (dayHolidays.length === 0) {
                    return <div key={`holiday-row-${wd.dateStr}`} className="p-1 min-h-[36px]" />;
                  }

                  return (
                    <div key={`holiday-row-${wd.dateStr}`} className="p-1 space-y-1 min-h-[36px]">
                      {dayHolidays.map((h) => (
                        <div
                          key={h.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHoliday(h);
                          }}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 truncate cursor-pointer hover:shadow-xs transition border ${
                            h.type === 'national'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60'
                          }`}
                          title={`${h.name} - Click for details`}
                        >
                          <span className="text-xs">{h.emoji}</span>
                          <span className="truncate">{h.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Week Content Columns */}
            <div className="grid grid-cols-7 divide-x divide-neutral-100 dark:divide-neutral-800 min-h-[500px]">
              {weekDays.map((wd) => {
                const dayTasks = tasks.filter((t) => t.date === wd.dateStr);

                return (
                  <div
                    key={wd.dateStr}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnDate(wd.dateStr)}
                    onClick={() => onOpenNewTask(wd.dateStr)}
                    className="p-2 space-y-2 hover:bg-neutral-50/40 dark:hover:bg-neutral-800/30 transition cursor-pointer"
                  >
                    {dayTasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-neutral-400 opacity-40">
                        Drop / Click
                      </div>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, task.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          className={`p-2 rounded-xl text-xs border shadow-2xs cursor-grab active:cursor-grabbing transition hover:shadow-xs ${getPriorityColor(
                            task.priority
                          )} ${task.completed ? 'line-through opacity-50' : ''}`}
                        >
                          <div className="font-semibold truncate">{task.title}</div>
                          <div className="flex items-center justify-between text-[10px] mt-1 opacity-80">
                            <span>{task.category}</span>
                            {task.startTime && <span className="font-mono">{task.startTime}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: DAY */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-xs text-neutral-400">
                Hourly agenda schedule for this day
              </p>
            </div>
            <button
              onClick={() => onOpenNewTask(formatDate(currentDate))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>

          {/* Day Festive & Public Holiday Banner if Current Day has any */}
          {showHolidays && (
            (() => {
              const dayStr = formatDate(currentDate);
              const dayHolidays = holidaysMap.get(dayStr) || [];
              if (dayHolidays.length === 0) return null;

              return (
                <div className="space-y-3">
                  {dayHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/10 dark:from-amber-950/40 dark:via-emerald-950/20 dark:to-amber-950/30 border border-amber-300/80 dark:border-amber-800/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl select-none">{h.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                              {h.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                              {h.categoryName}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-xl">
                            {h.description}
                          </p>
                          {h.greeting && (
                            <p className="text-xs italic text-amber-800 dark:text-amber-300 mt-1">
                              "{h.greeting}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedHoliday(h)}
                          className="px-3 py-1.5 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                        >
                          View Lore
                        </button>
                        <button
                          onClick={() => handleAddHolidayToSchedule(h)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Tasks</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}

          {/* Day Hour Slots (07:00 to 22:00) */}
          <div className="space-y-1">
            {Array.from({ length: 16 }).map((_, i) => {
              const hour = i + 7;
              const hourStr = `${String(hour).padStart(2, '0')}:00`;
              const dayStr = formatDate(currentDate);
              const matchingTasks = tasks.filter(
                (t) => t.date === dayStr && t.startTime && parseInt(t.startTime.split(':')[0]) === hour
              );

              return (
                <div
                  key={hour}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropOnDate(dayStr, hourStr)}
                  onClick={() => onOpenNewTask(dayStr, hourStr)}
                  className="flex items-start gap-4 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition cursor-pointer min-h-[56px] border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                >
                  <span className="w-14 text-xs font-mono font-medium text-neutral-400 shrink-0 pt-1">
                    {hourStr}
                  </span>

                  <div className="flex-1 flex flex-wrap gap-2">
                    {matchingTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, task.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className={`flex-1 min-w-[200px] p-2.5 rounded-xl border text-xs cursor-grab active:cursor-grabbing shadow-xs ${getPriorityColor(
                          task.priority
                        )} ${task.completed ? 'line-through opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{task.title}</span>
                          <span className="font-mono text-[11px] opacity-80">
                            {task.startTime} {task.endTime ? `– ${task.endTime}` : ''}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] opacity-75 mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Festival / Holiday Lore & Schedule Modal */}
      <HolidayModal
        holiday={selectedHoliday}
        isOpen={Boolean(selectedHoliday)}
        onClose={() => setSelectedHoliday(null)}
        onAddToSchedule={handleAddHolidayToSchedule}
        isAlreadyAdded={selectedHoliday ? isHolidayAlreadyInTasks(selectedHoliday) : false}
      />
    </div>
  );
};
