import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  MapPin,
  Heart,
  Copy,
  Check,
  Plus,
  Share2,
  Tag,
  Info,
} from 'lucide-react';
import { HolidayEvent } from '../services/holidays';

interface HolidayModalProps {
  holiday: HolidayEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToSchedule: (holiday: HolidayEvent) => void;
  isAlreadyAdded?: boolean;
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
  holiday,
  isOpen,
  onClose,
  onAddToSchedule,
  isAlreadyAdded = false,
}) => {
  const [copiedGreeting, setCopiedGreeting] = useState(false);
  const [added, setAdded] = useState(false);

  if (!isOpen || !holiday) return null;

  // Format date readable
  const [year, month, day] = holiday.date.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  const dateFormatted = eventDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate days away
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let countdownText = '';
  if (diffDays === 0) {
    countdownText = '🎉 Today!';
  } else if (diffDays === 1) {
    countdownText = 'Tomorrow';
  } else if (diffDays > 1) {
    countdownText = `In ${diffDays} days`;
  } else if (diffDays === -1) {
    countdownText = 'Yesterday';
  } else {
    countdownText = `${Math.abs(diffDays)} days ago`;
  }

  const handleCopyGreeting = () => {
    if (!holiday.greeting) return;
    navigator.clipboard.writeText(holiday.greeting);
    setCopiedGreeting(true);
    setTimeout(() => setCopiedGreeting(false), 2000);
  };

  const handleAdd = () => {
    onAddToSchedule(holiday);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Banner */}
        <div className="h-28 bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-purple-500/20 dark:from-amber-500/30 dark:via-rose-500/25 dark:to-purple-500/30 p-6 flex items-start justify-between relative border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-4xl filter drop-shadow-sm select-none">{holiday.emoji}</span>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-white/80 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200 shadow-2xs border border-neutral-200/60 dark:border-neutral-700/60">
                {holiday.categoryName}
              </span>
              <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                <span className="font-semibold text-neutral-900 dark:text-white">{countdownText}</span>
                {holiday.regions && holiday.regions.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      {holiday.regions.join(', ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer shadow-2xs border border-neutral-200/50 dark:border-neutral-700/50"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Header Title & Date */}
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {holiday.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>{dateFormatted}</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {holiday.description}
          </div>

          {/* Traditions & Rituals if available */}
          {holiday.traditions && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Celebrations & Traditions
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 p-3 rounded-xl leading-normal">
                {holiday.traditions}
              </p>
            </div>
          )}

          {/* Traditional Greeting Quote */}
          {holiday.greeting && (
            <div className="p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Festive Greeting
                </span>
                <p className="text-xs font-medium italic text-neutral-800 dark:text-neutral-200">
                  "{holiday.greeting}"
                </p>
              </div>
              <button
                onClick={handleCopyGreeting}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Copy festive greeting"
              >
                {copiedGreeting ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleAdd}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shadow-xs ${
                added || isAlreadyAdded
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 hover:bg-emerald-700'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100'
              }`}
            >
              {added || isAlreadyAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{added ? 'Added to Tasks!' : 'In Your Schedule'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to My Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
