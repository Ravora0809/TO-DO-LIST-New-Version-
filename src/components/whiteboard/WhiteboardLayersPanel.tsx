import React, { useState } from 'react';
import { WhiteboardElement, WhiteboardElementType } from '../../types';
import {
  Layers,
  Square,
  Circle,
  Diamond,
  Database,
  Cloud,
  ArrowRight,
  Minus,
  PenTool,
  Type,
  StickyNote,
  Image as ImageIcon,
  MessageSquare,
  Link2,
  Layout,
  Star,
  Triangle,
  Hexagon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  X,
  Edit2,
  Check,
} from 'lucide-react';

interface WhiteboardLayersPanelProps {
  elements: WhiteboardElement[];
  selectedIds: string[];
  onSelectElement: (id: string, isMulti: boolean) => void;
  onToggleLock: (id: string) => void;
  onToggleHide: (id: string) => void;
  onRenameElement: (id: string, newName: string) => void;
  onDeleteElement: (id: string) => void;
  onLayerOrder: (id: string, action: 'front' | 'forward' | 'backward' | 'back') => void;
  onClose: () => void;
}

function getElementIcon(type: WhiteboardElementType) {
  switch (type) {
    case 'rectangle':
    case 'rounded-rect':
      return <Square className="w-3.5 h-3.5" />;
    case 'circle':
      return <Circle className="w-3.5 h-3.5" />;
    case 'triangle':
      return <Triangle className="w-3.5 h-3.5" />;
    case 'polygon':
      return <Hexagon className="w-3.5 h-3.5" />;
    case 'star':
      return <Star className="w-3.5 h-3.5" />;
    case 'diamond':
      return <Diamond className="w-3.5 h-3.5" />;
    case 'cylinder':
      return <Database className="w-3.5 h-3.5" />;
    case 'cloud':
      return <Cloud className="w-3.5 h-3.5" />;
    case 'line':
      return <Minus className="w-3.5 h-3.5" />;
    case 'arrow':
    case 'connector':
      return <ArrowRight className="w-3.5 h-3.5" />;
    case 'draw':
    case 'marker':
      return <PenTool className="w-3.5 h-3.5" />;
    case 'text':
      return <Type className="w-3.5 h-3.5" />;
    case 'sticky':
      return <StickyNote className="w-3.5 h-3.5" />;
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5" />;
    case 'comment':
      return <MessageSquare className="w-3.5 h-3.5" />;
    case 'frame':
      return <Layout className="w-3.5 h-3.5" />;
    default:
      return <Square className="w-3.5 h-3.5" />;
  }
}

function getDefaultName(el: WhiteboardElement): string {
  if (el.name) return el.name;
  if (el.text) {
    const preview = el.text.split('\n')[0].slice(0, 20);
    return preview || el.type;
  }
  return `${el.type.charAt(0).toUpperCase() + el.type.slice(1)}`;
}

export const WhiteboardLayersPanel: React.FC<WhiteboardLayersPanelProps> = ({
  elements,
  selectedIds,
  onSelectElement,
  onToggleLock,
  onToggleHide,
  onRenameElement,
  onDeleteElement,
  onLayerOrder,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  // Sort elements with highest zIndex at top
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const startRename = (el: WhiteboardElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(el.id);
    setRenameInput(getDefaultName(el));
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (renameInput.trim()) {
      onRenameElement(id, renameInput.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="absolute top-16 left-6 z-40 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-140px)] animate-in fade-in slide-in-from-left-2 duration-150 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-500" />
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Layers & Objects ({elements.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
        {sortedElements.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-neutral-400 dark:text-neutral-500">
            No objects on canvas. Use the toolbar below to add shapes, text, or sticky notes.
          </div>
        ) : (
          sortedElements.map((el) => {
            const isSelected = selectedIds.includes(el.id);

            return (
              <div
                key={el.id}
                onClick={(e) => onSelectElement(el.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-sky-500/10 text-sky-900 dark:text-sky-300 font-medium border border-sky-500/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                } ${el.hidden ? 'opacity-40' : ''}`}
              >
                {/* Icon & Label */}
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <span
                    className="shrink-0"
                    style={{ color: el.stroke && el.stroke !== '#ffffff' ? el.stroke : undefined }}
                  >
                    {getElementIcon(el.type)}
                  </span>

                  {editingId === el.id ? (
                    <form
                      onSubmit={(e) => saveRename(el.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 flex-1"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onBlur={() => saveRename(el.id)}
                        className="w-full text-xs px-1.5 py-0.5 rounded border border-sky-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                      />
                      <button type="submit" className="text-emerald-500 hover:text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <span
                      onDoubleClick={(e) => startRename(el, e)}
                      className="truncate text-xs"
                      title="Double click to rename"
                    >
                      {getDefaultName(el)}
                    </span>
                  )}
                </div>

                {/* Layer actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHide(el.id);
                    }}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                    title={el.hidden ? 'Show' : 'Hide'}
                  >
                    {el.hidden ? <EyeOff className="w-3 h-3 text-rose-500" /> : <Eye className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(el.id);
                    }}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                    title={el.locked ? 'Unlock' : 'Lock'}
                  >
                    {el.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerOrder(el.id, 'forward');
                    }}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                    title="Bring forward"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerOrder(el.id, 'backward');
                    }}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                    title="Send backward"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(el.id);
                    }}
                    className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-500"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
