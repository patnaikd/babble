import { create } from 'zustand';

export interface WordPosition {
  start: number;
  end: number;
  word: string;
}

interface SpeechState {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;

  // Voice settings
  selectedVoiceURI: string | null;
  rate: number;

  // Word tracking
  currentCharIndex: number;
  currentWordIndex: number;
  wordPositions: WordPosition[];

  // Text data
  plainText: string;
  startFromPosition: number;

  // Actions
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  setVoice: (voiceURI: string) => void;
  setRate: (rate: number) => void;
  setCurrentWord: (charIndex: number, wordIndex: number) => void;
  setWordPositions: (positions: WordPosition[]) => void;
  setPlainText: (text: string) => void;
  setStartPosition: (position: number) => void;
  reset: () => void;
}

export const useSpeechStore = create<SpeechState>((set) => ({
  isPlaying: false,
  isPaused: false,
  selectedVoiceURI: null,
  rate: 1,
  currentCharIndex: 0,
  currentWordIndex: -1,
  wordPositions: [],
  plainText: '',
  startFromPosition: 0,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
  setVoice: (voiceURI) => set({ selectedVoiceURI: voiceURI }),
  setRate: (rate) => set({ rate }),
  setCurrentWord: (charIndex, wordIndex) => set({ currentCharIndex: charIndex, currentWordIndex: wordIndex }),
  setWordPositions: (positions) => set({ wordPositions: positions }),
  setPlainText: (text) => set({ plainText: text }),
  setStartPosition: (position) => set({ startFromPosition: position }),
  reset: () => set({
    isPlaying: false,
    isPaused: false,
    currentCharIndex: 0,
    currentWordIndex: -1,
  }),
}));
