import React, { useState, useEffect } from 'react';
import { X, Pin, Calendar, CheckSquare, Trash2, Palette } from 'lucide-react';
import { StickyNote, NoteColor, Task } from '../types';

interface StickyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: StickyNote | null;
  tasks: Task[];
  onSave: (noteData: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

const COLORS: { id: NoteColor; label: string; bg: string; border: string; preview: string }[] = [
  { id: 'yellow', label: 'Warm Yellow', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/60', preview: 'bg-amber-300' },
  { id: 'pink', label: 'Rose Pink', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800/60', preview: 'bg-rose-300' },
  { id: 'blue', label: 'Sky Blue', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800/60', preview: 'bg-sky-300' },
  { id: 'green', label: 'Mint Green', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60', preview: 'bg-emerald-300' },
  { id: 'orange', label: 'Peach Orange', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800/60', preview: 'bg-orange-300' },
  { id: 'purple', label: 'Lavender Purple', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/60', preview: 'bg-purple-300' },
];

export const StickyNoteModal: React.FC<StickyNoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  tasks,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [pinned, setPinned] = useState(false);
  const [attachedTaskId, setAttachedTaskId] = useState('');
  const [attachedDate, setAttachedDate] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setColor(noteToEdit.color);
      setPinned(noteToEdit.pinned);
      setAttachedTaskId(noteToEdit.attachedTaskId || '');
      setAttachedDate(noteToEdit.attachedDate || '');
    } else {
      setTitle('');
      setContent('');
      setColor('yellow');
      setPinned(false);
      setAttachedTaskId('');
      setAttachedDate('');
    }
  }, [noteToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    onSave({
      id: noteToEdit?.id,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      color,
      pinned,
      archived: noteToEdit ? noteToEdit.archived : false,
      attachedTaskId: attachedTaskId || undefined,
      attachedDate: attachedDate || undefined,
      position: noteToEdit?.position || { x: 50, y: 50 },
      size: noteToEdit?.size || { width: 280, height: 240 },
    });

    onClose();
  };

  if (!isOpen) return null;

  const currentColorObj = COLORS.find((c) => c.id === color) || COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800`}>
        {/* Header with color indicator */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full ${currentColorObj.preview}`} />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {noteToEdit ? 'Edit Sticky Note' : 'New Sticky Note'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                pinned
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
              }`}
              title={pinned ? 'Pinned to top' : 'Pin note'}
            >
              <Pin className={`w-4 h-4 ${pinned ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              id="note-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title (e.g. 💡 Meeting Brainstorming)"
              className="w-full text-base font-semibold px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>

          {/* Content */}
          <div>
            <textarea
              rows={5}
              id="note-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write anything... quick notes, bullet points, checklists, links..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
            />
          </div>

          {/* Color Chooser */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
              <Palette className="w-3.5 h-3.5" />
              <span>Note Color</span>
            </label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${c.preview} transition-all cursor-pointer ${
                    color === c.id
                      ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-900 scale-110'
                      : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Optional Attachments: Attach to Task or Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Link to Task (Optional)</span>
              </label>
              <select
                value={attachedTaskId}
                onChange={(e) => setAttachedTaskId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="">None</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title.slice(0, 30)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Attach Date (Optional)</span>
              </label>
              <input
                type="date"
                value={attachedDate}
                onChange={(e) => setAttachedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {noteToEdit && onDelete ? (
              <button
                type="button"
                id="note-delete-btn"
                onClick={() => {
                  if (window.confirm('Delete this sticky note?')) {
                    onDelete(noteToEdit.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Note</span>
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
                id="note-save-btn"
                className="px-5 py-2 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-xl shadow-xs transition cursor-pointer"
              >
                {noteToEdit ? 'Update Note' : 'Create Note'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
