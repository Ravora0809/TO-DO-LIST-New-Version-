import React from 'react';
import { X, Keyboard, Command, MousePointer, Move, Sparkles } from 'lucide-react';

interface WhiteboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    category: 'Creation & Drawing Tools',
    shortcuts: [
      { key: 'V', desc: 'Select & Move tool' },
      { key: 'H', desc: 'Hand / Pan canvas' },
      { key: 'P', desc: 'Pencil / Freehand drawing' },
      { key: 'M', desc: 'Marker / Highlighter pen' },
      { key: 'E', desc: 'Eraser tool' },
      { key: 'R', desc: 'Rectangle shape' },
      { key: 'O', desc: 'Circle / Ellipse shape' },
      { key: 'L', desc: 'Line' },
      { key: 'A', desc: 'Arrow' },
      { key: 'K', desc: 'Connector line' },
      { key: 'T', desc: 'Text box' },
      { key: 'S', desc: 'Sticky note' },
      { key: 'F', desc: 'Frame / Section container' },
      { key: 'C', desc: 'Comment bubble' },
      { key: 'Z', desc: 'Laser pointer (fading trail)' },
    ],
  },
  {
    category: 'Object Editing & Manipulation',
    shortcuts: [
      { key: 'Delete / Backspace', desc: 'Delete selected object(s)' },
      { key: 'Ctrl / ⌘ + D', desc: 'Duplicate selected object' },
      { key: 'Ctrl / ⌘ + C', desc: 'Copy selected objects' },
      { key: 'Ctrl / ⌘ + V', desc: 'Paste copied objects' },
      { key: 'Ctrl / ⌘ + A', desc: 'Select all canvas objects' },
      { key: 'Ctrl / ⌘ + Z', desc: 'Undo last change' },
      { key: 'Ctrl / ⌘ + Shift + Z', desc: 'Redo previously undone change' },
      { key: 'Ctrl / ⌘ + G', desc: 'Group selected objects' },
      { key: 'Ctrl / ⌘ + Shift + G', desc: 'Ungroup selected objects' },
      { key: ']', desc: 'Bring forward in layers' },
      { key: '[', desc: 'Send backward in layers' },
      { key: 'Escape', desc: 'Deselect or return to Select tool' },
      { key: 'Shift + Drag', desc: 'Constrain 1:1 aspect ratio or straight line' },
      { key: 'Arrow Keys', desc: 'Nudge selected (Shift + Arrow for 10px)' },
    ],
  },
  {
    category: 'Canvas Navigation & Zoom',
    shortcuts: [
      { key: 'Space + Drag', desc: 'Pan canvas smoothly' },
      { key: 'Middle Mouse Drag', desc: 'Pan canvas' },
      { key: 'Scroll Wheel', desc: 'Pinch / Zoom in and out' },
      { key: 'Double Click Object', desc: 'Directly edit text inside shape' },
      { key: 'Shift + Click', desc: 'Add / remove from multi-selection' },
    ],
  },
];

export const WhiteboardHelpModal: React.FC<WhiteboardHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Keyboard Shortcuts & Interaction Guide
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Speed up your brainstorming and architecture workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {group.category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-xs"
                  >
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                      {sc.desc}
                    </span>
                    <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-mono text-[11px] font-semibold shadow-2xs shrink-0 ml-2">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
          <span>Tip: Hold Space at any time to temporarily pan without changing your active tool.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
