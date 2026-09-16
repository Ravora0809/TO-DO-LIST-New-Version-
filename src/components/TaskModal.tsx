import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Flag,
  Tag,
  Bell,
  Repeat,
  AlignLeft,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Task, Priority, Subtask, ReminderConfig, RecurringConfig } from '../types';
import { parseNaturalTaskInput } from '../services/nlp';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  initialDate?: string;
  initialTime?: string;
  onSave: (taskData: Omit<Task, 'id' | 'order' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

const CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Finance'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialDate,
  initialTime,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [reminderType, setReminderType] = useState<ReminderConfig['type'] | 'none'>('none');
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [recurringType, setRecurringType] = useState<RecurringConfig['type'] | 'none'>('none');
  const [recurringInterval, setRecurringInterval] = useState(1);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      if (CATEGORIES.includes(taskToEdit.category)) {
        setCategory(taskToEdit.category);
        setIsCustomCategory(false);
      } else {
        setIsCustomCategory(true);
        setCustomCategory(taskToEdit.category);
      }
      setPriority(taskToEdit.priority);
      setDate(taskToEdit.date || '');
      setStartTime(taskToEdit.startTime || '');
      setEndTime(taskToEdit.endTime || '');
      setSubtasks(taskToEdit.subtasks || []);
      setReminderType(taskToEdit.reminder ? taskToEdit.reminder.type : 'none');
      setReminderMinutes(taskToEdit.reminder?.minutesBefore || 15);
      setRecurringType(taskToEdit.recurring ? taskToEdit.recurring.type : 'none');
      setRecurringInterval(taskToEdit.recurring?.interval || 1);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Work');
      setIsCustomCategory(false);
      setCustomCategory('');
      setPriority('medium');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStartTime(initialTime || '');
      setEndTime(initialTime ? `${String(Math.min(23, parseInt(initialTime.split(':')[0]) + 1)).padStart(2, '0')}:${initialTime.split(':')[1]}` : '');
      setSubtasks([]);
      setNewSubtaskTitle('');
      setReminderType('none');
      setReminderMinutes(15);
      setRecurringType('none');
      setRecurringInterval(1);
    }
  }, [taskToEdit, initialDate, initialTime, isOpen]);

  // Handle Natural input assist on paste or typing
  const handleTitleBlur = () => {
    if (!taskToEdit && title.length > 5) {
      const parsed = parseNaturalTaskInput(title);
      if (parsed.title !== title) {
        setTitle(parsed.title);
        if (parsed.date) setDate(parsed.date);
        if (parsed.startTime) setStartTime(parsed.startTime);
        if (parsed.endTime) setEndTime(parsed.endTime);
        if (parsed.priority) setPriority(parsed.priority);
        if (parsed.category) {
          if (CATEGORIES.includes(parsed.category)) {
            setCategory(parsed.category);
            setIsCustomCategory(false);
          } else {
            setIsCustomCategory(true);
            setCustomCategory(parsed.category);
          }
        }
        if (parsed.recurring) {
          setRecurringType(parsed.recurring.type);
        }
      }
    }
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => (s.id !== id)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : category;

    let reminder: ReminderConfig | undefined = undefined;
    if (reminderType !== 'none') {
      reminder = {
        type: reminderType,
        minutesBefore: reminderType === 'custom' ? reminderMinutes : undefined,
        notified: false,
      };
    }

    let recurring: RecurringConfig | undefined = undefined;
    if (recurringType !== 'none') {
      recurring = {
        type: recurringType,
        interval: recurringType === 'custom' ? recurringInterval : undefined,
      };
    }

    onSave({
      id: taskToEdit?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      completed: taskToEdit ? taskToEdit.completed : false,
      completedAt: taskToEdit?.completedAt,
      priority,
      category: finalCategory,
      date: date || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      subtasks,
      reminder,
      recurring,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl my-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {taskToEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title Input */}
          <div>
            <input
              type="text"
              id="task-title-input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="What needs to be done? (e.g. Finish report tomorrow at 10 AM)"
              className="w-full text-base font-medium px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
              required
            />
            <p className="mt-1 text-[11px] text-neutral-400">
              Tip: Supports natural language like <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded font-mono">Buy milk tomorrow at 5pm #Personal !high</code>
            </p>
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <Flag className="w-3.5 h-3.5" />
                <span>Priority</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                  const isSel = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-medium rounded-lg capitalize transition cursor-pointer ${
                        isSel
                          ? p === 'high'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : p === 'medium'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-emerald-600 text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Category</span>
              </label>
              <div className="flex gap-2">
                {!isCustomCategory ? (
                  <select
                    id="task-category-select"
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Category</option>
                  </select>
                ) : (
                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="px-2 py-1 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    >
                      Preset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date and Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Date</span>
              </label>
              <input
                type="date"
                id="task-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                id="task-starttime-input"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (e.target.value && !endTime) {
                    const [h, m] = e.target.value.split(':');
                    const nextH = (parseInt(h) + 1) % 24;
                    setEndTime(`${String(nextH).padStart(2, '0')}:${m}`);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                id="task-endtime-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Reminders and Recurring */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reminder */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>Reminder</span>
              </label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="none">No reminder</option>
                <option value="at_time">At task time</option>
                <option value="5m">5 minutes before</option>
                <option value="10m">10 minutes before</option>
                <option value="30m">30 minutes before</option>
                <option value="custom">Custom minutes before</option>
              </select>
              {reminderType === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(parseInt(e.target.value) || 15)}
                    className="w-20 px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  />
                  <span className="text-xs text-neutral-500">minutes before</span>
                </div>
              )}
            </div>

            {/* Recurring */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <Repeat className="w-3.5 h-3.5" />
                <span>Recurring</span>
              </label>
              <select
                value={recurringType}
                onChange={(e) => setRecurringType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Every Weekday (Mon–Fri)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom days interval</option>
              </select>
              {recurringType === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Every</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                    className="w-16 px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  />
                  <span className="text-xs text-neutral-500">days</span>
                </div>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              <span>Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})</span>
            </label>
            <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 group"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(sub.id)}
                    className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-xs ${
                      sub.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddSubtask()}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Notes / Description</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra details, checklist links, or context..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {taskToEdit && onDelete ? (
              <button
                type="button"
                id="task-delete-btn"
                onClick={() => {
                  if (window.confirm('Delete this task?')) {
                    onDelete(taskToEdit.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="task-save-btn"
                className="px-5 py-2 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-xl shadow-xs transition cursor-pointer"
              >
                {taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
