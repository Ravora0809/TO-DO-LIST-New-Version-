import React, { useState, useEffect } from 'react';
import appLogo from '../assets/images/app_logo_1789532070520.jpg';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const MobileAppBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Only show if not installed and not dismissed in current session
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (!dismissed && !isInstalled) {
      setIsDismissed(false);
    }
  }, [isInstalled]);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleAction = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="md:hidden mx-3 my-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 dark:from-amber-950/50 dark:via-neutral-900 dark:to-amber-950/40 border border-amber-300/70 dark:border-amber-700/60 shadow-xs flex items-center justify-between gap-2.5 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={appLogo}
            alt="Productivity Suite"
            className="w-8 h-8 rounded-xl object-cover shrink-0 border border-amber-300 dark:border-amber-700"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1.5">
              <span>Install Mobile App</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 truncate">
              Run full-screen & offline on your phone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAction}
            className="px-2.5 py-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
