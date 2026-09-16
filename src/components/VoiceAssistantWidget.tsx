import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Send,
  AlertTriangle,
  CheckCircle2,
  Square,
  RefreshCw,
} from 'lucide-react';
import { Task, StickyNote, VoiceAssistantAction } from '../types';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  stopSpeaking,
  parseVoiceCommand,
} from '../services/voiceAssistant';
import { AssistantAvatar } from './AssistantAvatar';

interface VoiceAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes?: StickyNote[];
  username: string;
  voiceMuted: boolean;
  onToggleMute: () => void;
  onExecuteAction: (action: VoiceAssistantAction) => void;
}

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  isOpen,
  onClose,
  tasks,
  notes = [],
  username,
  voiceMuted,
  onToggleMute,
  onExecuteAction,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string>(
    `Hi ${username}, I'm listening. How can I help you today?`
  );
  const [textInput, setTextInput] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<VoiceAssistantAction | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition on mount or when tasks/notes change
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setMicError(null);
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }
      if (final) {
        setTranscript(final);
        setInterimTranscript('');
        handleProcessCommand(final);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMicError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        setLastResponse('Microphone access was denied. You can type commands below or enable microphone permissions.');
      } else if (event.error === 'no-speech') {
        // user was quiet, gentle feedback
        setMicError('No speech detected. Tap microphone to try again.');
      } else {
        setMicError(`Recognition error (${event.error}). Try again or type below.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {
        // ignore
      }
    };
  }, [tasks, notes, pendingConfirmation]);

  // Handle closing modal
  const handleClose = () => {
    stopSpeaking();
    setIsSpeaking(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
    setIsListening(false);
    onClose();
  };

  const toggleListening = () => {
    setMicError(null);
    if (!isSpeechRecognitionSupported()) {
      setMicError('Speech recognition is not supported in this browser. Please type your command below.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    } else {
      stopSpeaking();
      setIsSpeaking(false);
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Error starting speech recognition:', e);
        setMicError('Could not start microphone. Please try again or type below.');
      }
    }
  };

  const speakAssistantResponse = (text: string) => {
    if (voiceMuted) {
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speakText(text, false, () => {
      setIsSpeaking(false);
    });
  };

  const handleProcessCommand = (commandText: string) => {
    const trimmed = commandText.trim().toLowerCase();

    // If confirmation is pending and user confirms by voice
    if (pendingConfirmation) {
      if (/^(yes|yeah|yep|sure|ok|okay|confirm|proceed|do it|delete|please do)$/i.test(trimmed)) {
        handleConfirmAction();
        return;
      }
      if (/^(no|nope|cancel|stop|abort|don't|dont|never mind)$/i.test(trimmed)) {
        handleCancelAction();
        return;
      }
    }

    const action = parseVoiceCommand(commandText, tasks, notes);

    if (action.requiresConfirmation) {
      setPendingConfirmation(action);
      setLastResponse(action.spokenResponse);
      speakAssistantResponse(action.spokenResponse);
      return;
    }

    // Execute immediately
    setPendingConfirmation(null);
    setLastResponse(action.spokenResponse);
    speakAssistantResponse(action.spokenResponse);
    onExecuteAction(action);
  };

  const handleConfirmAction = () => {
    if (!pendingConfirmation) return;
    onExecuteAction(pendingConfirmation);
    const confirmedMsg = 'Confirmed and deleted.';
    setLastResponse(confirmedMsg);
    speakAssistantResponse(confirmedMsg);
    setPendingConfirmation(null);
  };

  const handleCancelAction = () => {
    setPendingConfirmation(null);
    const cancelMsg = 'Cancelled. Nothing was deleted.';
    setLastResponse(cancelMsg);
    speakAssistantResponse(cancelMsg);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const command = textInput.trim();
    setTranscript(command);
    handleProcessCommand(command);
    setTextInput('');
  };

  if (!isOpen) return null;

  const avatarState = isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <AssistantAvatar state={avatarState} size="sm" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Ravora Voice Assistant
              </h3>
              <p className="text-[10px] text-neutral-400">Personal Productivity Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isSpeaking && (
              <button
                onClick={handleStopSpeaking}
                title="Stop speaking"
                className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            )}

            <button
              onClick={onToggleMute}
              title={voiceMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              {voiceMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            </button>

            <button
              onClick={handleClose}
              title="Close"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Assistant Avatar & Microphone Interaction */}
        <div className="py-5 flex flex-col items-center justify-center text-center space-y-3.5">
          <AssistantAvatar state={avatarState} size="lg" />

          {/* Large Mic Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={toggleListening}
              id="voice-widget-mic-trigger"
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white scale-105 ring-4 ring-rose-500/30'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:scale-105'
              }`}
            >
              {isListening ? (
                <Mic className="w-7 h-7 animate-pulse" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isListening
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : isSpeaking
                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Listening... Speak now</span>
                </>
              ) : isSpeaking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>Speaking response...</span>
                </>
              ) : (
                <span>Tap mic button to speak</span>
              )}
            </span>
          </div>

          {/* Microphone error / permission warning */}
          {micError && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 w-full text-left text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{micError}</span>
              </div>
            </div>
          )}

          {/* Real-time recognized speech preview */}
          {(interimTranscript || transcript) && (
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/70 w-full text-xs text-neutral-700 dark:text-neutral-300 text-left">
              <span className="text-[10px] font-semibold text-neutral-400 block mb-0.5 uppercase tracking-wider">
                Recognized Speech:
              </span>
              <p className="font-medium italic">
                “{interimTranscript || transcript}”
              </p>
            </div>
          )}

          {/* Assistant's Response Message */}
          <div className="p-4 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 w-full text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Assistant Response</span>
            </div>
            <p className="text-xs font-medium text-neutral-900 dark:text-white leading-relaxed">
              {lastResponse}
            </p>
          </div>

          {/* Destructive Action Confirmation Card */}
          {pendingConfirmation && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 w-full text-left space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Confirmation Required</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {pendingConfirmation.confirmationPrompt || 'Are you sure you want to proceed?'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={handleCancelAction}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <span className="text-[10px] text-neutral-400 ml-auto hidden sm:inline">
                  Or say "Yes" / "Cancel"
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Commands */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Try Saying or Clicking:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Do I have any tasks left?',
              'what is time right now how many task left',
              'When is Diwali?',
              'Upcoming festivals',
              'What are my tasks today?',
              'What’s my next task?',
              'Add study React at 7 PM',
              'Show my calendar',
              'Mark this task complete',
              'Add a sticky note Buy groceries',
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setTranscript(cmd);
                  handleProcessCommand(cmd);
                }}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer truncate max-w-full text-left"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Text fallback input */}
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type voice command or question..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 disabled:opacity-40 hover:bg-neutral-800 transition cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
