import React, { useState, useEffect } from 'react';
import appLogo from '../assets/images/app_logo_1789532070520.jpg';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Wifi,
  Bell,
  Zap,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Terminal,
  Laptop,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'android' | 'mac' | 'ios' | 'apk_tools';
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  initialTab,
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isMac,
    isChromium,
    appUrl,
    pwabuilderUrl,
    install,
  } = usePWAInstall();

  // Determine initial tab based on detected platform
  const [activeTab, setActiveTab] = useState<'android' | 'mac' | 'ios' | 'apk_tools'>('android');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCli, setCopiedCli] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (isMac) {
      setActiveTab('mac');
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  }, [isOpen, initialTab, isMac, isIOS]);

  if (!isOpen) return null;

  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  const handleCopyLink = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyCli = (command: string, key: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCli(key);
    setTimeout(() => setCopiedCli(null), 2500);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    currentUrl || 'https://ai.studio'
  )}&margin=8`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl my-auto rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="relative p-5 sm:p-6 pb-4 bg-gradient-to-br from-amber-500/15 via-neutral-100/60 to-transparent dark:from-amber-500/10 dark:via-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={appLogo}
              alt="Personal Productivity Suite"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-md border border-neutral-200 dark:border-neutral-700 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                  Mobile App & Desktop
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Run natively on Android & Mac
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mt-1 truncate">
                Install as App (Android & Mac)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Full standalone application, offline capable, no browser URL bar
              </p>
            </div>
          </div>

          {/* Quick Platform Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-5 p-1 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/80 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'android'
                  ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Android (APK & App)</span>
            </button>

            <button
              onClick={() => setActiveTab('mac')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'mac'
                  ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Mac (macOS App)</span>
            </button>

            <button
              onClick={() => setActiveTab('ios')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'ios'
                  ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Share className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>iOS (iPhone/iPad)</span>
            </button>

            <button
              onClick={() => setActiveTab('apk_tools')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'apk_tools'
                  ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>CLI / Build APK</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* ANDROID TAB */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              {/* Method 1: Instant WebAPK Install (Fastest) */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Direct Install on Android (Recommended WebAPK)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    No download needed
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Google Chrome on Android turns this web app directly into a native Android app via
                  Google Play's <strong>WebAPK</strong> engine. It installs into your Android app drawer
                  with an app icon, splash screen, and full offline caching.
                </p>

                {isInstallable && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on this Device Now</span>
                  </button>
                )}

                <div className="bg-white/80 dark:bg-neutral-900/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5">
                  <p className="font-semibold text-neutral-900 dark:text-white">How to install on Android:</p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
                    <li>Open this URL in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on Android</li>
                    <li>Tap the <strong>three dots (⋮)</strong> menu in the upper right corner</li>
                    <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                    <li>Tap <strong>Install</strong> — it now runs like any regular Play Store app!</li>
                  </ol>
                </div>
              </div>

              {/* Method 2: Download as standalone APK file via PWABuilder */}
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Download as APK File (PWABuilder Package)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    .APK file
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  If you need a standalone <strong>.apk</strong> file to sideload, test, or distribute on Android,
                  Microsoft's official <strong>PWABuilder</strong> packages this live app into a ready-to-install Android APK
                  file in 30 seconds.
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={pwabuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs hover:opacity-90 transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download APK on PWABuilder</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-0.5" />
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied App Link!' : 'Copy App URL'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code to quickly open on Android phone */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 flex flex-col sm:flex-row items-center gap-4">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-neutral-200 dark:border-neutral-700 shrink-0">
                  <img
                    src={qrImageUrl}
                    alt="Scan to open on phone"
                    className="w-28 h-28 object-contain"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                    <QrCode className="w-4 h-4 text-amber-500" />
                    <span>Scan with Android Camera</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Point your Android camera at this QR code to immediately open the app on your phone, then tap "Install App" to add it to your app drawer.
                  </p>
                  <p className="text-[11px] font-mono text-neutral-400 break-all truncate max-w-xs">
                    {currentUrl}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MAC (macOS) TAB */}
          {activeTab === 'mac' && (
            <div className="space-y-4">
              {/* Method 1: Chrome / Edge on Mac */}
              <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Google Chrome & Microsoft Edge on Mac (.app Bundle)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                    Native Mac Window
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  When installed in Chrome or Edge on macOS, the system compiles a native <strong>.app</strong> into
                  your <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[11px]">/Applications</code> folder.
                  It gets pinned to your <strong>macOS Dock</strong>, opens in its own window with macOS red/yellow/green window controls,
                  and operates without the browser address bar.
                </p>

                {isInstallable && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install as Native Mac App</span>
                  </button>
                )}

                <div className="bg-white/80 dark:bg-neutral-900/80 p-3 rounded-xl border border-sky-100 dark:border-sky-900/40 text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5">
                  <p className="font-semibold text-neutral-900 dark:text-white">Installation Steps on Mac:</p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
                    <li>
                      Look at the right side of the address bar in Chrome or Edge (at the top of your screen)
                    </li>
                    <li>
                      Click the <strong>Install icon</strong> (screen with down arrow), OR click menu <strong>(⋮) &gt; "Save and share" &gt; "Install Personal Productivity Suite"</strong>
                    </li>
                    <li>
                      Click <strong>Install</strong>. The app launches immediately as a dedicated macOS app in your Dock!
                    </li>
                  </ol>
                </div>
              </div>

              {/* Method 2: Apple Safari on Mac */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Apple Safari on macOS (Sonoma & Sequoia)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                    File &gt; Add to Dock
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Safari in macOS 14+ supports one-click native web app creation:
                </p>

                <ol className="list-decimal list-inside space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-white/80 dark:bg-neutral-900/80 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <li>Open this URL in <strong>Safari</strong> on your Mac</li>
                  <li>Click <strong>File</strong> in the top Mac menu bar (or click the <strong>Share</strong> icon)</li>
                  <li>Click <strong>"Add to Dock..."</strong></li>
                  <li>Click <strong>Add</strong> — the app is now in your Mac Dock and Launchpad!</li>
                </ol>
              </div>
            </div>
          )}

          {/* IOS TAB */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Share className="w-4 h-4 text-purple-600" />
                  <span>How to Install on iPhone & iPad</span>
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  iOS Safari installs standalone web apps directly onto your home screen without the App Store:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-xs text-neutral-700 dark:text-neutral-300 bg-white/80 dark:bg-neutral-900/80 p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
                  <li>
                    Open this URL in <strong>Safari</strong> on your iPhone or iPad
                  </li>
                  <li>
                    Tap the <strong className="inline-flex items-center gap-1 text-neutral-900 dark:text-white"><Share className="w-3.5 h-3.5 text-sky-500" /> Share</strong> button in the bottom navigation toolbar
                  </li>
                  <li>
                    Scroll down and tap <strong className="inline-flex items-center gap-1 text-neutral-900 dark:text-white"><PlusSquare className="w-3.5 h-3.5 text-amber-500" /> Add to Home Screen</strong>
                  </li>
                  <li>
                    Tap <strong className="text-neutral-900 dark:text-white">Add</strong> in the top right corner
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* DEVELOPER CLI / BUILD APK TAB */}
          {activeTab === 'apk_tools' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Build Android APK Locally (CLI Tools)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Google Bubblewrap
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Google provides <strong>@bubblewrap/cli</strong> to generate an Android Studio project and compile a production <strong>.apk</strong> or <strong>.aab</strong> file directly from this app's manifest:
                </p>

                {/* Command 1: Bubblewrap */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    <span>Google Bubblewrap CLI Command:</span>
                    <button
                      onClick={() =>
                        handleCopyCli(
                          `npm install -g @bubblewrap/cli\nbubblewrap init --manifest="${currentUrl}/manifest.webmanifest"\nbubblewrap build`,
                          'bubblewrap'
                        )
                      }
                      className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      {copiedCli === 'bubblewrap' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCli === 'bubblewrap' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-[11px] overflow-x-auto">
                    {`# 1. Install Google's PWA to APK compiler
npm install -g @bubblewrap/cli

# 2. Generate Android Studio project
bubblewrap init --manifest="${currentUrl || 'YOUR_APP_URL'}"

# 3. Compile standalone Android APK
bubblewrap build`}
                  </pre>
                </div>

                {/* Command 2: Capacitor */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    <span>Alternative: Capacitor Android Native Wrapper:</span>
                    <button
                      onClick={() =>
                        handleCopyCli(
                          `npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init "Personal Productivity Suite" "com.productivity.suite"\nnpx cap add android\nnpx cap run android`,
                          'capacitor'
                        )
                      }
                      className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      {copiedCli === 'capacitor' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCli === 'capacitor' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-[11px] overflow-x-auto">
                    {`npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Personal Productivity Suite" "com.productivity.suite"
npx cap add android
npx cap run android`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* App Capabilities Checkmarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">Instant Native Launch</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
              <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">100% Offline Capable</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="truncate">Local Device Storage</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Link Copied!' : 'Copy App Link'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs hover:opacity-90 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
