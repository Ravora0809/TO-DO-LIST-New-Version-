import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  StickyNote as StickyNoteIcon,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  X,
  ArrowRight,
} from 'lucide-react';
import { Task, StickyNote, ViewType } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: StickyNote[];
  onSelectTask: (task: Task) => void;
  onSelectNote: (note: StickyNote) => void;
  onSelectView: (view: ViewType) => void;
  onOpenNewTask: () => void;
  onOpenNewNote: () => void;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  notes,
  onSelectTask,
  onSelectNote,
  onSelectView,
  onOpenNewTask,
  onOpenNewNote,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter items based on query
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: Array<{
      id: string;
      title: string;
      subtitle?: string;
      category: 'Actions' | 'Navigation' | 'Tasks' | 'Notes';
      icon: React.ComponentType<{ className?: string }>;
      action: () => void;
    }> = [];

    // Quick Actions
    result.push({
      id: 'action-new-task',
      title: 'Create New Task',
      subtitle: 'Open task editor (Shortcut: N)',
      category: 'Actions',
      icon: Plus,
      action: () => {
        onClose();
        onOpenNewTask();
      },
    });

    result.push({
      id: 'action-new-note',
      title: 'Create Sticky Note',
      subtitle: 'Add a new note to your board',
      category: 'Actions',
      icon: StickyNoteIcon,
      action: () => {
        onClose();
        onOpenNewNote();
      },
    });

    result.push({
      id: 'action-theme',
      title: 'Toggle Light/Dark Theme',
      subtitle: 'Switch workspace appearance',
      category: 'Actions',
      icon: Moon,
      action: () => {
        onClose();
        onToggleTheme();
      },
    });

    // Navigation
    const navs: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { id: 'dashboard', label: 'Dashboard', icon: ArrowRight },
      { id: 'tasks', label: 'Tasks List', icon: CheckSquare },
      { id: 'targets', label: 'Target Goals & Milestones', icon: ArrowRight },
      { id: 'rules', label: 'Work & Focus Rules', icon: ArrowRight },
      { id: 'whiteboard', label: 'Ideation Whiteboard', icon: ArrowRight },
      { id: 'ideaplanner', label: 'Idea Planner & Bug Notes', icon: ArrowRight },
      { id: 'calendar', label: 'Calendar View', icon: Calendar },
      { id: 'planner', label: 'Time Planner', icon: Clock },
      { id: 'notes', label: 'Sticky Notes Board', icon: StickyNoteIcon },
      { id: 'productivity', label: 'Productivity Stats', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];

    navs.forEach((nav) => {
      result.push({
        id: `nav-${nav.id}`,
        title: `Go to ${nav.label}`,
        category: 'Navigation',
        icon: nav.icon,
        action: () => {
          onClose();
          onSelectView(nav.id);
        },
      });
    });

    // Filter tasks
    if (q) {
      tasks
        .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((task) => {
          result.push({
            id: `task-${task.id}`,
            title: task.title,
            subtitle: `${task.category} • ${task.date || 'Unscheduled'} ${task.startTime || ''} ${task.completed ? '(Completed)' : ''}`,
            category: 'Tasks',
            icon: CheckSquare,
            action: () => {
              onClose();
              onSelectTask(task);
            },
          });
        });

      // Filter notes
      notes
        .filter((n) => !n.archived && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)))
        .slice(0, 4)
        .forEach((note) => {
          result.push({
            id: `note-${note.id}`,
            title: note.title || 'Untitled Note',
            subtitle: note.content.slice(0, 40) + '...',
            category: 'Notes',
            icon: StickyNoteIcon,
            action: () => {
              onClose();
              onSelectNote(note);
            },
          });
        });
    }

    if (!q) {
      return result;
    }

    return result.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [query, tasks, notes, onClose, onOpenNewTask, onOpenNewNote, onToggleTheme, onSelectView, onSelectTask, onSelectNote]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (items.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % (items.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-neutral-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            id="command-palette-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, task, or search notes..."
            className="w-full pl-3 pr-2 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-400">
              No matching commands, tasks, or notes found.
            </div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-xs text-neutral-400 truncate">{item.subtitle}</div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Navigate with <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700">↓</kbd></span>
          <span>Select with <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};
