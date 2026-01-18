import type { WordPosition } from '@/stores';

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

export function findWordAtPosition(charIndex: number, positions: WordPosition[]): number {
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (charIndex >= pos.start && charIndex < pos.end) {
      return i;
    }
    if (charIndex < pos.start) {
      return Math.max(0, i - 1);
    }
  }
  return positions.length - 1;
}

export function extractPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
