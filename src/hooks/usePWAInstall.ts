import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isChromium, setIsChromium] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // Detect standalone mode (already installed on Android, iOS, or Desktop)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Detect user agents and platforms
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform ? window.navigator.platform.toLowerCase() : '';

    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    const mac = /mac|macintosh|macintel/.test(platform) || /macintosh/.test(userAgent);
    const win = /win/.test(platform) || /windows/.test(userAgent);
    const chromeOrEdge = /chrome|crios|edg/.test(userAgent) && !/opr|opera/.test(userAgent);
    const safari = /safari/.test(userAgent) && !/chrome|crios|edg|android/.test(userAgent);

    setIsIOS(ios);
    setIsAndroid(android);
    setIsMac(mac && !ios);
    setIsWindows(win);
    setIsChromium(chromeOrEdge);
    setIsSafari(safari);

    // Get active URL
    try {
      setAppUrl(window.location.origin || window.location.href);
    } catch {
      setAppUrl('');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('PWA install prompt failed:', err);
    }
    return false;
  };

  const pwabuilderUrl = appUrl
    ? `https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`
    : 'https://www.pwabuilder.com';

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isMac,
    isWindows,
    isChromium,
    isSafari,
    appUrl,
    pwabuilderUrl,
    install,
  };
}

