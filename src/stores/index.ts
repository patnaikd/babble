/**
 * State Management Stores - Central export for all Zustand stores.
 *
 * This barrel file re-exports all state management stores used in the
 * Babble application, providing a single import point for components.
 *
 * ## Available Stores
 *
 * - **useSpeechStore** - Text-to-speech playback state (playing, paused, word tracking)
 * - **useDocumentStore** - Current document and document list state
 * - **useSettingsStore** - Persisted user preferences (theme, fonts, voice settings)
 * - **useUIStore** - Ephemeral UI state (dialogs, toasts)
 *
 * ## Usage Pattern
 *
 * All stores use Zustand and follow the same pattern:
 *
 * ```typescript
 * import { useSettingsStore, useDocumentStore } from '@/stores';
 *
 * function MyComponent() {
 *   // Destructure only the state/actions you need
 *   const { theme, setTheme } = useSettingsStore();
 *   const { currentDocument } = useDocumentStore();
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * ## Accessing State Outside React
 *
 * Use `getState()` to access store state outside of React components:
 *
 * ```typescript
 * const currentWord = useSpeechStore.getState().currentWordIndex;
 * ```
 *
 * @module stores
 */

// Speech playback state management
export { useSpeechStore, type WordPosition } from './speechStore';

// Document and document list state management
export { useDocumentStore } from './documentStore';

// Persisted user settings and preferences
export {
  useSettingsStore,
  type FontFamily,
  type LetterSpacing,
  type Theme,
} from './settingsStore';

// Ephemeral UI state (dialogs, toasts)
export { useUIStore, type Toast } from './uiStore';
