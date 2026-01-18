/**
 * Text Parser Utilities - Functions for parsing and analyzing text content.
 *
 * This module provides utilities for:
 * - Building word position maps for speech highlighting
 * - Finding words at specific character positions
 * - Extracting plain text from HTML content
 *
 * These utilities are essential for the text-to-speech highlighting feature,
 * enabling word-by-word tracking as text is spoken.
 *
 * @module utils/textParser
 */

import type { WordPosition } from '@/stores';

// ============================================================================
// Word Mapping Functions
// ============================================================================

/**
 * Builds a map of word positions from plain text.
 *
 * Parses the text and creates an array of WordPosition objects,
 * each containing the start/end indices and the word itself.
 * Words are defined as sequences of non-whitespace characters.
 *
 * @param text - The plain text to parse
 * @returns Array of word positions in order of appearance
 *
 * @example
 * ```typescript
 * const positions = buildWordMap('Hello world');
 * // Returns:
 * // [
 * //   { start: 0, end: 5, word: 'Hello' },
 * //   { start: 6, end: 11, word: 'world' }
 * // ]
 * ```
 *
 * @example
 * ```typescript
 * // With punctuation
 * const positions = buildWordMap('Hello, world!');
 * // Returns:
 * // [
 * //   { start: 0, end: 6, word: 'Hello,' },
 * //   { start: 7, end: 13, word: 'world!' }
 * // ]
 * ```
 */
export function buildWordMap(text: string): WordPosition[] {
  const words: WordPosition[] = [];
  const regex = /\S+/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    words.push({
      start: match.index,
      end: match.index + match[0].length,
      word: match[0],
    });
  }

  return words;
}

/**
 * Finds the word index at a given character position.
 *
 * Given a character index and an array of word positions,
 * returns the index of the word that contains or is closest to
 * that character position.
 *
 * This is used during speech playback to determine which word
 * should be highlighted based on the speech synthesis boundary events.
 *
 * @param charIndex - The character index to look up
 * @param positions - Array of word positions to search
 * @returns The index of the word at or near the position
 *
 * @example
 * ```typescript
 * const positions = buildWordMap('Hello world');
 * findWordAtPosition(0, positions);  // Returns 0 (Hello)
 * findWordAtPosition(3, positions);  // Returns 0 (Hello)
 * findWordAtPosition(6, positions);  // Returns 1 (world)
 * findWordAtPosition(100, positions); // Returns 1 (last word)
 * ```
 */
export function findWordAtPosition(charIndex: number, positions: WordPosition[]): number {
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];

    // Character is within this word
    if (charIndex >= pos.start && charIndex < pos.end) {
      return i;
    }

    // Character is before this word (in whitespace between words)
    if (charIndex < pos.start) {
      return Math.max(0, i - 1);
    }
  }

  // Character is after all words, return last word
  return positions.length - 1;
}

// ============================================================================
// HTML Processing Functions
// ============================================================================

/**
 * Extracts plain text content from HTML.
 *
 * Creates a temporary DOM element, sets its innerHTML,
 * and extracts the text content. This strips all HTML tags
 * and returns only the visible text.
 *
 * Note: This function must be run in a browser environment
 * as it uses the DOM API.
 *
 * @param html - The HTML string to extract text from
 * @returns The plain text content
 *
 * @example
 * ```typescript
 * extractPlainText('<p>Hello <strong>world</strong>!</p>');
 * // Returns: 'Hello world!'
 * ```
 *
 * @example
 * ```typescript
 * extractPlainText('<div><p>Paragraph 1</p><p>Paragraph 2</p></div>');
 * // Returns: 'Paragraph 1Paragraph 2'
 * ```
 */
export function extractPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
