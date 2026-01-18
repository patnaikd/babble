/**
 * Speech Store - Text-to-speech playback state management.
 *
 * This store manages all state related to speech synthesis including:
 * - Playback state (playing, paused)
 * - Voice and rate settings for current session
 * - Word tracking for text highlighting
 * - Plain text content being spoken
 *
 * This store does NOT persist to storage - it represents ephemeral playback state.
 * For persistent speech preferences, see settingsStore.
 *
 * @module stores/speechStore
 */

import { create } from 'zustand';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SpeechStore');

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents the position and content of a single word in the text.
 * Used for word-by-word highlighting during speech playback.
 */
export interface WordPosition {
  /** Character index where the word starts (0-based) */
  start: number;
  /** Character index where the word ends (exclusive) */
  end: number;
  /** The actual word text */
  word: string;
}

/**
 * Complete speech state interface including all values and actions.
 */
interface SpeechState {
  // -------------------------------------------------------------------------
  // Playback State
  // -------------------------------------------------------------------------

  /** Whether speech is currently playing (true even when paused until stopped) */
  isPlaying: boolean;
  /** Whether speech is currently paused */
  isPaused: boolean;

  // -------------------------------------------------------------------------
  // Voice Settings (Session-specific, not persisted)
  // -------------------------------------------------------------------------

  /** URI of the currently selected voice, null for system default */
  selectedVoiceURI: string | null;
  /** Current speech rate (0.5 - 2.0, where 1.0 is normal) */
  rate: number;

  // -------------------------------------------------------------------------
  // Word Tracking
  // -------------------------------------------------------------------------

  /** Current character index being spoken (for position tracking) */
  currentCharIndex: number;
  /** Current word index being spoken (-1 when not speaking) */
  currentWordIndex: number;
  /** Array of all word positions in the current text */
  wordPositions: WordPosition[];

  // -------------------------------------------------------------------------
  // Text Data
  // -------------------------------------------------------------------------

  /** Plain text content being spoken (extracted from HTML) */
  plainText: string;
  /** Character position to start speech from (for resume functionality) */
  startFromPosition: number;
  /** HTML content from the TipTap editor (source of plainText) */
  editorContent: string;

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /** Sets the playing state */
  setPlaying: (playing: boolean) => void;
  /** Sets the paused state */
  setPaused: (paused: boolean) => void;
  /** Sets the selected voice URI */
  setVoice: (voiceURI: string) => void;
  /** Sets the speech rate */
  setRate: (rate: number) => void;
  /** Updates both character index and word index for current position */
  setCurrentWord: (charIndex: number, wordIndex: number) => void;
  /** Sets the array of word positions for the current text */
  setWordPositions: (positions: WordPosition[]) => void;
  /** Sets the plain text content */
  setPlainText: (text: string) => void;
  /** Sets the starting position for speech */
  setStartPosition: (position: number) => void;
  /** Sets the HTML content from the editor */
  setEditorContent: (content: string) => void;
  /** Resets playback state (not settings) to initial values */
  reset: () => void;
}

// ============================================================================
// Store Definition
// ============================================================================

/**
 * Speech store hook for managing text-to-speech playback state.
 *
 * @example
 * ```typescript
 * import { useSpeechStore } from '@/stores';
 *
 * function SpeechControls() {
 *   const { isPlaying, isPaused, currentWordIndex, setPlaying, reset } = useSpeechStore();
 *
 *   const handleStop = () => {
 *     speechService.cancel();
 *     reset();
 *   };
 *
 *   return (
 *     <div>
 *       <span>Status: {isPaused ? 'Paused' : isPlaying ? 'Playing' : 'Stopped'}</span>
 *       <button onClick={handleStop}>Stop</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Accessing state outside of React components
 * const { currentCharIndex, wordPositions } = useSpeechStore.getState();
 * const currentWord = wordPositions[useSpeechStore.getState().currentWordIndex];
 * ```
 */
export const useSpeechStore = create<SpeechState>((set) => ({
  // Initial values - Playback
  isPlaying: false,
  isPaused: false,

  // Initial values - Voice Settings
  selectedVoiceURI: null,
  rate: 1,

  // Initial values - Word Tracking
  currentCharIndex: 0,
  currentWordIndex: -1,
  wordPositions: [],

  // Initial values - Text Data
  plainText: '',
  startFromPosition: 0,
  editorContent: '',

  // Actions
  setPlaying: (playing) => {
    logger.debug('Playing state changed', { playing });
    set({ isPlaying: playing });
  },

  setPaused: (paused) => {
    logger.debug('Paused state changed', { paused });
    set({ isPaused: paused });
  },

  setVoice: (voiceURI) => {
    logger.info('Voice changed', { voiceURI });
    set({ selectedVoiceURI: voiceURI });
  },

  setRate: (rate) => {
    logger.debug('Rate changed', { rate });
    set({ rate });
  },

  setCurrentWord: (charIndex, wordIndex) => {
    // Debug level since this fires frequently during playback
    logger.debug('Current word updated', { charIndex, wordIndex });
    set({ currentCharIndex: charIndex, currentWordIndex: wordIndex });
  },

  setWordPositions: (positions) => {
    logger.debug('Word positions set', { count: positions.length });
    set({ wordPositions: positions });
  },

  setPlainText: (text) => {
    logger.debug('Plain text set', { length: text.length });
    set({ plainText: text });
  },

  setStartPosition: (position) => {
    logger.debug('Start position set', { position });
    set({ startFromPosition: position });
  },

  setEditorContent: (content) => {
    logger.debug('Editor content updated', { length: content.length });
    set({ editorContent: content });
  },

  reset: () => {
    logger.info('Speech state reset');
    set({
      isPlaying: false,
      isPaused: false,
      currentCharIndex: 0,
      currentWordIndex: -1,
    });
  },
}));
