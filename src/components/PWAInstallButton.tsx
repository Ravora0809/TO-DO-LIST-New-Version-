import React, { useState } from 'react';
import { Smartphone, Download, Check, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isMac, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    // Open the comprehensive App & APK download modal
    setIsModalOpen(true);
  };

  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={handleClick}
          id="sidebar-pwa-install-btn"
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/60 shadow-2xs group ${className}`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="leading-tight font-bold">App & APK Hub</div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-normal">Android & Mac</div>
            </div>
          </div>
          {isInstalled ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:translate-y-0.5 transition-transform" />
          )}
        </button>

        <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'settings') {
    return (
      <>
        <button
          onClick={handleClick}
          id="settings-pwa-install-btn"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            isInstalled
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 shadow-sm'
          } ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{isInstalled ? 'App Active (Open Hub)' : 'Download App / APK (Android & Mac)'}</span>
        </button>

        <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Header variant
  return (
    <>
      <button
        onClick={handleClick}
        id="header-pwa-install-btn"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-300/90 dark:border-amber-700/80 bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/50 dark:to-amber-900/30 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-xs font-semibold transition cursor-pointer shadow-2xs hover:scale-102 active:scale-95 ${className}`}
        title="Download App & APK for Android and Mac"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="hidden sm:inline">App / APK</span>
      </button>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

