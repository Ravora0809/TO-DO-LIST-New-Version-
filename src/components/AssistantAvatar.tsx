import React from 'react';
import { Sparkles, Mic, Volume2 } from 'lucide-react';

export type AssistantState = 'idle' | 'speaking' | 'listening';

interface AssistantAvatarProps {
  state?: AssistantState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  state = 'idle',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-18 h-18 text-base',
  };

  const ringSizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer pulsating wave ring when speaking or listening */}
      {state === 'speaking' && (
        <>
          <div
            className={`absolute ${ringSizeMap[size]} rounded-full border border-sky-400/40 dark:border-sky-300/30 animate-ping duration-1000`}
          />
          <div
            className={`absolute ${ringSizeMap[size]} rounded-full bg-sky-500/10 dark:bg-sky-400/10 animate-pulse duration-700`}
          />
        </>
      )}

      {state === 'listening' && (
        <>
          <div
            className={`absolute ${ringSizeMap[size]} rounded-full border border-rose-500/50 dark:border-rose-400/40 animate-ping duration-1000`}
          />
          <div
            className={`absolute ${ringSizeMap[size]} rounded-full bg-rose-500/15 dark:bg-rose-400/15 animate-pulse duration-500`}
          />
        </>
      )}

      {/* Main Avatar Body */}
      <div
        className={`relative z-10 ${sizeMap[size]} rounded-2xl sm:rounded-3xl flex items-center justify-center font-bold shadow-md transition-all duration-300 ${
          state === 'speaking'
            ? 'bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700 text-white dark:from-white dark:via-neutral-100 dark:to-neutral-200 dark:text-neutral-950 scale-105 shadow-sky-500/20'
            : state === 'listening'
            ? 'bg-rose-500 text-white scale-105 shadow-rose-500/30'
            : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:scale-102'
        }`}
      >
        {state === 'speaking' ? (
          <div className="flex items-center gap-0.5 sm:gap-1 px-1">
            <span className="w-1 h-3 sm:h-4 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-4 sm:h-5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-2 sm:h-3 bg-emerald-400 rounded-full animate-bounce" />
          </div>
        ) : state === 'listening' ? (
          <Mic className={size === 'lg' ? 'w-8 h-8 animate-pulse' : 'w-4 h-4 animate-pulse'} />
        ) : (
          <Sparkles className={size === 'lg' ? 'w-7 h-7 text-amber-400' : 'w-4 h-4 text-amber-400'} />
        )}
      </div>
    </div>
  );
};
