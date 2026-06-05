import { expect, test, describe } from 'vitest';
import * as Y from 'yjs';
import { countWords, extractPlainText } from '../src/text-utils';
import { computeDiff } from '../src/diff';
import * as index from '../src/index';

describe('Shared Utility Functions', () => {
  describe('index exports', () => {
    test('exports all permissions, schemas, diff, and text-utils', () => {
      expect(index.canViewDocument).toBeDefined();
      expect(index.createDocumentSchema).toBeDefined();
      expect(index.computeDiff).toBeDefined();
      expect(index.countWords).toBeDefined();
    });
  });

  describe('countWords', () => {
    test('counts words correctly for empty inputs', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });

    test('counts standard strings correctly', () => {
      expect(countWords('hello world')).toBe(2);
      expect(countWords('  hello   world  with many   spaces  ')).toBe(5);
    });
  });

  describe('computeDiff', () => {
    test('computes word-level diff correctly', () => {
      const oldText = 'hello world test';
      const newText = 'hello brave new world test';
      const diffResult = computeDiff(oldText, newText);

      expect(diffResult.length).toBeGreaterThan(0);
      expect(diffResult.some((part) => part.added && part.value.includes('brave'))).toBe(true);
    });
  });

  describe('extractPlainText from Yjs XmlFragment', () => {
    test('recursively extracts plain text from Yjs XML nodes', () => {
      const doc = new Y.Doc();
      const fragment = doc.getXmlFragment('default');

      // Create and integrate the paragraph element first
      const paragraph = new Y.XmlElement('paragraph');
      fragment.insert(0, [paragraph]);

      // Now insert text into the integrated paragraph element
      const textNode = new Y.XmlText('Hello Yjs!');
      paragraph.insert(0, [textNode]);

      const plainText = extractPlainText(doc);
      expect(plainText).toContain('Hello Yjs!');
      expect(plainText).toContain('\n'); // paragraph is a block tag, so trailing newline is added
    });
  });
});
