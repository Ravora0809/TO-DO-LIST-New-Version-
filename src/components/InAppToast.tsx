import React, { useState, useEffect } from 'react';
import { Bell, X, CheckSquare } from 'lucide-react';
import { Task } from '../types';

interface InAppToastProps {
  onOpenTask: (task: Task) => void;
}

export const InAppToast: React.FC<InAppToastProps> = ({ onOpenTask }) => {
  const [toast, setToast] = useState<{ title: string; body: string; task: Task } | null>(null);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const custom = e as CustomEvent<{ title: string; body: string; task: Task }>;
      if (custom.detail) {
        setToast(custom.detail);
        // Auto dismiss after 8s
        setTimeout(() => {
          setToast(null);
        }, 8000);
      }
    };

    window.addEventListener('in-app-notification', handleNotification);
    return () => window.removeEventListener('in-app-notification', handleNotification);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-2xl border border-neutral-700 dark:border-neutral-200 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 dark:text-amber-600">
            Task Reminder
          </div>
          <h4 className="text-sm font-bold truncate mt-0.5">{toast.title}</h4>
          <p className="text-xs opacity-80 mt-0.5">{toast.body}</p>

          <button
            onClick={() => {
              onOpenTask(toast.task);
              setToast(null);
            }}
            className="mt-2 text-xs font-medium underline flex items-center gap-1 hover:opacity-100 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Open Task Details</span>
          </button>
        </div>
        <button
          onClick={() => setToast(null)}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
