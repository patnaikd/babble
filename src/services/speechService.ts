/**
 * Speech Service - Web Speech API wrapper for text-to-speech functionality.
 *
 * This service provides a clean abstraction over the browser's Web Speech API,
 * handling voice loading, speech synthesis, and error management.
 *
 * Features:
 * - Async voice loading with polling fallback
 * - Word-level boundary tracking for text highlighting
 * - Structured error handling with typed errors
 * - Support for starting speech from arbitrary positions
 *
 * @module services/speechService
 *
 * @example
 * ```typescript
 * import { speechService, SpeechError } from '@/services/speechService';
 *
 * // Wait for voices to be available
 * const voices = await speechService.waitForVoices();
 *
 * // Start speaking with word tracking
 * speechService.speak('Hello, world!', {
 *   voiceURI: voices[0].voiceURI,
 *   rate: 1.2,
 *   onBoundary: (charIndex) => highlightWordAt(charIndex),
 *   onEnd: () => console.log('Speech finished'),
 *   onError: (error) => console.error(error.type, error.message),
 * });
 * ```
 */

import { createLogger } from '@/utils/logger';

const logger = createLogger('SpeechService');

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Enumeration of possible speech synthesis error types.
 * Used for structured error handling and user-friendly error messages.
 */
export type SpeechErrorType =
  /** Browser does not support Web Speech API */
  | 'UNSUPPORTED'
  /** No voices available for synthesis */
  | 'NO_VOICES'
  /** Speech was cancelled by user action */
  | 'CANCELLED'
  /** Speech was interrupted by another utterance */
  | 'INTERRUPTED'
  /** Audio output device is busy */
  | 'AUDIO_BUSY'
  /** Network error (for cloud-based voices) */
  | 'NETWORK'
  /** Permission denied for speech synthesis */
  | 'NOT_ALLOWED'
  /** Unknown or unhandled error */
  | 'UNKNOWN';

/**
 * Custom error class for speech synthesis errors.
 * Provides typed error codes for programmatic handling.
 */
export class SpeechError extends Error {
  /** The type of speech error that occurred */
  type: SpeechErrorType;

  /**
   * Creates a new SpeechError instance.
   *
   * @param type - The categorized error type
   * @param message - Human-readable error description
   */
  constructor(type: SpeechErrorType, message: string) {
    super(message);
    this.type = type;
    this.name = 'SpeechError';
  }
}

/**
 * Options for the speak method.
 */
interface SpeakOptions {
  /** URI of the voice to use (from SpeechSynthesisVoice.voiceURI) */
  voiceURI?: string | null;
  /** Speech rate (0.5 - 2.0, where 1.0 is normal) */
  rate?: number;
  /** Character position to start speaking from */
  startPosition?: number;
  /** Callback fired when a word boundary is reached */
  onBoundary?: (charIndex: number, charLength: number) => void;
  /** Callback fired when speech completes */
  onEnd?: () => void;
  /** Callback fired when an error occurs */
  onError?: (error: SpeechError) => void;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Speech synthesis service class.
 * Wraps the Web Speech API with async voice loading, error handling,
 * and word-level tracking for text highlighting.
 */
class SpeechService {
  /** Reference to the browser's SpeechSynthesis instance */
  private synthesis: SpeechSynthesis | null = null;
  /** Current utterance being spoken */
  private utterance: SpeechSynthesisUtterance | null = null;
  /** Cached list of available voices */
  private voices: SpeechSynthesisVoice[] = [];
  /** Whether voices have been successfully loaded */
  private voicesLoaded = false;

  /**
   * Creates a new SpeechService instance.
   * Automatically initializes the synthesis engine and begins loading voices.
   */
  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      logger.info('Speech synthesis supported, initializing');
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    } else {
      logger.warn('Speech synthesis not supported in this browser');
    }
  }

  /**
   * Loads available voices from the synthesis engine.
   * Sets up a listener for voice changes (some browsers load voices async).
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    const loadVoiceList = () => {
      this.voices = this.synthesis!.getVoices();
      this.voicesLoaded = this.voices.length > 0;
      if (this.voicesLoaded) {
        logger.info('Voices loaded', { count: this.voices.length });
      }
    };

    loadVoiceList();

    // Some browsers (Chrome) load voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoiceList;
    }
  }

  /**
   * Checks if speech synthesis is supported in the current browser.
   *
   * @returns true if speech synthesis is available
   */
  isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * Gets the list of available voices.
   * May be empty if voices haven't loaded yet - use waitForVoices() for async.
   *
   * @returns Array of available SpeechSynthesisVoice objects
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Waits for voices to be available and returns them.
   * Polls every 100ms until voices are loaded.
   *
   * @returns Promise resolving to array of available voices
   *
   * @example
   * ```typescript
   * const voices = await speechService.waitForVoices();
   * const englishVoices = voices.filter(v => v.lang.startsWith('en'));
   * ```
   */
  async waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    if (this.voicesLoaded) {
      logger.debug('Voices already loaded, returning immediately');
      return this.voices;
    }

    logger.debug('Waiting for voices to load');
    return new Promise((resolve) => {
      const checkVoices = () => {
        if (this.voices.length > 0) {
          logger.debug('Voices now available');
          resolve(this.voices);
        } else {
          setTimeout(checkVoices, 100);
        }
      };
      checkVoices();
    });
  }

  /**
   * Starts speaking the provided text with the given options.
   *
   * @param text - The text to speak
   * @param options - Configuration options for speech
   *
   * @example
   * ```typescript
   * speechService.speak('Hello, world!', {
   *   voiceURI: 'Google US English',
   *   rate: 1.0,
   *   onBoundary: (charIndex) => {
   *     // Highlight word at position
   *   },
   *   onEnd: () => {
   *     // Clean up highlighting
   *   },
   * });
   * ```
   */
  speak(text: string, options: SpeakOptions = {}): void {
    if (!this.synthesis) {
      logger.error('Speech synthesis not supported');
      options.onError?.(
        new SpeechError('UNSUPPORTED', 'Speech synthesis is not supported in this browser')
      );
      return;
    }

    // Cancel any current speech
    this.cancel();

    // Handle start position - slice text from that position
    const textToSpeak = options.startPosition ? text.slice(options.startPosition) : text;
    const offsetAdjustment = options.startPosition || 0;

    logger.info('Starting speech', {
      textLength: text.length,
      startPosition: options.startPosition || 0,
      rate: options.rate || 1,
      voiceURI: options.voiceURI || 'default',
    });

    this.utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Set voice if specified
    if (options.voiceURI) {
      const voice = this.voices.find((v) => v.voiceURI === options.voiceURI);
      if (voice) {
        this.utterance.voice = voice;
        logger.debug('Voice set', { name: voice.name, lang: voice.lang });
      } else {
        logger.warn('Requested voice not found', { voiceURI: options.voiceURI });
      }
    }

    // Set rate
    this.utterance.rate = options.rate ?? 1;

    // Handle boundary events for word tracking
    this.utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const adjustedIndex = event.charIndex + offsetAdjustment;
        logger.debug('Word boundary', {
          charIndex: adjustedIndex,
          charLength: event.charLength,
        });
        options.onBoundary?.(adjustedIndex, event.charLength);
      }
    };

    this.utterance.onend = () => {
      logger.info('Speech completed');
      options.onEnd?.();
    };

    this.utterance.onerror = (event) => {
      // Ignore canceled/interrupted errors - these are expected when user stops playback
      if (event.error === 'canceled' || event.error === 'interrupted') {
        logger.debug('Speech cancelled or interrupted (expected)');
        return;
      }

      const errorMap: Record<string, SpeechErrorType> = {
        'audio-busy': 'AUDIO_BUSY',
        network: 'NETWORK',
        'not-allowed': 'NOT_ALLOWED',
      };

      const errorType = errorMap[event.error] || 'UNKNOWN';
      logger.error('Speech error', { errorType, originalError: event.error });
      options.onError?.(new SpeechError(errorType, `Speech error: ${event.error}`));
    };

    this.synthesis.speak(this.utterance);
  }

  /**
   * Pauses the current speech.
   * Can be resumed with resume().
   */
  pause(): void {
    logger.debug('Pausing speech');
    this.synthesis?.pause();
  }

  /**
   * Resumes paused speech.
   */
  resume(): void {
    logger.debug('Resuming speech');
    this.synthesis?.resume();
  }

  /**
   * Cancels any current speech immediately.
   * Clears the utterance queue.
   */
  cancel(): void {
    logger.debug('Cancelling speech');
    this.synthesis?.cancel();
    this.utterance = null;
  }

  /**
   * Checks if speech is currently paused.
   *
   * @returns true if speech is paused
   */
  isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }

  /**
   * Checks if speech is currently being synthesized.
   *
   * @returns true if speech is in progress
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton instance of the speech service.
 * Use this instance throughout the application.
 */
export const speechService = new SpeechService();
