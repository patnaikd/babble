# Babble - Text to Speech for Dyslexic Users

Babble is a React-based Text-to-Speech application designed to help dyslexic users read content more easily. Users can paste rich text from any source, have it read aloud with word-by-word highlighting, save documents for later, and add comments.

## Features

- **Rich Text Paste**: Copy and paste formatted text from any source (Word, web pages, etc.)
- **Text-to-Speech**: Use the browser's built-in speech synthesis to read text aloud
- **Word Highlighting**: Visual highlighting of the current word being spoken
- **Auto-Scroll**: Page automatically scrolls to keep the current word in view
- **Position Memory**: Remembers where you stopped reading, even after refresh
- **Document Management**: Save, rename, and organize multiple documents
- **Drag & Drop Sorting**: Manually reorder your document list
- **Comments**: Add comments to specific parts of your documents
- **Accessibility Settings**:
  - Dyslexia-friendly fonts (OpenDyslexic)
  - Adjustable font size (14-28px)
  - Adjustable line height
  - Letter spacing options
  - Light/Dark/High Contrast themes
- **Voice Controls**: Choose from available system voices and adjust playback speed
- **Keyboard Shortcuts**: Ctrl+Space to play/pause, Escape to stop
- **Local Storage**: All data stored in your browser using IndexedDB

## Live Demo

Visit [https://patnaikd.github.io/babble](https://patnaikd.github.io/babble) to try Babble.

## Tech Stack

- **React 18+** with TypeScript
- **Vite** for fast development and building
- **TipTap** - Rich text editor
- **shadcn/ui** - Accessible UI components
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Dexie.js** - IndexedDB wrapper for document storage
- **Web Speech API** - Browser-native text-to-speech

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/patnaikd/babble.git
cd babble

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Create a Document**: Click the + button in the left sidebar
2. **Add Content**: Paste text from any source or type directly
3. **Listen**: Click the Play button to start text-to-speech
4. **Control Playback**: Use the speed slider and voice selector
5. **Resume Reading**: Click anywhere in the text to start from that position
6. **Save Progress**: Documents auto-save, and reading position is remembered
7. **Add Comments**: Select text and add comments in the right panel
8. **Customize**: Open Settings to adjust fonts, sizes, and themes

## Accessibility Tips

For dyslexic users, we recommend:
- Using OpenDyslexic font (available in Settings)
- Increasing line height to 1.5 or higher
- Using wider letter spacing
- Adjusting font size to your comfort level
- Using the TTS feature to listen while reading

## Browser Support

Babble works best in modern browsers that support the Web Speech API:
- Chrome (recommended)
- Firefox
- Safari
- Edge

Note: Voice availability depends on your operating system and browser.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
