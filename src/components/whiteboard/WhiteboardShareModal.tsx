import React, { useState } from 'react';
import { WhiteboardBoard } from '../../types';
import { X, Share2, Copy, Check, Download, Link2, Sparkles } from 'lucide-react';
import { exportBoardToJSON } from './whiteboardUtils';

interface WhiteboardShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: WhiteboardBoard | null;
}

export const WhiteboardShareModal: React.FC<WhiteboardShareModalProps> = ({
  isOpen,
  onClose,
  board,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedJSON, setCopiedJSON] = useState<boolean>(false);

  if (!isOpen || !board) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(board, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Share Whiteboard
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                &ldquo;{board.name}&rdquo; &bull; {board.elements.length} elements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Link */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
            Shareable Applet URL
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 truncate font-mono">
              {currentUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition cursor-pointer shrink-0 shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* JSON Export and Backup */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
            Project Backup & Transfer
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Download the whiteboard file or copy raw JSON to import on other devices or collaborate offline.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => exportBoardToJSON(board)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Download .json</span>
            </button>
            <button
              onClick={handleCopyJSON}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
            >
              {copiedJSON ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJSON ? 'JSON Copied!' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
