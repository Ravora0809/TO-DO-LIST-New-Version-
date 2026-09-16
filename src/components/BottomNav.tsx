import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  StickyNote,
  BarChart3,
  Settings,
} from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  pendingCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onSelectView,
  pendingCount,
}) => {
  const tabs: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'planner', label: 'Planner', icon: Clock },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'productivity', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectView(tab.id)}
            id={`bottom-nav-${tab.id}`}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors relative cursor-pointer ${
              isActive
                ? 'text-neutral-950 dark:text-white font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
