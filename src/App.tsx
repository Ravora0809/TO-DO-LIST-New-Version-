import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Task,
  StickyNote,
  UserSettings,
  ViewType,
  ThemeMode,
} from './types';
import {
  loadTasks,
  saveTasks,
  loadNotes,
  saveNotes,
  loadSettings,
  saveSettings,
  computeNextRecurringDate,
  generateSeedTasks,
  generateSeedNotes,
  DEFAULT_SETTINGS,
} from './services/storage';
import { verifyAuth, logoutUser, getStoredUser } from './services/auth';
import { parseNaturalTaskInput } from './services/nlp';
import { playCompleteSound } from './services/sound';
import {
  requestNotificationPermission,
  checkTaskReminders,
  isNotificationSupported,
} from './services/notifications';

import { LoginModal } from './components/LoginModal';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { TaskModal } from './components/TaskModal';
import { StickyNoteModal } from './components/StickyNoteModal';
import { InAppToast } from './components/InAppToast';
import { VoiceGreetingModal } from './components/VoiceGreetingModal';
import { VoiceAssistantWidget } from './components/VoiceAssistantWidget';
import { VoiceAssistantAction } from './types';

import { DashboardView } from './components/views/DashboardView';
import { TasksView } from './components/views/TasksView';
import { CalendarView } from './components/views/CalendarView';
import { PlannerView } from './components/views/PlannerView';
import { StickyNotesView } from './components/views/StickyNotesView';
import { ProductivityView } from './components/views/ProductivityView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('Ravora');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Core Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Navigation & View
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Modals & Panels
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [initialTaskDate, setInitialTaskDate] = useState<string | undefined>();
  const [initialTaskTime, setInitialTaskTime] = useState<string | undefined>();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<StickyNote | null>(null);

  // Voice Assistant Modals & State
  const [isVoiceGreetingOpen, setIsVoiceGreetingOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  // Initialize data and check auth
  useEffect(() => {
    const init = async () => {
      const stored = getStoredUser();
      const authResult = await verifyAuth();
      if (authResult.isValid) {
        setIsAuthenticated(true);
        setCurrentUser(authResult.username && authResult.username !== 'admin' && authResult.username !== 'Alex' ? authResult.username : 'Ravora');
      } else {
        setCurrentUser('Ravora');
      }

      setTasks(loadTasks());
      setNotes(loadNotes());
      const loadedSettings = loadSettings();
      setSettings(loadedSettings);
      setIsAuthChecking(false);

      // Check auto greeting on open
      const alreadyGreeted = sessionStorage.getItem('ravora_greeted');
      if (
        !alreadyGreeted &&
        loadedSettings.autoGreetOnOpen &&
        loadedSettings.voiceAssistantEnabled
      ) {
        setTimeout(() => {
          setIsVoiceGreetingOpen(true);
        }, 500);
      }
    };
    init();
  }, []);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (settings.theme === 'dark') {
      applyTheme(true);
    } else if (settings.theme === 'light') {
      applyTheme(false);
    } else {
      // System mode
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  // Persist tasks on change
  const updateTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  }, []);

  // Persist notes on change
  const updateNotes = useCallback((newNotes: StickyNote[]) => {
    setNotes(newNotes);
    saveNotes(newNotes);
  }, []);

  // Persist settings on change
  const handleUpdateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (newSettings.name) {
      setCurrentUser(newSettings.name);
    }
  }, []);

  // Periodic Reminder Checker
  useEffect(() => {
    const interval = setInterval(() => {
      const firedIds = checkTaskReminders(tasks);
      if (firedIds.length > 0) {
        const updated = tasks.map((t) => {
          if (firedIds.includes(t.id) && t.reminder) {
            return {
              ...t,
              reminder: { ...t.reminder, notified: true },
            };
          }
          return t;
        });
        updateTasks(updated);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [tasks, updateTasks]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Cmd+K or Ctrl+K for command menu
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsTaskModalOpen(false);
        setIsNoteModalOpen(false);
        return;
      }

      // Single-letter shortcuts when NOT typing in an input
      if (!isInput) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setTaskToEdit(null);
          setInitialTaskDate(undefined);
          setInitialTaskTime(undefined);
          setIsTaskModalOpen(true);
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          setCurrentView('calendar');
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setIsCommandPaletteOpen(true);
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          setIsVoiceAssistantOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Task Handlers
  const handleToggleTask = useCallback(
    (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const willBeCompleted = !target.completed;

      if (willBeCompleted) {
        playCompleteSound(settings.soundEnabled);
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#10b981', '#6366f1', '#f59e0b'],
          });
        } catch (e) {
          // ignore
        }
      }

      // If task has recurring configuration and is being completed, handle next occurrence!
      let updatedList = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            completed: willBeCompleted,
            completedAt: willBeCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });

      if (willBeCompleted && target.recurring && target.date) {
        const nextDate = computeNextRecurringDate(target.date, target.recurring);
        const nextTask: Task = {
          ...target,
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: nextDate,
          completed: false,
          completedAt: undefined,
          createdAt: new Date().toISOString(),
          subtasks: target.subtasks.map((s) => ({ ...s, completed: false })),
          reminder: target.reminder ? { ...target.reminder, notified: false } : undefined,
          order: target.order + 1,
        };
        updatedList = [nextTask, ...updatedList];
      }

      updateTasks(updatedList);
    },
    [tasks, settings.soundEnabled, updateTasks]
  );

  const handleSaveTask = useCallback(
    (taskData: Omit<Task, 'id' | 'order' | 'createdAt'> & { id?: string }) => {
      if (taskData.id) {
        // Edit existing
        const updated = tasks.map((t) =>
          t.id === taskData.id
            ? {
                ...t,
                ...taskData,
                order: t.order,
                createdAt: t.createdAt,
              }
            : t
        );
        updateTasks(updated);
      } else {
        // Add new
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: taskData.title,
          description: taskData.description,
          completed: false,
          createdAt: new Date().toISOString(),
          priority: taskData.priority,
          category: taskData.category || settings.defaultCategory || 'Work',
          date: taskData.date,
          startTime: taskData.startTime,
          endTime: taskData.endTime,
          subtasks: taskData.subtasks || [],
          reminder: taskData.reminder,
          recurring: taskData.recurring,
          order: tasks.length + 1,
        };
        updateTasks([newTask, ...tasks]);
      }
    },
    [tasks, settings.defaultCategory, updateTasks]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      updateTasks(tasks.filter((t) => t.id !== taskId));
    },
    [tasks, updateTasks]
  );

  const handleQuickAddTask = useCallback(
    (rawInput: string) => {
      const parsed = parseNaturalTaskInput(rawInput);
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: parsed.title,
        completed: false,
        createdAt: new Date().toISOString(),
        priority: parsed.priority || settings.defaultPriority || 'medium',
        category: parsed.category || settings.defaultCategory || 'Work',
        date: parsed.date || new Date().toISOString().split('T')[0],
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        subtasks: [],
        recurring: parsed.recurring,
        order: tasks.length + 1,
      };
      updateTasks([newTask, ...tasks]);
    },
    [tasks, settings.defaultPriority, settings.defaultCategory, updateTasks]
  );

  const handleUpdateTaskDate = useCallback(
    (taskId: string, newDate: string, newStartTime?: string) => {
      const updated = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            date: newDate,
            startTime: newStartTime !== undefined ? newStartTime : t.startTime,
          };
        }
        return t;
      });
      updateTasks(updated);
    },
    [tasks, updateTasks]
  );

  const handleUpdateTaskTime = useCallback(
    (taskId: string, date: string, startTime: string) => {
      const updated = tasks.map((t) => {
        if (t.id === taskId) {
          const [h, m] = startTime.split(':');
          const nextH = (parseInt(h) + 1) % 24;
          const endTime = `${String(nextH).padStart(2, '0')}:${m}`;
          return {
            ...t,
            date,
            startTime,
            endTime,
          };
        }
        return t;
      });
      updateTasks(updated);
    },
    [tasks, updateTasks]
  );

  // Notes Handlers
  const handleSaveNote = useCallback(
    (noteData: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
      if (noteData.id) {
        // Edit existing
        const updated = notes.map((n) =>
          n.id === noteData.id
            ? {
                ...n,
                ...noteData,
                updatedAt: now,
              }
            : n
        );
        updateNotes(updated);
      } else {
        // Create new
        const newNote: StickyNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: noteData.title,
          content: noteData.content,
          color: noteData.color,
          pinned: noteData.pinned,
          archived: noteData.archived,
          attachedTaskId: noteData.attachedTaskId,
          attachedDate: noteData.attachedDate,
          position: noteData.position || { x: 30, y: 30 },
          size: noteData.size || { width: 280, height: 240 },
          createdAt: now,
          updatedAt: now,
        };
        updateNotes([newNote, ...notes]);
      }
    },
    [notes, updateNotes]
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      updateNotes(notes.filter((n) => n.id !== noteId));
    },
    [notes, updateNotes]
  );

  const handleUpdateNote = useCallback(
    (updatedNote: StickyNote) => {
      updateNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    },
    [notes, updateNotes]
  );

  // Settings & Data actions
  const handleExportData = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      notes,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.tasks)) {
        updateTasks(parsed.tasks);
      }
      if (Array.isArray(parsed.notes)) {
        updateNotes(parsed.notes);
      }
      if (parsed.settings) {
        handleUpdateSettings({ ...settings, ...parsed.settings });
      }
      alert('Data restored successfully!');
    } catch (e) {
      alert('Invalid backup file format.');
    }
  };

  const handleClearCompletedTasks = () => {
    updateTasks(tasks.filter((t) => !t.completed));
  };

  const handleClearAllData = () => {
    updateTasks([]);
    updateNotes([]);
  };

  const handleResetDemoData = () => {
    const seedTasks = generateSeedTasks();
    const seedNotes = generateSeedNotes();
    updateTasks(seedTasks);
    updateNotes(seedNotes);
    handleUpdateSettings(DEFAULT_SETTINGS);
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    handleUpdateSettings({
      ...settings,
      notificationsEnabled: granted,
    });
  };

  const handleToggleTheme = () => {
    const next: ThemeMode =
      settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'dark' : 'dark';
    handleUpdateSettings({ ...settings, theme: next });
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
  };

  // Open task creator modal helpers
  const handleOpenNewTask = (initialDate?: string, initialTime?: string) => {
    setTaskToEdit(null);
    setInitialTaskDate(initialDate);
    setInitialTaskTime(initialTime);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewNote = () => {
    setNoteToEdit(null);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: StickyNote) => {
    setNoteToEdit(note);
    setIsNoteModalOpen(true);
  };

  // Today ISO Date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Toggle voice mute
  const handleToggleVoiceMute = useCallback(() => {
    setSettings((prev) => {
      const updated = { ...prev, voiceMuted: !prev.voiceMuted };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Voice Assistant command execution dispatcher
  const handleExecuteVoiceAction = useCallback(
    (action: VoiceAssistantAction) => {
      switch (action.type) {
        case 'open_view':
          if (action.payload === 'open_task_modal') {
            handleOpenNewTask();
          } else {
            setCurrentView(action.payload as ViewType);
          }
          break;
        case 'add_task':
          handleSaveTask(action.payload);
          break;
        case 'complete_task':
          handleToggleTask(action.payload);
          break;
        case 'move_task':
          handleUpdateTaskTime(action.payload.taskId, todayStr, action.payload.time);
          break;
        case 'delete_task':
          handleDeleteTask(action.payload);
          break;
        case 'delete_note':
          handleDeleteNote(action.payload);
          break;
        case 'add_note':
          handleSaveNote({
            title: 'Voice Note',
            content: action.payload.content || 'Voice quick note',
            color: 'yellow',
            pinned: false,
            archived: false,
          });
          setCurrentView('notes');
          break;
        case 'query_tasks':
        case 'query_overdue':
          setCurrentView('tasks');
          break;
        case 'query_next':
          setCurrentView('planner');
          break;
        case 'query_holidays':
          setCurrentView('calendar');
          break;
        default:
          break;
      }
    },
    [handleSaveTask, handleToggleTask, handleUpdateTaskTime, handleDeleteTask, handleSaveNote, todayStr]
  );

  // Add holiday / festival to tasks
  const handleAddHolidayAsTask = useCallback(
    (title: string, date: string, description?: string) => {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        description: description || 'Festive celebration & holiday observance',
        completed: false,
        createdAt: new Date().toISOString(),
        priority: 'medium',
        category: 'Personal',
        date,
        subtasks: [],
        order: tasks.length + 1,
      };
      updateTasks([newTask, ...tasks]);
    },
    [tasks, updateTasks]
  );

  // Counts
  const pendingCount = useMemo(
    () => tasks.filter((t) => !t.completed && t.date === todayStr).length,
    [tasks, todayStr]
  );

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-8 h-8 border-3 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Login Screen if not authenticated */}
      {!isAuthenticated && (
        <LoginModal
          onLoginSuccess={(username) => {
            setIsAuthenticated(true);
            setCurrentUser(username);
          }}
        />
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenNewTask={() => handleOpenNewTask()}
        pendingCount={pendingCount}
        username={currentUser}
        onLogout={handleLogout}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Header Bar */}
        <Header
          currentView={currentView}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onOpenNewTask={() => handleOpenNewTask()}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
          notificationsEnabled={settings.notificationsEnabled}
          onRequestNotifications={handleRequestNotifications}
          voiceAssistantEnabled={settings.voiceAssistantEnabled}
          voiceMuted={settings.voiceMuted}
          onToggleVoiceMute={handleToggleVoiceMute}
          onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        />

        {/* Dynamic Views Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              notes={notes}
              username={currentUser}
              onToggleTask={handleToggleTask}
              onEditTask={handleOpenEditTask}
              onOpenNewTask={handleOpenNewTask}
              onEditNote={handleOpenEditNote}
              onOpenNewNote={handleOpenNewNote}
              onNavigate={setCurrentView}
              onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            />
          )}

          {currentView === 'tasks' && (
            <TasksView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
              onQuickAddTask={handleQuickAddTask}
              onReorderTasks={updateTasks}
              onOpenNewTaskModal={() => handleOpenNewTask()}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onEditTask={handleOpenEditTask}
              onUpdateTaskDate={handleUpdateTaskDate}
              onOpenNewTask={handleOpenNewTask}
              onAddHolidayAsTask={handleAddHolidayAsTask}
            />
          )}

          {currentView === 'planner' && (
            <PlannerView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onEditTask={handleOpenEditTask}
              onUpdateTaskTime={handleUpdateTaskTime}
              onOpenNewTask={handleOpenNewTask}
            />
          )}

          {currentView === 'notes' && (
            <StickyNotesView
              notes={notes}
              tasks={tasks}
              onEditNote={handleOpenEditNote}
              onDeleteNote={handleDeleteNote}
              onUpdateNote={handleUpdateNote}
              onOpenNewNote={handleOpenNewNote}
              onOpenTask={handleOpenEditTask}
            />
          )}

          {currentView === 'productivity' && <ProductivityView tasks={tasks} />}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onClearCompletedTasks={handleClearCompletedTasks}
              onClearAllData={handleClearAllData}
              onResetDemoData={handleResetDemoData}
              onRequestNotifications={handleRequestNotifications}
              onTestVoiceGreeting={() => setIsVoiceGreetingOpen(true)}
              username={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onSelectView={setCurrentView}
        pendingCount={pendingCount}
      />

      {/* Command Palette Menu */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        notes={notes}
        onSelectTask={(task) => {
          handleOpenEditTask(task);
        }}
        onSelectNote={(note) => {
          handleOpenEditNote(note);
        }}
        onSelectView={(view) => {
          setCurrentView(view);
        }}
        onOpenNewTask={() => handleOpenNewTask()}
        onOpenNewNote={() => handleOpenNewNote()}
        onToggleTheme={handleToggleTheme}
      />

      {/* Task Edit/Create Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        initialDate={initialTaskDate}
        initialTime={initialTaskTime}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Sticky Note Modal */}
      <StickyNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
        tasks={tasks}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />

      {/* Interactive Voice Productivity Assistant Greeting */}
      <VoiceGreetingModal
        isOpen={isVoiceGreetingOpen}
        onClose={() => {
          sessionStorage.setItem('ravora_greeted', 'true');
          setIsVoiceGreetingOpen(false);
        }}
        username={currentUser}
        tasks={tasks}
        voiceMuted={settings.voiceMuted}
        onToggleMute={handleToggleVoiceMute}
        onStartMyDay={(task) => {
          setCurrentView('planner');
          if (task) {
            handleOpenEditTask(task);
          }
        }}
        onViewSchedule={() => setCurrentView('planner')}
        onAddTask={() => handleOpenNewTask()}
      />

      {/* Interactive Voice Assistant Listening & Command Execution Widget */}
      <VoiceAssistantWidget
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        tasks={tasks}
        notes={notes}
        username={currentUser}
        voiceMuted={settings.voiceMuted}
        onToggleMute={handleToggleVoiceMute}
        onExecuteAction={handleExecuteVoiceAction}
      />

      {/* In-app Toast for active reminders */}
      <InAppToast onOpenTask={handleOpenEditTask} />
    </div>
  );
}
