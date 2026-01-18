import { useCallback, useEffect, useState } from 'react';
import { speechService, SpeechError } from '@/services/speechService';
import { useSpeechStore, useDocumentStore, useSettingsStore, useUIStore } from '@/stores';
import { buildWordMap, findWordAtPosition, extractPlainText } from '@/utils/textParser';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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

  // Load voices
  useEffect(() => {
    speechService.waitForVoices().then(setVoices);
  }, []);

  const handleError = useCallback((error: SpeechError) => {
    reset();
    addToast({
      title: 'Speech Error',
      description: error.message,
      variant: 'destructive',
    });
  }, [reset, addToast]);

  const play = useCallback(() => {
    if (isPaused) {
      speechService.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    const plainText = extractPlainText(editorContent || '').trim();

    if (!plainText) {
      addToast({
        title: 'No content',
        description: 'Please add some text to read.',
        variant: 'destructive',
      });
      return;
    }

    const wordPositions = buildWordMap(plainText);

    setPlainText(plainText);
    setWordPositions(wordPositions);
    setPlaying(true);
    setPaused(false);

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

  const pause = useCallback(() => {
    speechService.pause();
    setPaused(true);
    setPlaying(false);
  }, [setPaused, setPlaying]);

  const stop = useCallback(() => {
    speechService.cancel();
    reset();
  }, [reset]);

  const isSupported = speechService.isSupported();

  return {
    voices,
    isPlaying,
    isPaused,
    isSupported,
    play,
    pause,
    stop,
  };
}
