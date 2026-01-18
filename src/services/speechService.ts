export type SpeechErrorType =
  | 'UNSUPPORTED'
  | 'NO_VOICES'
  | 'CANCELLED'
  | 'INTERRUPTED'
  | 'AUDIO_BUSY'
  | 'NETWORK'
  | 'NOT_ALLOWED'
  | 'UNKNOWN';

export class SpeechError extends Error {
  type: SpeechErrorType;

  constructor(type: SpeechErrorType, message: string) {
    super(message);
    this.type = type;
    this.name = 'SpeechError';
  }
}

class SpeechService {
  private synthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;

    const loadVoiceList = () => {
      this.voices = this.synthesis!.getVoices();
      this.voicesLoaded = this.voices.length > 0;
    };

    loadVoiceList();

    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoiceList;
    }
  }

  isSupported(): boolean {
    return this.synthesis !== null;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  async waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    if (this.voicesLoaded) return this.voices;

    return new Promise((resolve) => {
      const checkVoices = () => {
        if (this.voices.length > 0) {
          resolve(this.voices);
        } else {
          setTimeout(checkVoices, 100);
        }
      };
      checkVoices();
    });
  }

  speak(text: string, options: {
    voiceURI?: string | null;
    rate?: number;
    startPosition?: number;
    onBoundary?: (charIndex: number, charLength: number) => void;
    onEnd?: () => void;
    onError?: (error: SpeechError) => void;
  } = {}): void {
    if (!this.synthesis) {
      options.onError?.(new SpeechError('UNSUPPORTED', 'Speech synthesis is not supported in this browser'));
      return;
    }

    this.cancel();

    // Handle start position - slice text from that position
    const textToSpeak = options.startPosition ? text.slice(options.startPosition) : text;
    const offsetAdjustment = options.startPosition || 0;

    this.utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Set voice
    if (options.voiceURI) {
      const voice = this.voices.find(v => v.voiceURI === options.voiceURI);
      if (voice) {
        this.utterance.voice = voice;
      }
    }

    // Set rate
    this.utterance.rate = options.rate ?? 1;

    // Handle boundary events for word tracking
    this.utterance.onboundary = (event) => {
      console.log('[SpeechService] Boundary event:', event.name, 'charIndex:', event.charIndex, 'charLength:', event.charLength);
      if (event.name === 'word') {
        options.onBoundary?.(event.charIndex + offsetAdjustment, event.charLength);
      }
    };

    this.utterance.onend = () => {
      options.onEnd?.();
    };

    this.utterance.onerror = (event) => {
      // Ignore canceled/interrupted errors - these are expected when user stops playback
      if (event.error === 'canceled' || event.error === 'interrupted') {
        return;
      }

      const errorMap: Record<string, SpeechErrorType> = {
        'audio-busy': 'AUDIO_BUSY',
        'network': 'NETWORK',
        'not-allowed': 'NOT_ALLOWED',
      };

      const errorType = errorMap[event.error] || 'UNKNOWN';
      options.onError?.(new SpeechError(errorType, `Speech error: ${event.error}`));
    };

    this.synthesis.speak(this.utterance);
  }

  pause(): void {
    this.synthesis?.pause();
  }

  resume(): void {
    this.synthesis?.resume();
  }

  cancel(): void {
    this.synthesis?.cancel();
    this.utterance = null;
  }

  isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }
}

export const speechService = new SpeechService();
