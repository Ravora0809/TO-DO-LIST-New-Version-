import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  StickyNote,
  BarChart3,
  Settings,
  Plus,
  Palette,
  FolderKanban,
  BookOpen,
  Target,
} from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  pendingCount: number;
  onOpenNewTask?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onSelectView,
  pendingCount,
  onOpenNewTask,
}) => {
  const tabs: {
    id: ViewType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'targets', label: 'Targets', icon: Target },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { id: 'whiteboard', label: 'Board', icon: Palette },
    { id: 'ideaplanner', label: 'Ideas', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl px-1.5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectView(tab.id)}
            id={`bottom-nav-${tab.id}`}
            className={`flex-1 min-w-0 min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl text-[10px] font-medium transition-all duration-150 relative cursor-pointer active:scale-95 ${
              isActive
                ? 'text-neutral-950 dark:text-white font-bold bg-neutral-100/90 dark:bg-neutral-800/90'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'
                }`}
              />
              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span className="mt-0.5 truncate tracking-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* Floating quick add button for mobile */}
      {onOpenNewTask && (
        <button
          onClick={onOpenNewTask}
          id="mobile-nav-quick-add"
          className="ml-1 mr-0.5 w-10 h-10 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer shrink-0"
          title="Quick Add Task"
          aria-label="Add Task"
        >
          <Plus className="w-5 h-5 stroke-[2.5px]" />
        </button>
      )}
    </nav>
  );
};
