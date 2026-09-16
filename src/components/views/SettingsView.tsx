import React, { useRef } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  LogOut,
  Sparkles,
  Mic,
  MicOff,
} from 'lucide-react';
import { UserSettings, ThemeMode, Priority } from '../../types';
import { playCompleteSound } from '../../services/sound';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onExportData: () => void;
  onImportData: (jsonString: string) => void;
  onClearCompletedTasks: () => void;
  onClearAllData: () => void;
  onResetDemoData: () => void;
  onRequestNotifications: () => void;
  onTestVoiceGreeting: () => void;
  username: string;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onClearCompletedTasks,
  onClearAllData,
  onResetDemoData,
  onRequestNotifications,
  onTestVoiceGreeting,
  username,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Profile & Name */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Personal Profile
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Your display name used in personalized voice briefings, daily greetings, and workspace headers
          </p>
        </div>

        <div className="max-w-xs">
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            value={settings.name || 'Ravora'}
            onChange={(e) => onUpdateSettings({ ...settings, name: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
            placeholder="Ravora"
          />
        </div>
      </div>

      {/* Theme & Appearance */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Appearance & Theme
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select your preferred display theme for the workspace
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = settings.theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onUpdateSettings({ ...settings, theme: item.id as ThemeMode })}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                  isSelected
                    ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Voice Productivity Assistant */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Interactive Voice Assistant
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Personal voice greeting on startup, daily task briefing, and hands-free voice command execution
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                ...settings,
                voiceAssistantEnabled: !settings.voiceAssistantEnabled,
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              settings.voiceAssistantEnabled
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
            }`}
          >
            {settings.voiceAssistantEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {settings.voiceAssistantEnabled && (
          <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            {/* Audio Mute toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white block">
                  Voice Speech Readout
                </span>
                <span className="text-neutral-400 text-[11px]">
                  Speak daily briefings and command feedback out loud
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    voiceMuted: !settings.voiceMuted,
                  })
                }
                className={`p-2 rounded-xl transition cursor-pointer ${
                  !settings.voiceMuted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                }`}
              >
                {!settings.voiceMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Auto-greet on launch toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white block">
                  Auto-Greet on Open
                </span>
                <span className="text-neutral-400 text-[11px]">
                  Automatically display Ravora's morning/afternoon briefing when opening the workspace
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    autoGreetOnOpen: !settings.autoGreetOnOpen,
                  })
                }
                className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
                  settings.autoGreetOnOpen
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                }`}
              >
                {settings.autoGreetOnOpen ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Test Voice Greeting */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-neutral-400 text-[11px]">
                Preview the interactive morning/evening greeting briefing
              </span>
              <button
                type="button"
                onClick={onTestVoiceGreeting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Voice Greeting</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audio & Feedback */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Sound Effects
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Harmonious chime synthesis upon checking off tasks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => playCompleteSound(true)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
            >
              Test Chime
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
              className={`p-2 rounded-xl transition cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Reminders & Notifications */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Browser Reminders
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Receive notifications for scheduled tasks and upcoming deadlines
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestNotifications}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              settings.notificationsEnabled
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {settings.notificationsEnabled ? (
              <>
                <BellRing className="w-4 h-4" />
                <span>Enabled</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Enable Alerts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Task Defaults */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Default Task Preferences
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Default priority and category applied during quick adds
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              Default Priority
            </label>
            <select
              value={settings.defaultPriority}
              onChange={(e) => onUpdateSettings({ ...settings, defaultPriority: e.target.value as Priority })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              Default Category
            </label>
            <input
              type="text"
              value={settings.defaultCategory}
              onChange={(e) => onUpdateSettings({ ...settings, defaultCategory: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Data Management: Export, Import, Reset */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Data Storage & Backup
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Your tasks and notes are stored locally in your browser (<code className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">localStorage</code>)
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onExportData}
            id="export-data-btn"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            id="import-data-btn"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all completed tasks? This cannot be undone.')) {
                onClearCompletedTasks();
              }
            }}
            id="clear-completed-btn"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Completed Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset workspace to neutral state with zero tasks and zero notes?')) {
                onClearAllData();
              }
            }}
            id="clear-all-zero-btn"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Neutral Slate (Zero Tasks)</span>
          </button>
        </div>
      </div>

      {/* Security & Account */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Workspace Security</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Signed in as <strong className="text-neutral-700 dark:text-neutral-200 font-semibold">{username}</strong>. Credentials verified securely via <code className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 rounded">.env</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            id="settings-logout-btn"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
