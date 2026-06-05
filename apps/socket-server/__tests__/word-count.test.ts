import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { extractPlainText, countWords } from '@collabdoc/shared';

describe('Text Utilities', () => {
  describe('extractPlainText', () => {
    it('extracts text from simple paragraphs', () => {
      const doc = new Y.Doc();
      const fragment = doc.getXmlFragment('default');

      const paragraph = new Y.XmlElement('paragraph');
      const text = new Y.XmlText('Hello world');
      paragraph.insert(0, [text]);
      fragment.insert(0, [paragraph]);

      expect(extractPlainText(doc)).toBe('Hello world\n');
    });

    it('adds newlines after block elements', () => {
      const doc = new Y.Doc();
      const fragment = doc.getXmlFragment('default');

      const p1 = new Y.XmlElement('paragraph');
      p1.insert(0, [new Y.XmlText('First')]);

      const p2 = new Y.XmlElement('paragraph');
      p2.insert(0, [new Y.XmlText('Second')]);

      fragment.insert(0, [p1, p2]);

      expect(extractPlainText(doc)).toBe('First\nSecond\n');
    });

    it('handles nested elements', () => {
      const doc = new Y.Doc();
      const fragment = doc.getXmlFragment('default');

      const blockquote = new Y.XmlElement('blockquote');
      const paragraph = new Y.XmlElement('paragraph');
      paragraph.insert(0, [new Y.XmlText('Nested text')]);
      blockquote.insert(0, [paragraph]);
      fragment.insert(0, [blockquote]);

      // Paragraph gives a newline, blockquote gives a newline
      expect(extractPlainText(doc)).toBe('Nested text\n\n');
    });

    it('returns empty string for empty document', () => {
      const doc = new Y.Doc();
      expect(extractPlainText(doc)).toBe('');
    });
  });

  describe('countWords', () => {
    it('counts words in standard sentences', () => {
      expect(countWords('The quick brown fox')).toBe(4);
    });

    it('handles multiple spaces and newlines', () => {
      expect(countWords('   The   quick \n\n brown\t fox  ')).toBe(4);
    });

    it('returns 0 for empty or whitespace-only strings', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   \n \t  ')).toBe(0);
    });
  });
});
