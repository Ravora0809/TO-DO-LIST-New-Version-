import React, { useState, useRef, useEffect } from 'react';
import { WhiteboardBoard } from '../../types';
import {
  Undo2,
  Redo2,
  Share2,
  Download,
  Settings,
  Maximize,
  Minimize,
  HelpCircle,
  Check,
  ChevronDown,
  Plus,
  Grid,
  FileCode,
  FileText,
  FileImage,
  Upload,
  FolderOpen,
  Sparkles,
  Layers,
  Edit2,
} from 'lucide-react';

interface WhiteboardTopNavProps {
  activeBoard: WhiteboardBoard | null;
  boards: WhiteboardBoard[];
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: 'saved' | 'saving';
  showLayersPanel: boolean;
  onToggleLayersPanel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectBoard: (boardId: string) => void;
  onCreateNewBoard: () => void;
  onRenameBoard: (newName: string) => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onOpenShareModal: () => void;
  onOpenHelpModal: () => void;
  // Settings
  gridMode: 'dots' | 'lines' | 'none';
  onChangeGridMode: (mode: 'dots' | 'lines' | 'none') => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const WhiteboardTopNav: React.FC<WhiteboardTopNavProps> = ({
  activeBoard,
  boards,
  canUndo,
  canRedo,
  saveStatus,
  showLayersPanel,
  onToggleLayersPanel,
  onUndo,
  onRedo,
  onSelectBoard,
  onCreateNewBoard,
  onRenameBoard,
  onExportPNG,
  onExportSVG,
  onExportPDF,
  onExportJSON,
  onImportJSON,
  onOpenShareModal,
  onOpenHelpModal,
  gridMode,
  onChangeGridMode,
  snapToGrid,
  onToggleSnapToGrid,
  showMinimap,
  onToggleMinimap,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [isBoardsMenuOpen, setIsBoardsMenuOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameInput, setRenameInput] = useState<string>('');

  const boardsMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (boardsMenuRef.current && !boardsMenuRef.current.contains(e.target as Node)) {
        setIsBoardsMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleStartRename = () => {
    setRenameInput(activeBoard?.name || 'Untitled Board');
    setIsRenaming(true);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (renameInput.trim()) {
      onRenameBoard(renameInput.trim());
    }
    setIsRenaming(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  return (
    <header className="absolute top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
      {/* Left: Board Selector, Title & Save indicator */}
      <div className="flex items-center gap-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg pointer-events-auto">
        {/* Board switcher */}
        <div className="relative" ref={boardsMenuRef}>
          <button
            onClick={() => setIsBoardsMenuOpen(!isBoardsMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-sky-500" />
            <span className="max-w-[120px] sm:max-w-[160px] truncate">
              {activeBoard?.name || 'Whiteboard'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {isBoardsMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Your Boards
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {boards.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSelectBoard(b.id);
                      setIsBoardsMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      b.id === activeBoard?.id
                        ? 'bg-sky-500/10 text-sky-900 dark:text-sky-300 font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="text-[10px] text-neutral-400 ml-2 shrink-0">
                      {b.elements.length} items
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-1.5 mt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => {
                    onCreateNewBoard();
                    setIsBoardsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Board
                </button>
              </div>
            </div>
          )}
        </div>

        {/* In-place Name Editor */}
        <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800 mx-0.5" />

        {isRenaming ? (
          <form onSubmit={handleSaveRename} className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onBlur={() => handleSaveRename()}
              className="text-xs px-2 py-0.5 rounded-lg border border-sky-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none w-36"
            />
            <button
              type="submit"
              className="p-1 text-emerald-500 hover:text-emerald-600"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={handleStartRename}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md transition"
            title="Rename board"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}

        {/* Save Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-neutral-400 font-medium">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
            }`}
          />
          <span>{saveStatus === 'saved' ? 'Saved' : 'Saving...'}</span>
        </div>

        {/* Toggle Layers Panel Button */}
        <button
          onClick={onToggleLayersPanel}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-xl transition cursor-pointer ${
            showLayersPanel
              ? 'bg-sky-500/10 text-sky-800 dark:text-sky-300 font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Toggle Layers Panel"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Layers</span>
        </button>
      </div>

      {/* Right Controls: Undo/Redo, Share, Export, Settings, Help, Fullscreen */}
      <div className="flex items-center gap-1.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg pointer-events-auto">
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            canUndo
              ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
          }`}
          title="Undo (Ctrl/Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-xl transition cursor-pointer ${
            canRedo
              ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
          }`}
          title="Redo (Ctrl/Cmd+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800 mx-0.5" />

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          title="Share board"
        >
          <Share2 className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-75" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Export Options
              </div>
              <button
                onClick={() => {
                  onExportPNG();
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
              >
                <FileImage className="w-4 h-4 text-emerald-500" />
                <span>Export High-Res PNG</span>
              </button>
              <button
                onClick={() => {
                  onExportSVG();
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-sky-500" />
                <span>Export Scalable Vector (SVG)</span>
              </button>
              <button
                onClick={() => {
                  onExportPDF();
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Export Document (PDF)</span>
              </button>
              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
              <button
                onClick={() => {
                  onExportJSON();
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>Export Whiteboard JSON</span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsExportMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-violet-500" />
                <span>Import JSON Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Input for JSON import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className="p-1.5 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Canvas Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isSettingsMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Grid Pattern
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {(['dots', 'lines', 'none'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onChangeGridMode(mode)}
                    className={`py-1 text-xs capitalize rounded-lg font-medium transition cursor-pointer ${
                      gridMode === mode
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={onToggleSnapToGrid}
                  className="w-full px-2 py-1.5 rounded-xl text-xs flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <span>Snap to Grid</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      snapToGrid ? 'bg-sky-500 text-white' : 'border border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {snapToGrid && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                <button
                  onClick={onToggleMinimap}
                  className="w-full px-2 py-1.5 rounded-xl text-xs flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <span>Minimap</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      showMinimap ? 'bg-sky-500 text-white' : 'border border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {showMinimap && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Help / Shortcuts */}
        <button
          onClick={onOpenHelpModal}
          className="p-1.5 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          title="Shortcuts & Help (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
