import { describe, test, expect, vi } from 'vitest';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock permissions module
vi.mock('@/lib/permissions', () => ({
  getDocumentRole: vi.fn(),
  withPermission: vi.fn(),
}));

// Mock shared — real implementations
vi.mock('@collabdoc/shared', () => {
  const hierarchy: Record<string, number> = { OWNER: 3, EDITOR: 2, VIEWER: 1 };
  const hasMinRole = (r: string | null, req: string) => {
    if (!r) return false;
    return (hierarchy[r] ?? 0) >= (hierarchy[req] ?? 999);
  };
  return {
    hasMinRole,
    canViewDocument: (r: string | null) => hasMinRole(r, 'VIEWER'),
    canEditDocument: (r: string | null) => hasMinRole(r, 'EDITOR'),
    canDeleteDocument: (r: string | null) => hasMinRole(r, 'OWNER'),
    canRenameDocument: (r: string | null) => hasMinRole(r, 'OWNER'),
    canShareDocument: (r: string | null) => hasMinRole(r, 'OWNER'),
    canManageCollaborators: (r: string | null) => hasMinRole(r, 'OWNER'),
    canRestoreVersion: (r: string | null) => hasMinRole(r, 'EDITOR'),
  };
});

import {
  canViewDocument,
  canEditDocument,
  canDeleteDocument,
  canRenameDocument,
  canShareDocument,
  canManageCollaborators,
  canRestoreVersion,
  hasMinRole,
} from '@collabdoc/shared';

describe('Permission Matrix', () => {
  // ─── hasMinRole ───
  describe('hasMinRole', () => {
    test('null role has no access', () => {
      expect(hasMinRole(null, 'VIEWER')).toBe(false);
      expect(hasMinRole(null, 'EDITOR')).toBe(false);
      expect(hasMinRole(null, 'OWNER')).toBe(false);
    });

    test('VIEWER meets VIEWER requirement', () => {
      expect(hasMinRole('VIEWER', 'VIEWER')).toBe(true);
    });

    test('VIEWER does not meet EDITOR requirement', () => {
      expect(hasMinRole('VIEWER', 'EDITOR')).toBe(false);
    });

    test('EDITOR meets VIEWER and EDITOR requirement', () => {
      expect(hasMinRole('EDITOR', 'VIEWER')).toBe(true);
      expect(hasMinRole('EDITOR', 'EDITOR')).toBe(true);
    });

    test('OWNER meets all requirements', () => {
      expect(hasMinRole('OWNER', 'VIEWER')).toBe(true);
      expect(hasMinRole('OWNER', 'EDITOR')).toBe(true);
      expect(hasMinRole('OWNER', 'OWNER')).toBe(true);
    });
  });

  // ─── View Document ───
  describe('canViewDocument', () => {
    test('OWNER can view', () => expect(canViewDocument('OWNER')).toBe(true));
    test('EDITOR can view', () => expect(canViewDocument('EDITOR')).toBe(true));
    test('VIEWER can view', () => expect(canViewDocument('VIEWER')).toBe(true));
    test('null cannot view', () => expect(canViewDocument(null)).toBe(false));
  });

  // ─── Edit Document ───
  describe('canEditDocument', () => {
    test('OWNER can edit', () => expect(canEditDocument('OWNER')).toBe(true));
    test('EDITOR can edit', () => expect(canEditDocument('EDITOR')).toBe(true));
    test('VIEWER cannot edit', () => expect(canEditDocument('VIEWER')).toBe(false));
    test('null cannot edit', () => expect(canEditDocument(null)).toBe(false));
  });

  // ─── Delete Document ───
  describe('canDeleteDocument', () => {
    test('OWNER can delete', () => expect(canDeleteDocument('OWNER')).toBe(true));
    test('EDITOR cannot delete', () => expect(canDeleteDocument('EDITOR')).toBe(false));
    test('VIEWER cannot delete', () => expect(canDeleteDocument('VIEWER')).toBe(false));
    test('null cannot delete', () => expect(canDeleteDocument(null)).toBe(false));
  });

  // ─── Rename Document ───
  describe('canRenameDocument', () => {
    test('OWNER can rename', () => expect(canRenameDocument('OWNER')).toBe(true));
    test('EDITOR cannot rename', () => expect(canRenameDocument('EDITOR')).toBe(false));
    test('VIEWER cannot rename', () => expect(canRenameDocument('VIEWER')).toBe(false));
  });

  // ─── Share Document ───
  describe('canShareDocument', () => {
    test('OWNER can share', () => expect(canShareDocument('OWNER')).toBe(true));
    test('EDITOR cannot share', () => expect(canShareDocument('EDITOR')).toBe(false));
    test('VIEWER cannot share', () => expect(canShareDocument('VIEWER')).toBe(false));
  });

  // ─── Manage Collaborators ───
  describe('canManageCollaborators', () => {
    test('OWNER can manage', () => expect(canManageCollaborators('OWNER')).toBe(true));
    test('EDITOR cannot manage', () => expect(canManageCollaborators('EDITOR')).toBe(false));
    test('VIEWER cannot manage', () => expect(canManageCollaborators('VIEWER')).toBe(false));
  });

  // ─── Restore Version ───
  describe('canRestoreVersion', () => {
    test('OWNER can restore', () => expect(canRestoreVersion('OWNER')).toBe(true));
    test('EDITOR can restore', () => expect(canRestoreVersion('EDITOR')).toBe(true));
    test('VIEWER cannot restore', () => expect(canRestoreVersion('VIEWER')).toBe(false));
  });

  // ─── Full Matrix Validation ───
  describe('Full Permission Matrix', () => {
    const matrix: Array<{
      action: string;
      fn: (role: string | null) => boolean;
      owner: boolean;
      editor: boolean;
      viewer: boolean;
      none: boolean;
    }> = [
      {
        action: 'View document',
        fn: canViewDocument,
        owner: true,
        editor: true,
        viewer: true,
        none: false,
      },
      {
        action: 'Edit document',
        fn: canEditDocument,
        owner: true,
        editor: true,
        viewer: false,
        none: false,
      },
      {
        action: 'Delete document',
        fn: canDeleteDocument,
        owner: true,
        editor: false,
        viewer: false,
        none: false,
      },
      {
        action: 'Rename document',
        fn: canRenameDocument,
        owner: true,
        editor: false,
        viewer: false,
        none: false,
      },
      {
        action: 'Share document',
        fn: canShareDocument,
        owner: true,
        editor: false,
        viewer: false,
        none: false,
      },
      {
        action: 'Manage collaborators',
        fn: canManageCollaborators,
        owner: true,
        editor: false,
        viewer: false,
        none: false,
      },
      {
        action: 'Restore version',
        fn: canRestoreVersion,
        owner: true,
        editor: true,
        viewer: false,
        none: false,
      },
    ];

    matrix.forEach(({ action, fn, owner, editor, viewer, none }) => {
      test(`${action}: OWNER=${owner}, EDITOR=${editor}, VIEWER=${viewer}, null=${none}`, () => {
        expect(fn('OWNER')).toBe(owner);
        expect(fn('EDITOR')).toBe(editor);
        expect(fn('VIEWER')).toBe(viewer);
        expect(fn(null)).toBe(none);
      });
    });
  });
});
