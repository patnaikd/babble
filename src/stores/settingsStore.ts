/**
 * Settings Store - Persistent user preferences and application configuration.
 *
 * This store manages all user-configurable settings including:
 * - Typography settings (font family, size, line height, letter spacing)
 * - Visual theme preferences (light, dark, high-contrast)
 * - Speech synthesis defaults (voice, rate)
 * - UI panel visibility states
 * - Session persistence (last opened document)
 *
 * Settings are automatically persisted to IndexedDB using zustand's persist middleware
 * with idb-keyval as the storage adapter, ensuring settings survive browser sessions.
 *
 * @module stores/settingsStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SettingsStore');

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Available font families optimized for readability.
 * - OpenDyslexic: Specially designed font for users with dyslexia
 * - Arial: Clean sans-serif, widely available
 * - Lexend: Font designed to reduce visual stress and improve reading
 * - system: Uses the system default font stack
 */
export type FontFamily = 'OpenDyslexic' | 'Arial' | 'Lexend' | 'system';

/**
 * Letter spacing options for improved text readability.
 * - normal: Standard letter spacing
 * - wide: Increased spacing for easier letter distinction
 * - extra-wide: Maximum spacing for accessibility needs
 */
export type LetterSpacing = 'normal' | 'wide' | 'extra-wide';

/**
 * Available color themes for the application.
 * - light: Light background with dark text (default)
 * - dark: Dark background with light text
 * - high-contrast: Maximum contrast for accessibility
 */
export type Theme = 'light' | 'dark' | 'high-contrast';

/**
 * Complete settings state interface including all values and actions.
 */
interface SettingsState {
  // Typography Settings
  /** Currently selected font family */
  fontFamily: FontFamily;
  /** Font size in pixels (range: 14-28) */
  fontSize: number;
  /** Line height multiplier (e.g., 1.5 = 150% of font size) */
  lineHeight: number;
  /** Letter spacing preset */
  letterSpacing: LetterSpacing;

  // Visual Settings
  /** Current color theme */
  theme: Theme;
  /** Custom background color (hex format) */
  backgroundColor: string;

  // Speech Settings
  /** URI of the default voice for text-to-speech, null for system default */
  defaultVoiceURI: string | null;
  /** Default speech rate (0.5 - 2.0, where 1.0 is normal) */
  defaultRate: number;

  // UI State
  /** Whether the left sidebar (document list) is visible */
  leftSidebarOpen: boolean;
  /** Whether the right panel (comments) is visible */
  rightPanelOpen: boolean;

  // Session Persistence
  /** ID of the last opened document for session restore */
  lastDocumentId: string | null;

  // Actions - Typography
  /** Sets the font family for the editor */
  setFontFamily: (family: FontFamily) => void;
  /** Sets the font size in pixels */
  setFontSize: (size: number) => void;
  /** Sets the line height multiplier */
  setLineHeight: (height: number) => void;
  /** Sets the letter spacing preset */
  setLetterSpacing: (spacing: LetterSpacing) => void;

  // Actions - Visual
  /** Sets the color theme */
  setTheme: (theme: Theme) => void;
  /** Sets a custom background color */
  setBackgroundColor: (color: string) => void;

  // Actions - Speech
  /** Sets the default voice for text-to-speech */
  setDefaultVoice: (voiceURI: string | null) => void;
  /** Sets the default speech rate */
  setDefaultRate: (rate: number) => void;

  // Actions - UI
  /** Toggles the left sidebar visibility */
  toggleLeftSidebar: () => void;
  /** Toggles the right panel visibility */
  toggleRightPanel: () => void;
  /** Explicitly sets the left sidebar visibility */
  setLeftSidebarOpen: (open: boolean) => void;
  /** Explicitly sets the right panel visibility */
  setRightPanelOpen: (open: boolean) => void;

  // Actions - Session
  /** Sets the last opened document ID for session restore */
  setLastDocumentId: (id: string | null) => void;
}

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * Custom storage adapter for zustand persist middleware.
 * Uses idb-keyval for IndexedDB-based async storage.
 */
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    logger.debug('Loading settings from storage', { key: name });
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    logger.debug('Saving settings to storage', { key: name });
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    logger.debug('Removing settings from storage', { key: name });
    await del(name);
  },
};

// ============================================================================
// Store Definition
// ============================================================================

/**
 * Settings store hook for accessing and modifying user preferences.
 *
 * @example
 * ```typescript
 * import { useSettingsStore } from '@/stores';
 *
 * function SettingsPanel() {
 *   const { fontSize, setFontSize, theme, setTheme } = useSettingsStore();
 *
 *   return (
 *     <div>
 *       <input
 *         type="range"
 *         min={14}
 *         max={28}
 *         value={fontSize}
 *         onChange={(e) => setFontSize(Number(e.target.value))}
 *       />
 *       <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *         <option value="high-contrast">High Contrast</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values - Typography
      fontFamily: 'system',
      fontSize: 18,
      lineHeight: 1.5,
      letterSpacing: 'normal',

      // Default values - Visual
      theme: 'light',
      backgroundColor: '#ffffff',

      // Default values - Speech
      defaultVoiceURI: null,
      defaultRate: 1,

      // Default values - UI
      leftSidebarOpen: true,
      rightPanelOpen: false,

      // Default values - Session
      lastDocumentId: null,

      // Actions - Typography
      setFontFamily: (family) => {
        logger.info('Font family changed', { family });
        set({ fontFamily: family });
      },
      setFontSize: (size) => {
        logger.debug('Font size changed', { size });
        set({ fontSize: size });
      },
      setLineHeight: (height) => {
        logger.debug('Line height changed', { height });
        set({ lineHeight: height });
      },
      setLetterSpacing: (spacing) => {
        logger.info('Letter spacing changed', { spacing });
        set({ letterSpacing: spacing });
      },

      // Actions - Visual
      setTheme: (theme) => {
        logger.info('Theme changed', { theme });
        set({ theme });
      },
      setBackgroundColor: (color) => {
        logger.debug('Background color changed', { color });
        set({ backgroundColor: color });
      },

      // Actions - Speech
      setDefaultVoice: (voiceURI) => {
        logger.info('Default voice changed', { voiceURI });
        set({ defaultVoiceURI: voiceURI });
      },
      setDefaultRate: (rate) => {
        logger.debug('Default rate changed', { rate });
        set({ defaultRate: rate });
      },

      // Actions - UI
      toggleLeftSidebar: () =>
        set((state) => {
          const newState = !state.leftSidebarOpen;
          logger.debug('Left sidebar toggled', { open: newState });
          return { leftSidebarOpen: newState };
        }),
      toggleRightPanel: () =>
        set((state) => {
          const newState = !state.rightPanelOpen;
          logger.debug('Right panel toggled', { open: newState });
          return { rightPanelOpen: newState };
        }),
      setLeftSidebarOpen: (open) => {
        logger.debug('Left sidebar visibility set', { open });
        set({ leftSidebarOpen: open });
      },
      setRightPanelOpen: (open) => {
        logger.debug('Right panel visibility set', { open });
        set({ rightPanelOpen: open });
      },

      // Actions - Session
      setLastDocumentId: (id) => {
        logger.debug('Last document ID updated', { id });
        set({ lastDocumentId: id });
      },
    }),
    {
      name: 'babble-settings',
      storage: createJSONStorage(() => storage),
    }
  )
);
