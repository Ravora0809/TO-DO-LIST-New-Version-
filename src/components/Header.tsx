import React from 'react';
import appLogo from '../assets/images/app_logo_1789532070520.jpg';
import {
  Search,
  Plus,
  Sun,
  Moon,
  Laptop,
  Bell,
  BellRing,
  Mic,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ViewType, ThemeMode } from '../types';

interface HeaderProps {
  currentView: ViewType;
  onOpenSearch: () => void;
  onOpenNewTask: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  notificationsEnabled: boolean;
  onRequestNotifications: () => void;
  voiceAssistantEnabled: boolean;
  voiceMuted: boolean;
  onToggleVoiceMute: () => void;
  onOpenVoiceAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenSearch,
  onOpenNewTask,
  theme,
  onToggleTheme,
  notificationsEnabled,
  onRequestNotifications,
  voiceAssistantEnabled,
  voiceMuted,
  onToggleVoiceMute,
  onOpenVoiceAssistant,
}) => {
  const titles: Record<ViewType, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your daily focus and schedule' },
    tasks: { title: 'Tasks', subtitle: 'Organize, prioritize, and check off items' },
    calendar: { title: 'Calendar', subtitle: 'Schedule & visualize upcoming tasks and events' },
    planner: { title: 'Time Planner', subtitle: 'Structure your day hour by hour' },
    notes: { title: 'Sticky Notes', subtitle: 'Capture quick ideas, reminders, and thoughts' },
    productivity: { title: 'Productivity', subtitle: 'Insights, streaks, and completion analytics' },
    settings: { title: 'Settings', subtitle: 'Preferences, notifications, and data management' },
  };

  const currentMeta = titles[currentView];

  return (
    <header className="h-16 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 select-none">
      <div className="flex items-center gap-2.5">
        <img
          src={appLogo}
          alt="Productivity Suite Logo"
          className="w-8 h-8 rounded-xl object-cover shadow-2xs md:hidden border border-neutral-200/70 dark:border-neutral-700/70"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white leading-tight">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Bar / Button */}
        <button
          onClick={onOpenSearch}
          id="global-search-trigger"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700 text-xs transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Task */}
        <button
          onClick={onOpenNewTask}
          id="header-quick-add-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 text-xs font-medium transition cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Task</span>
        </button>

        {/* Talk to Assistant Button */}
        {voiceAssistantEnabled && (
          <button
            onClick={onOpenVoiceAssistant}
            id="header-voice-assistant-btn"
            title="Talk to Voice Assistant"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-800/60 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer hover:scale-102 active:scale-95"
          >
            <Mic className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="hidden sm:inline">Talk to Assistant</span>
          </button>
        )}

        {/* Voice Mute Toggle */}
        {voiceAssistantEnabled && (
          <button
            onClick={onToggleVoiceMute}
            id="header-voice-mute-btn"
            title={voiceMuted ? 'Voice Muted (Click to unmute)' : 'Voice Audio Active (Click to mute)'}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>
        )}

        {/* Notification Permission Bell */}
        <button
          onClick={onRequestNotifications}
          id="header-notification-btn"
          title={notificationsEnabled ? 'Reminders Active' : 'Enable Reminders'}
          className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
            notificationsEnabled
              ? 'border-neutral-200 dark:border-neutral-800 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          {notificationsEnabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          id="header-theme-toggle-btn"
          title={`Current theme: ${theme}. Click to switch.`}
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : theme === 'light' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Laptop className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
