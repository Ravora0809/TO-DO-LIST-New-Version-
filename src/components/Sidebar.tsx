import React from 'react';
import appLogo from '../assets/images/app_logo_1789532070520.jpg';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  StickyNote as StickyNoteIcon,
  BarChart3,
  Settings,
  Plus,
  LogOut,
  Sparkles,
  Mic,
  Palette,
  FolderKanban,
  BookOpen,
  Target,
} from 'lucide-react';
import { ViewType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  onOpenNewTask: () => void;
  pendingCount: number;
  username: string;
  onLogout: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenNewTask,
  pendingCount,
  username,
  onLogout,
  onOpenVoiceAssistant,
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'targets', label: 'Targets & Goals', icon: Target },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { id: 'whiteboard', label: 'Whiteboard', icon: Palette },
    { id: 'ideaplanner', label: 'Idea & Bug Planner', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'planner', label: 'Planner', icon: Clock },
    { id: 'notes', label: 'Sticky Notes', icon: StickyNoteIcon },
    { id: 'productivity', label: 'Productivity', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-white/75 dark:bg-neutral-900/75 backdrop-blur-xl h-screen sticky top-0 shrink-0 select-none z-20">
      {/* Brand */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <img
            src={appLogo}
            alt="Productivity Suite Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-sm border border-neutral-200/60 dark:border-neutral-700/60"
            referrerPolicy="no-referrer"
          />
          <div className="leading-tight">
            <div className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">
              Productivity
            </div>
            <div className="text-[11px] text-neutral-400 font-medium">Personal Workspace</div>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-4 pb-2">
        <button
          onClick={onOpenNewTask}
          id="sidebar-new-task-btn"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 font-medium text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
          <kbd className="hidden lg:inline-block ml-auto text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/10">
            N
          </kbd>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              id={`nav-${item.id}`}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800/90 dark:text-white font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'
                }`}
              />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Install Mobile App CTA */}
      <div className="px-4 pb-2">
        <PWAInstallButton variant="sidebar" />
      </div>

      {/* Voice Assistant Trigger */}
      {onOpenVoiceAssistant && (
        <div className="px-4 pb-2">
          <button
            onClick={onOpenVoiceAssistant}
            id="sidebar-voice-btn"
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <span>Voice Assistant</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-normal group-hover:text-neutral-900 dark:group-hover:text-white">
              Talk
            </span>
          </button>
        </div>
      )}

      {/* User info & Logout */}
      <div className="p-4 border-t border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold text-xs flex items-center justify-center shrink-0">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 truncate">
                {username}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">Online</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            id="sidebar-logout-btn"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
