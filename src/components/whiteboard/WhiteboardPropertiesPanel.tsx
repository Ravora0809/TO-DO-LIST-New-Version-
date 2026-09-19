import React from 'react';
import {
  WhiteboardElement,
  WhiteboardElementType,
} from '../../types';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Group,
  Ungroup,
  Layers,
  ChevronDown,
  ArrowRight,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface WhiteboardPropertiesPanelProps {
  selectedElements: WhiteboardElement[];
  onUpdateProperty: (updates: Partial<WhiteboardElement>) => void;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onLayerOrder: (action: 'front' | 'forward' | 'backward' | 'back') => void;
  onGroup: () => void;
  onUngroup: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onToggleHide: () => void;
}

const COLOR_PRESETS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'White', value: '#ffffff' },
  { name: 'Slate', value: '#f1f5f9' },
  { name: 'Sky', value: '#e0f2fe' },
  { name: 'Emerald', value: '#dcfce7' },
  { name: 'Amber', value: '#fef3c7' },
  { name: 'Rose', value: '#ffe4e6' },
  { name: 'Violet', value: '#ede9fe' },
  { name: 'Dark', value: '#1e293b' },
];

const STROKE_COLOR_PRESETS = [
  { name: 'Slate', value: '#475569' },
  { name: 'Sky', value: '#0284c7' },
  { name: 'Emerald', value: '#16a34a' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Black', value: '#0f172a' },
];

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Monospace', value: 'ui-monospace, monospace' },
  { label: 'Handwritten', value: 'Comic Sans MS, cursive, sans-serif' },
];

export const WhiteboardPropertiesPanel: React.FC<WhiteboardPropertiesPanelProps> = ({
  selectedElements,
  onUpdateProperty,
  onAlign,
  onDistribute,
  onLayerOrder,
  onGroup,
  onUngroup,
  onDuplicate,
  onDelete,
  onToggleLock,
  onToggleHide,
}) => {
  if (selectedElements.length === 0) return null;

  const first = selectedElements[0];
  const isMulti = selectedElements.length > 1;
  const isLocked = selectedElements.every((el) => el.locked);
  const isHidden = selectedElements.every((el) => el.hidden);
  const hasGroup = selectedElements.some((el) => !!el.groupId);

  const supportsFill = !['line', 'arrow', 'draw', 'marker'].includes(first.type);
  const supportsStroke = !['comment'].includes(first.type);
  const supportsText = ['text', 'sticky', 'rectangle', 'rounded-rect', 'circle', 'diamond', 'cylinder', 'cloud', 'frame', 'arrow', 'line'].includes(first.type);
  const isLineOrArrow = ['line', 'arrow', 'connector'].includes(first.type);

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 max-w-[95vw] overflow-x-auto text-neutral-800 dark:text-neutral-200 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
      {/* Fill Color */}
      {supportsFill && (
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Fill
          </span>
          <div className="flex items-center gap-1">
            {COLOR_PRESETS.slice(0, 6).map((c) => (
              <button
                key={c.name}
                onClick={() => onUpdateProperty({ fill: c.value })}
                title={`Fill: ${c.name}`}
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  first.fill === c.value
                    ? 'ring-2 ring-sky-500 ring-offset-1 scale-110'
                    : 'border-neutral-300 dark:border-neutral-700 hover:scale-105'
                }`}
                style={{
                  backgroundColor: c.value === 'transparent' ? 'transparent' : c.value,
                  backgroundImage:
                    c.value === 'transparent'
                      ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                      : undefined,
                  backgroundSize: '4px 4px',
                }}
              />
            ))}
            <input
              type="color"
              value={first.fill === 'transparent' ? '#ffffff' : first.fill || '#ffffff'}
              onChange={(e) => onUpdateProperty({ fill: e.target.value })}
              title="Custom Fill Color"
              className="w-5 h-5 p-0 rounded-full border border-neutral-300 dark:border-neutral-700 cursor-pointer overflow-hidden"
            />
          </div>
        </div>
      )}

      {/* Stroke Color & Thickness */}
      {supportsStroke && (
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Border
          </span>
          <div className="flex items-center gap-1">
            {STROKE_COLOR_PRESETS.slice(0, 5).map((c) => (
              <button
                key={c.name}
                onClick={() => onUpdateProperty({ stroke: c.value })}
                title={`Stroke: ${c.name}`}
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  first.stroke === c.value
                    ? 'ring-2 ring-sky-500 ring-offset-1 scale-110'
                    : 'border-neutral-300 dark:border-neutral-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <input
              type="color"
              value={first.stroke || '#0f172a'}
              onChange={(e) => onUpdateProperty({ stroke: e.target.value })}
              title="Custom Border Color"
              className="w-5 h-5 p-0 rounded-full border border-neutral-300 dark:border-neutral-700 cursor-pointer overflow-hidden"
            />
          </div>

          {/* Stroke Width Picker */}
          <div className="flex items-center gap-0.5 ml-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
            {[1, 2, 4, 8].map((w) => (
              <button
                key={w}
                onClick={() => onUpdateProperty({ strokeWidth: w })}
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded cursor-pointer transition ${
                  first.strokeWidth === w
                    ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
                title={`${w}px stroke`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Line Style (Solid / Dashed / Dotted) */}
          <div className="flex items-center gap-0.5 ml-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
            {(['solid', 'dashed', 'dotted'] as const).map((style) => (
              <button
                key={style}
                onClick={() => onUpdateProperty({ strokeStyle: style })}
                className={`px-1.5 py-0.5 text-[10px] uppercase font-bold rounded cursor-pointer transition ${
                  (first.strokeStyle || 'solid') === style
                    ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
                title={`${style} line style`}
              >
                {style[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opacity Slider */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Opacity
        </span>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={Math.round((first.opacity ?? 1) * 100)}
          onChange={(e) => onUpdateProperty({ opacity: Number(e.target.value) / 100 })}
          className="w-16 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <span className="text-[10px] font-mono w-7 text-right text-neutral-500">
          {Math.round((first.opacity ?? 1) * 100)}%
        </span>
      </div>

      {/* Corner Radius for Rectangles */}
      {first.type === 'rectangle' && (
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Radius
          </span>
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
            {[0, 8, 16, 24].map((r) => (
              <button
                key={r}
                onClick={() => onUpdateProperty({ cornerRadius: r })}
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded cursor-pointer transition ${
                  (first.cornerRadius ?? 0) === r
                    ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
                title={`${r}px radius`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Typography Controls */}
      {supportsText && (
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Text
          </span>

          {/* Font Family */}
          <select
            value={first.fontFamily || 'system-ui, sans-serif'}
            onChange={(e) => onUpdateProperty({ fontFamily: e.target.value })}
            className="text-[11px] bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg px-2 py-1 outline-none cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={first.fontSize || 14}
            onChange={(e) => onUpdateProperty({ fontSize: Number(e.target.value) })}
            className="text-[11px] bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg px-1.5 py-1 outline-none cursor-pointer font-mono text-neutral-700 dark:text-neutral-300"
          >
            {[11, 13, 15, 18, 22, 28, 36, 48].map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>

          {/* Text Formatting buttons */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
            <button
              onClick={() =>
                onUpdateProperty({
                  fontWeight: first.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
              className={`p-1 rounded transition cursor-pointer ${
                first.fontWeight === 'bold'
                  ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onUpdateProperty({
                  fontStyle: first.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              className={`p-1 rounded transition cursor-pointer ${
                first.fontStyle === 'italic'
                  ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onUpdateProperty({
                  textDecoration:
                    first.textDecoration === 'underline' ? 'none' : 'underline',
                })
              }
              className={`p-1 rounded transition cursor-pointer ${
                first.textDecoration === 'underline'
                  ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
            <button
              onClick={() => onUpdateProperty({ textAlign: 'left' })}
              className={`p-1 rounded transition cursor-pointer ${
                (first.textAlign || 'center') === 'left'
                  ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateProperty({ textAlign: 'center' })}
              className={`p-1 rounded transition cursor-pointer ${
                (first.textAlign || 'center') === 'center'
                  ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateProperty({ textAlign: 'right' })}
              className={`p-1 rounded transition cursor-pointer ${
                first.textAlign === 'right'
                  ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Multi-Selection Alignment Controls */}
      {isMulti && (
        <div className="flex items-center gap-1 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Align
          </span>
          <button
            onClick={() => onAlign('left')}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('center')}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('right')}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('top')}
            className="p-1 text-[11px] font-bold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Align Top"
          >
            Top
          </button>
          <button
            onClick={() => onAlign('middle')}
            className="p-1 text-[11px] font-bold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Align Middle"
          >
            Mid
          </button>
          <button
            onClick={() => onAlign('bottom')}
            className="p-1 text-[11px] font-bold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Align Bottom"
          >
            Bot
          </button>
          <button
            onClick={() => onDistribute('horizontal')}
            className="p-1 text-[11px] font-bold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Distribute Horizontally"
          >
            Dist H
          </button>
          <button
            onClick={() => onDistribute('vertical')}
            className="p-1 text-[11px] font-bold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            title="Distribute Vertically"
          >
            Dist V
          </button>
        </div>
      )}

      {/* Layer Ordering (Forward / Backward / Front / Back) */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
        <button
          onClick={() => onLayerOrder('front')}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Bring to Front (])"
        >
          <BringToFront className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onLayerOrder('forward')}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Bring Forward"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onLayerOrder('backward')}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Send Backward"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onLayerOrder('back')}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Send to Back ([)"
        >
          <SendToBack className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Group / Ungroup */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
        {isMulti && !hasGroup && (
          <button
            onClick={onGroup}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
            title="Group Objects (Ctrl/Cmd+G)"
          >
            <Group className="w-3.5 h-3.5" />
            Group
          </button>
        )}
        {hasGroup && (
          <button
            onClick={onUngroup}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
            title="Ungroup Objects (Ctrl/Cmd+Shift+G)"
          >
            <Ungroup className="w-3.5 h-3.5" />
            Ungroup
          </button>
        )}
        <button
          onClick={onToggleLock}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isLocked
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}
          title={isLocked ? 'Unlock element' : 'Lock element'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onToggleHide}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isHidden
              ? 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}
          title={isHidden ? 'Show element' : 'Hide element'}
        >
          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Duplicate & Delete */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onDuplicate}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
          title="Duplicate (Ctrl/Cmd+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 transition cursor-pointer"
          title="Delete (Delete/Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
