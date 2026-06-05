import * as jsdiff from 'diff';

export type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

export function computeDiff(oldText: string, newText: string): DiffPart[] {
  // We use diffWords to get a word-by-word diff, which is better for document editing.
  return jsdiff.diffWordsWithSpace(oldText, newText);
}
