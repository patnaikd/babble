/**
 * useSpeechSynthesis Hook - Text-to-speech playback control.
 *
 * This hook provides a high-level interface for speech playback including:
 * - Play, pause, and stop controls
 * - Voice and rate selection with live updates
 * - Word-level tracking for text highlighting
 * - Integration with document position tracking
 *
 * The hook bridges the speechService with React state management,
 * coordinating between the speech store, settings store, and document store.
 *
 * @module hooks/useSpeechSynthesis
 *
 * @example
 * ```typescript
 * import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
 *
 * function SpeechControls() {
 *   const {
 *     voices,
 *     isPlaying,
 *     isPaused,
 *     isSupported,
 *     play,
 *     pause,
 *     stop,
 *     changeRate,
 *     changeVoice,
 *   } = useSpeechSynthesis();
 *
 *   if (!isSupported) {
 *     return <div>Speech synthesis not supported</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={isPlaying ? pause : play}>
 *         {isPlaying ? 'Pause' : 'Play'}
 *       </button>
 *       <button onClick={stop}>Stop</button>
 *       <select onChange={(e) => changeVoice(e.target.value)}>
 *         {voices.map(voice => (
 *           <option key={voice.voiceURI} value={voice.voiceURI}>
 *             {voice.name}
 *           </option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { speechService, SpeechError } from '@/services/speechService';
import { useSpeechStore, useDocumentStore, useSettingsStore, useUIStore } from '@/stores';
import { buildWordMap, findWordAtPosition, extractPlainText } from '@/utils/textParser';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useSpeechSynthesis');

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for controlling text-to-speech playback.
 *
 * @returns Object containing speech state and control functions
 */
export function useSpeechSynthesis() {
  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  /** Available speech synthesis voices */
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  const {
    isPlaying,
    isPaused,
    selectedVoiceURI,
    rate,
    startFromPosition,
    editorContent,
    setPlaying,
    setPaused,
    setCurrentWord,
    setWordPositions,
    setPlainText,
    reset,
  } = useSpeechStore();

  const { updateLastReadPosition } = useDocumentStore();
  const { defaultVoiceURI, defaultRate } = useSettingsStore();
  const { addToast } = useUIStore();

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Loads available voices when the component mounts.
   * Waits for voices to be available (some browsers load them async).
   */
  useEffect(() => {
    logger.debug('Waiting for voices to load');
    speechService.waitForVoices().then((loadedVoices) => {
      logger.info('Voices loaded', { count: loadedVoices.length });
      setVoices(loadedVoices);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /**
   * Handles speech errors by resetting state and showing a toast.
   */
  const handleError = useCallback(
    (error: SpeechError) => {
      logger.error('Speech error occurred', { type: error.type, message: error.message });
      reset();
      addToast({
        title: 'Speech Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    [reset, addToast]
  );

  /**
   * Starts or resumes speech playback.
   *
   * If paused, resumes from the current position.
   * If stopped, extracts text from editor content and starts fresh.
   */
  const play = useCallback(() => {
    // Resume if paused
    if (isPaused) {
      logger.info('Resuming speech');
      speechService.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    // Extract plain text from editor content
    const plainText = extractPlainText(editorContent || '').trim();

    if (!plainText) {
      logger.warn('Attempted to play with no content');
      addToast({
        title: 'No content',
        description: 'Please add some text to read.',
        variant: 'destructive',
      });
      return;
    }

    // Build word position map for highlighting
    const wordPositions = buildWordMap(plainText);

    logger.info('Starting speech playback', {
      textLength: plainText.length,
      wordCount: wordPositions.length,
      startPosition: startFromPosition,
    });

    setPlainText(plainText);
    setWordPositions(wordPositions);
    setPlaying(true);
    setPaused(false);

    // Determine voice and rate to use
    const voiceToUse = selectedVoiceURI || defaultVoiceURI;
    const rateToUse = rate || defaultRate;

    speechService.speak(plainText, {
      voiceURI: voiceToUse,
      rate: rateToUse,
      startPosition: startFromPosition,
      onBoundary: (charIndex, _charLength) => {
        const wordIndex = findWordAtPosition(charIndex, wordPositions);
        setCurrentWord(charIndex, wordIndex);
        updateLastReadPosition(charIndex);
      },
      onEnd: () => {
        logger.info('Speech playback completed');
        reset();
        updateLastReadPosition(0);
      },
      onError: handleError,
    });
  }, [
    editorContent,
    isPaused,
    selectedVoiceURI,
    defaultVoiceURI,
    rate,
    defaultRate,
    startFromPosition,
    setPlainText,
    setWordPositions,
    setPlaying,
    setPaused,
    setCurrentWord,
    updateLastReadPosition,
    reset,
    handleError,
    addToast,
  ]);

  /**
   * Pauses speech playback.
   * Can be resumed with play().
   */
  const pause = useCallback(() => {
    logger.info('Pausing speech');
    speechService.pause();
    setPaused(true);
    setPlaying(false);
  }, [setPaused, setPlaying]);

  /**
   * Stops speech playback completely.
   * Resets all playback state.
   */
  const stop = useCallback(() => {
    logger.info('Stopping speech');
    speechService.cancel();
    reset();
  }, [reset]);

  /**
   * Restarts speech from the current position with new options.
   * Used when changing voice or rate during playback.
   *
   * @param options - New voice or rate to apply
   */
  const restartFromCurrentPosition = useCallback(
    (options: { voiceURI?: string; rate?: number } = {}) => {
      // Only restart if currently playing (not paused)
      if (!isPlaying || isPaused) return;

      const currentState = useSpeechStore.getState();
      const { currentCharIndex, plainText, wordPositions, rate: currentRate } = currentState;

      if (!plainText) return;

      logger.debug('Restarting speech from current position', {
        charIndex: currentCharIndex,
        newVoice: options.voiceURI,
        newRate: options.rate,
      });

      // Cancel current speech
      speechService.cancel();

      const voiceToUse = options.voiceURI ?? selectedVoiceURI ?? defaultVoiceURI;
      const rateToUse = options.rate ?? currentRate ?? defaultRate;

      // Restart from current position
      speechService.speak(plainText, {
        voiceURI: voiceToUse,
        rate: rateToUse,
        startPosition: currentCharIndex,
        onBoundary: (charIndex, _charLength) => {
          const wordIndex = findWordAtPosition(charIndex, wordPositions);
          setCurrentWord(charIndex, wordIndex);
          updateLastReadPosition(charIndex);
        },
        onEnd: () => {
          logger.info('Speech playback completed');
          reset();
          updateLastReadPosition(0);
        },
        onError: handleError,
      });
    },
    [
      isPlaying,
      isPaused,
      selectedVoiceURI,
      defaultVoiceURI,
      defaultRate,
      setCurrentWord,
      updateLastReadPosition,
      reset,
      handleError,
    ]
  );

  /**
   * Changes the speech rate, restarting if currently playing.
   *
   * @param newRate - The new speech rate (0.5 - 2.0)
   */
  const changeRate = useCallback(
    (newRate: number) => {
      logger.info('Changing speech rate', { newRate });
      restartFromCurrentPosition({ rate: newRate });
    },
    [restartFromCurrentPosition]
  );

  /**
   * Changes the voice, restarting if currently playing.
   *
   * @param newVoiceURI - The URI of the new voice
   */
  const changeVoice = useCallback(
    (newVoiceURI: string) => {
      logger.info('Changing voice', { newVoiceURI });
      restartFromCurrentPosition({ voiceURI: newVoiceURI });
    },
    [restartFromCurrentPosition]
  );

  // ---------------------------------------------------------------------------
  // Return Value
  // ---------------------------------------------------------------------------

  /** Whether speech synthesis is supported in this browser */
  const isSupported = speechService.isSupported();

  return {
    /** Available speech synthesis voices */
    voices,
    /** Whether speech is currently playing */
    isPlaying,
    /** Whether speech is currently paused */
    isPaused,
    /** Whether speech synthesis is supported */
    isSupported,
    /** Starts or resumes speech playback */
    play,
    /** Pauses speech playback */
    pause,
    /** Stops speech playback */
    stop,
    /** Changes the speech rate */
    changeRate,
    /** Changes the voice */
    changeVoice,
  };
}
