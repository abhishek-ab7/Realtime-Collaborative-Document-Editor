import * as Y from 'yjs';

/**
 * Recursively extract plain text from a Yjs XmlFragment (TipTap default content field).
 * Block-level nodes get a trailing newline to preserve paragraph separation.
 */
export function extractPlainText(doc: Y.Doc): string {
  const xmlFragment = doc.getXmlFragment('default');
  return xmlFragmentToPlainText(xmlFragment);
}

const BLOCK_TAGS = new Set(['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock']);

function xmlFragmentToPlainText(fragment: Y.XmlFragment | Y.XmlElement): string {
  let text = '';
  for (let i = 0; i < fragment.length; i++) {
    const child = fragment.get(i);
    if (child instanceof Y.XmlText) {
      text += child.toString();
    } else if (child instanceof Y.XmlElement) {
      text += xmlFragmentToPlainText(child);
      if (BLOCK_TAGS.has(child.nodeName)) {
        text += '\n';
      }
    }
  }
  return text;
}

/**
 * Count the number of words in a plain-text string.
 * Handles multiple spaces and empty strings correctly.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((word) => word.length > 0).length;
}
