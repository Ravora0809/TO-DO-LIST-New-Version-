import React, { useState, useRef, useEffect } from 'react';
import { WhiteboardTool } from '../../types';
import {
  MousePointer,
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Star,
  Type,
  StickyNote,
  Image as ImageIcon,
  MessageSquare,
  Link2,
  Layout,
  Zap,
  Undo2,
  Redo2,
  Trash2,
  RotateCcw,
  Smile,
  ChevronUp,
  Diamond,
  Database,
  Cloud,
} from 'lucide-react';

interface WhiteboardToolbarProps {
  currentTool: WhiteboardTool;
  onSelectTool: (tool: WhiteboardTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  onDeleteSelected: () => void;
  onClearCanvas: () => void;
  onImageUpload: (file: File) => void;
  onOpenIconModal: () => void;
}

interface ShapeOption {
  tool: WhiteboardTool;
  name: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const SHAPES: ShapeOption[] = [
  { tool: 'rectangle', name: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: 'R' },
  { tool: 'rounded-rect', name: 'Rounded Rect', icon: <div className="w-4 h-4 rounded-md border-2 border-current" /> },
  { tool: 'circle', name: 'Circle / Ellipse', icon: <Circle className="w-4 h-4" />, shortcut: 'O' },
  { tool: 'triangle', name: 'Triangle', icon: <Triangle className="w-4 h-4" /> },
  { tool: 'polygon', name: 'Polygon (Hexagon)', icon: <Hexagon className="w-4 h-4" /> },
  { tool: 'star', name: 'Star', icon: <Star className="w-4 h-4" /> },
  { tool: 'diamond', name: 'Diamond', icon: <Diamond className="w-4 h-4" /> },
  { tool: 'cylinder', name: 'Cylinder / Database', icon: <Database className="w-4 h-4" /> },
  { tool: 'cloud', name: 'Cloud', icon: <Cloud className="w-4 h-4" /> },
];

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  currentTool,
  onSelectTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasSelection,
  onDeleteSelected,
  onClearCanvas,
  onImageUpload,
  onOpenIconModal,
}) => {
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState<boolean>(false);
  const [activeShape, setActiveShape] = useState<WhiteboardTool>('rectangle');
  const shapesMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close shapes dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (shapesMenuRef.current && !shapesMenuRef.current.contains(e.target as Node)) {
        setIsShapesMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleShapeSelect = (tool: WhiteboardTool) => {
    setActiveShape(tool);
    onSelectTool(tool);
    setIsShapesMenuOpen(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = '';
    }
  };

  const isShapeToolActive = SHAPES.some((s) => s.tool === currentTool);

  const selectedShapeInfo = SHAPES.find((s) => s.tool === activeShape) || SHAPES[0];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-[96vw] overflow-x-auto select-none pointer-events-auto">
      {/* Hidden image file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Select / Move Tool (V) */}
      <button
        onClick={() => onSelectTool('select')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'select'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Select / Move (V)"
      >
        <MousePointer className="w-4 h-4" />
      </button>

      {/* Hand / Pan Tool (H) */}
      <button
        onClick={() => onSelectTool('hand')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'hand'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Hand / Pan (H or Space+Drag)"
      >
        <Hand className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5 shrink-0" />

      {/* Freehand Pencil Tool (P) */}
      <button
        onClick={() => onSelectTool('draw')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'draw'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Pencil / Draw (P)"
      >
        <Pen className="w-4 h-4" />
      </button>

      {/* Marker / Highlighter Tool (M) */}
      <button
        onClick={() => onSelectTool('marker')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'marker'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Pen / Marker (M)"
      >
        <Highlighter className="w-4 h-4" />
      </button>

      {/* Eraser Tool (E) */}
      <button
        onClick={() => onSelectTool('eraser')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'eraser'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Eraser (E)"
      >
        <Eraser className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5 shrink-0" />

      {/* Shapes Dropdown (Rectangle, Rounded, Circle, Triangle, Polygon, Star, etc.) */}
      <div className="relative" ref={shapesMenuRef}>
        <div className="flex items-center">
          <button
            onClick={() => onSelectTool(activeShape)}
            className={`p-2 rounded-l-xl transition cursor-pointer ${
              isShapeToolActive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={`${selectedShapeInfo.name} (${selectedShapeInfo.shortcut || 'Shape'})`}
          >
            {selectedShapeInfo.icon}
          </button>
          <button
            onClick={() => setIsShapesMenuOpen(!isShapesMenuOpen)}
            className={`p-1 pr-1.5 rounded-r-xl transition cursor-pointer ${
              isShapeToolActive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="More Shapes"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>

        {isShapesMenuOpen && (
          <div className="absolute bottom-full left-0 mb-3 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 grid grid-cols-3 gap-1">
            {SHAPES.map((s) => (
              <button
                key={s.tool}
                onClick={() => handleShapeSelect(s.tool)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                  currentTool === s.tool
                    ? 'bg-sky-500/10 text-sky-800 dark:text-sky-300 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title={s.name}
              >
                {s.icon}
                <span className="truncate max-w-[50px] text-[10px] mt-1">{s.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Line Tool (L) */}
      <button
        onClick={() => onSelectTool('line')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'line'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Line (L)"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Arrow Tool (A) */}
      <button
        onClick={() => onSelectTool('arrow')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'arrow'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Arrow (A)"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Connector Tool (K) */}
      <button
        onClick={() => onSelectTool('connector')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'connector'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Connector (K)"
      >
        <Link2 className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5 shrink-0" />

      {/* Text Tool (T) */}
      <button
        onClick={() => onSelectTool('text')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'text'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Text Box (T)"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Sticky Note Tool (S) */}
      <button
        onClick={() => onSelectTool('sticky')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'sticky'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Sticky Note (S)"
      >
        <StickyNote className="w-4 h-4" />
      </button>

      {/* Frame / Section Tool (F) */}
      <button
        onClick={() => onSelectTool('frame')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'frame'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Frame / Section Container (F)"
      >
        <Layout className="w-4 h-4" />
      </button>

      {/* Image Upload Tool */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        title="Upload Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* Comment Tool (C) */}
      <button
        onClick={() => onSelectTool('comment')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'comment'
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Add Comment (C)"
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      {/* Laser Pointer (Z) */}
      <button
        onClick={() => onSelectTool('laser')}
        className={`p-2 rounded-xl transition cursor-pointer relative group ${
          currentTool === 'laser'
            ? 'bg-rose-600 text-white shadow-xs animate-pulse'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title="Laser Pointer (Z) - Temporary glowing trail"
      >
        <Zap className="w-4 h-4" />
      </button>

      {/* Icons Library */}
      <button
        onClick={onOpenIconModal}
        className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        title="Architecture & UX Icons"
      >
        <Smile className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5 shrink-0" />

      {/* Undo & Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded-xl transition cursor-pointer ${
          canUndo
            ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
        }`}
        title="Undo (Ctrl/Cmd+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded-xl transition cursor-pointer ${
          canRedo
            ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
        }`}
        title="Redo (Ctrl/Cmd+Shift+Z)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      {/* Delete Selected (if any selected) */}
      {hasSelection && (
        <button
          onClick={onDeleteSelected}
          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
          title="Delete Selected (Backspace / Delete)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Clear Canvas */}
      <button
        onClick={onClearCanvas}
        className="p-2 rounded-xl text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        title="Clear Entire Canvas"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};
