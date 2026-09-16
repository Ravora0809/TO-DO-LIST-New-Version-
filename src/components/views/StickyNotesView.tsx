import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  CheckSquare,
  Palette,
  Maximize2,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { StickyNote, NoteColor, Task } from '../../types';

interface StickyNotesViewProps {
  notes: StickyNote[];
  tasks: Task[];
  onEditNote: (note: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (note: StickyNote) => void;
  onOpenNewNote: () => void;
  onOpenTask: (task: Task) => void;
}

const COLOR_MAP: Record<NoteColor, { card: string; border: string; preview: string; pill: string }> = {
  yellow: {
    card: 'bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100',
    border: 'border-amber-200 dark:border-amber-800/60',
    preview: 'bg-amber-300',
    pill: 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200',
  },
  pink: {
    card: 'bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100',
    border: 'border-rose-200 dark:border-rose-800/60',
    preview: 'bg-rose-300',
    pill: 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200',
  },
  blue: {
    card: 'bg-sky-50 dark:bg-sky-950/30 text-sky-950 dark:text-sky-100',
    border: 'border-sky-200 dark:border-sky-800/60',
    preview: 'bg-sky-300',
    pill: 'bg-sky-200 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200',
  },
  green: {
    card: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    preview: 'bg-emerald-300',
    pill: 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200',
  },
  orange: {
    card: 'bg-orange-50 dark:bg-orange-950/30 text-orange-950 dark:text-orange-100',
    border: 'border-orange-200 dark:border-orange-800/60',
    preview: 'bg-orange-300',
    pill: 'bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200',
  },
  purple: {
    card: 'bg-purple-50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-100',
    border: 'border-purple-200 dark:border-purple-800/60',
    preview: 'bg-purple-300',
    pill: 'bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200',
  },
};

export const StickyNotesView: React.FC<StickyNotesViewProps> = ({
  notes,
  tasks,
  onEditNote,
  onDeleteNote,
  onUpdateNote,
  onOpenNewNote,
  onOpenTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<NoteColor | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Filter and sort notes (pinned first, then latest updated)
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (showArchived ? !note.archived : note.archived) return false;
        if (colorFilter !== 'all' && note.color !== colorFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          if (!matchTitle && !matchContent) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, showArchived, colorFilter, searchQuery]);

  const handleTogglePin = (note: StickyNote) => {
    onUpdateNote({
      ...note,
      pinned: !note.pinned,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleArchive = (note: StickyNote) => {
    onUpdateNote({
      ...note,
      archived: !note.archived,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleChangeColor = (note: StickyNote, newColor: NoteColor) => {
    onUpdateNote({
      ...note,
      color: newColor,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search sticky notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Color filter dots */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60">
            <button
              onClick={() => setColorFilter('all')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                colorFilter === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500'
              }`}
            >
              All
            </button>
            {(Object.keys(COLOR_MAP) as NoteColor[]).map((c) => (
              <button
                key={c}
                onClick={() => setColorFilter(c)}
                className={`w-4 h-4 rounded-full ${COLOR_MAP[c].preview} transition cursor-pointer ${
                  colorFilter === c ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          {/* Archived Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              showArchived
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {showArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            <span>{showArchived ? 'Active Notes' : 'Archived'}</span>
          </button>
        </div>

        {/* Add Note Button */}
        <button
          onClick={onOpenNewNote}
          id="add-sticky-note-btn"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* Sticky Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 p-6">
          <Palette className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {showArchived ? 'No archived notes' : 'No sticky notes yet'}
          </h4>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {showArchived
              ? 'Archived notes will appear here.'
              : 'Click "+ New Note" above to jot down thoughts, ideas, or attach notes to tasks.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
          {filteredNotes.map((note) => {
            const colors = COLOR_MAP[note.color] || COLOR_MAP.yellow;
            const attachedTask = note.attachedTaskId ? tasks.find((t) => t.id === note.attachedTaskId) : null;

            return (
              <div
                key={note.id}
                onClick={() => onEditNote(note)}
                className={`relative group p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer min-h-[200px] ${colors.card} ${colors.border}`}
              >
                {/* Note Header: Pin & Color Switcher */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm leading-snug truncate flex-1">
                      {note.title || 'Untitled Note'}
                    </h3>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleTogglePin(note)}
                        title={note.pinned ? 'Unpin' : 'Pin note'}
                        className={`p-1 rounded-md transition ${
                          note.pinned
                            ? 'text-neutral-900 dark:text-white bg-black/10 dark:bg-white/20'
                            : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleToggleArchive(note)}
                        title={note.archived ? 'Restore' : 'Archive'}
                        className="p-1 rounded-md text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-800 dark:hover:text-neutral-200 transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('Delete this note?')) onDeleteNote(note.id);
                        }}
                        title="Delete"
                        className="p-1 rounded-md text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap break-words line-clamp-6">
                    {note.content}
                  </p>
                </div>

                {/* Footer: Attachments + Color selector */}
                <div className="pt-4 mt-3 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
                  {/* Attached metadata tags */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    {attachedTask && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTask(attachedTask);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium truncate max-w-[180px] hover:underline cursor-pointer ${colors.pill}`}
                      >
                        <CheckSquare className="w-3 h-3 shrink-0" />
                        <span className="truncate">{attachedTask.title}</span>
                      </span>
                    )}

                    {note.attachedDate && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${colors.pill}`}>
                        <Calendar className="w-3 h-3" />
                        <span>{note.attachedDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Color dots picker on hover */}
                  <div
                    className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      {(Object.keys(COLOR_MAP) as NoteColor[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => handleChangeColor(note, c)}
                          className={`w-3 h-3 rounded-full ${COLOR_MAP[c].preview} transition hover:scale-125 ${
                            note.color === c ? 'ring-1 ring-neutral-900 dark:ring-white scale-110' : ''
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
