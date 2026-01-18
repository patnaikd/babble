import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

type FontFamily = 'OpenDyslexic' | 'Arial' | 'Lexend' | 'system';
type LetterSpacing = 'normal' | 'wide' | 'extra-wide';
type Theme = 'light' | 'dark' | 'high-contrast';

interface SettingsState {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: LetterSpacing;
  theme: Theme;
  backgroundColor: string;
  defaultVoiceURI: string | null;
  defaultRate: number;
  leftSidebarOpen: boolean;
  rightPanelOpen: boolean;

  setFontFamily: (family: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: LetterSpacing) => void;
  setTheme: (theme: Theme) => void;
  setBackgroundColor: (color: string) => void;
  setDefaultVoice: (voiceURI: string | null) => void;
  setDefaultRate: (rate: number) => void;
  toggleLeftSidebar: () => void;
  toggleRightPanel: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
}

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontFamily: 'system',
      fontSize: 18,
      lineHeight: 1.5,
      letterSpacing: 'normal',
      theme: 'light',
      backgroundColor: '#ffffff',
      defaultVoiceURI: null,
      defaultRate: 1,
      leftSidebarOpen: true,
      rightPanelOpen: false,

      setFontFamily: (family) => set({ fontFamily: family }),
      setFontSize: (size) => set({ fontSize: size }),
      setLineHeight: (height) => set({ lineHeight: height }),
      setLetterSpacing: (spacing) => set({ letterSpacing: spacing }),
      setTheme: (theme) => set({ theme }),
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      setDefaultVoice: (voiceURI) => set({ defaultVoiceURI: voiceURI }),
      setDefaultRate: (rate) => set({ defaultRate: rate }),
      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
      setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
    }),
    {
      name: 'babble-settings',
      storage: createJSONStorage(() => storage),
    }
  )
);
