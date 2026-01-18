# Project Overview

**Babble** is a React-based Text-to-Speech application designed to help dyslexic users read
content more easily. Users can paste rich text from any source, have it read aloud with
word-by-word highlighting, save documents locally, add comments, and customize accessibility
settings including dyslexia-friendly fonts, adjustable typography, and multiple color themes.
The app runs entirely client-side with IndexedDB storage and deploys to GitHub Pages.

## Repository Structure

```
babble/
├── .github/workflows/     # CI/CD pipeline (GitHub Pages deployment)
├── dist/                  # Production build output (gitignored for commits)
├── public/                # Static assets served as-is
├── src/
│   ├── components/        # React UI components organized by feature
│   │   ├── comments/      # Comment panel and comment list components
│   │   ├── common/        # Shared dialogs (ConfirmDialog, RenameDialog, Toaster)
│   │   ├── editor/        # TipTap rich text editor and toolbar
│   │   ├── layout/        # AppLayout, Header, MainContent shell
│   │   ├── settings/      # Accessibility settings dialog
│   │   ├── sidebar/       # Document list sidebar with drag-drop sorting
│   │   ├── speech/        # Speech playback controls
│   │   └── ui/            # shadcn/ui primitives (Button, Dialog, Select, etc.)
│   ├── db/                # Dexie.js IndexedDB schema and database singleton
│   ├── hooks/             # Custom React hooks (useDocuments, useSpeechSynthesis)
│   ├── lib/               # Utility helpers (cn classname merger)
│   ├── services/          # Domain services (speechService, documentService)
│   ├── stores/            # Zustand state stores (document, speech, settings, ui)
│   ├── types/             # TypeScript interfaces (Document, Comment)
│   └── utils/             # Pure utility functions (textParser, logger)
├── eslint.config.js       # ESLint flat config with React/TS rules
├── tailwind.config.js     # Tailwind CSS theme with accessibility animations
├── tsconfig.*.json        # TypeScript configurations
├── vite.config.ts         # Vite bundler config with path aliases and chunking
└── package.json           # Dependencies and npm scripts
```

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start development server (hot-reload at localhost:5173)
npm run dev

# Type-check and build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

> TODO: Add unit test command once testing framework is configured.

## Code Style & Conventions

**Formatting & Linting:**
- ESLint with `@typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`
- TypeScript strict mode enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- Tailwind CSS for styling; no CSS-in-JS

**Naming Patterns:**
- Components: PascalCase (`TextEditor.tsx`, `DocumentSidebar.tsx`)
- Hooks: camelCase with `use` prefix (`useDocuments.ts`, `useSpeechSynthesis.ts`)
- Stores: camelCase with `Store` suffix (`documentStore.ts`, `speechStore.ts`)
- Services: camelCase with `Service` suffix (`speechService.ts`)
- Types: PascalCase interfaces in `/types` directory

**Path Aliases:**
- Use `@/` to reference `./src/*` (configured in tsconfig and vite)

**Commit Message Template:**
```
<type>(<scope>): <short summary>

<optional body>

Co-Authored-By: <author>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`

## Architecture Notes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              React App (App.tsx)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐   ┌─────────────────────────┐   ┌───────────────────────┐  │
│  │  Sidebar    │   │     MainContent         │   │   CommentsPanel       │  │
│  │  (Docs)     │◄──┤  ┌─────────────────┐    │   │                       │  │
│  │             │   │  │  TextEditor     │    │──►│  Comment List         │  │
│  │  DocList    │   │  │  (TipTap)       │    │   │  Add Comment Form     │  │
│  │  DocItem    │   │  └─────────────────┘    │   │                       │  │
│  │  DnD Sort   │   │  ┌─────────────────┐    │   └───────────────────────┘  │
│  └─────────────┘   │  │ SpeechControls  │    │                              │
│                    │  └─────────────────┘    │                              │
│                    └─────────────────────────┘                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                            Zustand Stores                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │documentStore │ │ speechStore  │ │settingsStore │ │   uiStore    │        │
│  │ (in-memory)  │ │ (ephemeral)  │ │ (persisted)  │ │ (ephemeral)  │        │
│  └──────┬───────┘ └──────────────┘ └──────┬───────┘ └──────────────┘        │
│         │                                 │                                 │
├─────────┼─────────────────────────────────┼─────────────────────────────────┤
│         ▼                                 ▼                                 │
│  ┌──────────────┐                  ┌──────────────┐                         │
│  │ Dexie.js DB  │                  │  idb-keyval  │                         │
│  │ (IndexedDB)  │                  │  (settings)  │                         │
│  │ documents,   │                  └──────────────┘                         │
│  │ comments     │                                                           │
│  └──────────────┘                                                           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Web Speech API                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ speechService.ts - Wraps SpeechSynthesis, emits word boundary events │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User pastes/types in TipTap editor → `updateCurrentDocumentContent` updates store
2. Play button → `useSpeechSynthesis` extracts plain text, builds word map, calls speechService
3. `speechService.speak()` fires `onBoundary` events → store updates `currentWordIndex`
4. `TextEditor` subscribes to `currentWordIndex` → applies TipTap highlight mark + auto-scroll
5. Documents persist to IndexedDB via Dexie; settings persist via idb-keyval

**Key Libraries:**
- **TipTap**: Rich text editor with highlight extension for word tracking
- **Zustand**: Lightweight state management with persist middleware
- **Dexie.js**: Promise-based IndexedDB wrapper for document/comment storage
- **@dnd-kit**: Drag-and-drop reordering for document list
- **shadcn/ui + Radix**: Accessible UI primitives

## Testing Strategy

> TODO: Testing framework not yet configured. Recommended setup:

**Planned Approach:**
1. **Unit tests**: Vitest for pure functions (`textParser.ts`, store logic)
2. **Component tests**: React Testing Library for UI components
3. **E2E tests**: Playwright for critical user flows (paste text → play → highlight)

**Running Tests (once configured):**
```bash
# Unit & component tests
npm test

# E2E tests
npm run test:e2e
```

## Security & Compliance

**Secrets Handling:**
- No server-side secrets; app runs entirely client-side
- No API keys required; uses browser-native Web Speech API

**Data Storage:**
- All data stored in browser IndexedDB (local to user's device)
- No data transmitted to external servers
- Users should not paste sensitive/confidential content

**Dependencies:**
- Regularly audit with `npm audit`
- Pin major versions in package.json

**License:** MIT

## Agent Guardrails

**Files Never to Modify Without Review:**
- `package-lock.json` — only via `npm install`
- `.github/workflows/deploy.yml` — affects production deployment
- `vite.config.ts` — build configuration changes can break deployment

**Files Requiring Careful Review:**
- `src/db/schema.ts` — Database schema changes require migration strategy
- `src/stores/*Store.ts` — State shape changes can break persistence

**Automated Agents Must:**
1. Run `npm run lint` before committing
2. Run `npm run build` to verify TypeScript compiles
3. Never commit `dist/` or `node_modules/`
4. Preserve existing test patterns when adding new tests

**Rate Limits:**
- No external APIs are called; no rate limiting concerns

## Extensibility Hooks

**Environment Variables:**
- `BASE_URL` — Set via Vite for GitHub Pages deployment (currently `/babble/`)

**Tailwind Theme Extensions:**
- Custom colors defined in `tailwind.config.js` via CSS variables
- Add new theme colors by extending `colors` object

**Adding New Stores:**
1. Create `src/stores/newStore.ts` following existing patterns
2. Export from `src/stores/index.ts`
3. Use `persist` middleware if state should survive refresh

**Adding New TipTap Extensions:**
1. Install extension package
2. Add to extensions array in `TextEditor.tsx`
3. Add toolbar controls in `EditorToolbar.tsx`

**Feature Flags:**
> TODO: No feature flag system currently implemented. Consider using environment
> variables or a settings store flag for experimental features.

## Further Reading

- [README.md](README.md) — User-facing documentation and usage guide
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — CI/CD pipeline details
- [TipTap Documentation](https://tiptap.dev/) — Rich text editor extension development
- [Zustand Documentation](https://docs.pmnd.rs/zustand/) — State management patterns
- [Dexie.js Documentation](https://dexie.org/) — IndexedDB schema and queries
