import { expect, test, describe } from 'vitest';
import {
  hasMinRole,
  canViewDocument,
  canEditDocument,
  canDeleteDocument,
  canShareDocument,
  canRenameDocument,
  canManageCollaborators,
  canRestoreVersion,
} from '../src/permissions';

describe('Permissions Helpers', () => {
  test('hasMinRole', () => {
    expect(hasMinRole(undefined, 'VIEWER')).toBe(false);
    expect(hasMinRole(null, 'VIEWER')).toBe(false);
    expect(hasMinRole('INVALID_ROLE', 'VIEWER')).toBe(false);
    expect(hasMinRole('VIEWER', 'EDITOR')).toBe(false);
    expect(hasMinRole('EDITOR', 'VIEWER')).toBe(true);
    expect(hasMinRole('OWNER', 'OWNER')).toBe(true);
  });

  test('canViewDocument', () => {
    expect(canViewDocument('VIEWER')).toBe(true);
    expect(canViewDocument('EDITOR')).toBe(true);
    expect(canViewDocument('OWNER')).toBe(true);
    expect(canViewDocument(null)).toBe(false);
  });

  test('canEditDocument', () => {
    expect(canEditDocument('VIEWER')).toBe(false);
    expect(canEditDocument('EDITOR')).toBe(true);
    expect(canEditDocument('OWNER')).toBe(true);
    expect(canEditDocument(null)).toBe(false);
  });

  test('canDeleteDocument', () => {
    expect(canDeleteDocument('VIEWER')).toBe(false);
    expect(canDeleteDocument('EDITOR')).toBe(false);
    expect(canDeleteDocument('OWNER')).toBe(true);
    expect(canDeleteDocument(null)).toBe(false);
  });

  test('canShareDocument', () => {
    expect(canShareDocument('VIEWER')).toBe(false);
    expect(canShareDocument('EDITOR')).toBe(false);
    expect(canShareDocument('OWNER')).toBe(true);
    expect(canShareDocument(null)).toBe(false);
  });

  test('canRenameDocument', () => {
    expect(canRenameDocument('VIEWER')).toBe(false);
    expect(canRenameDocument('EDITOR')).toBe(false);
    expect(canRenameDocument('OWNER')).toBe(true);
    expect(canRenameDocument(null)).toBe(false);
  });

  test('canManageCollaborators', () => {
    expect(canManageCollaborators('VIEWER')).toBe(false);
    expect(canManageCollaborators('EDITOR')).toBe(false);
    expect(canManageCollaborators('OWNER')).toBe(true);
    expect(canManageCollaborators(null)).toBe(false);
  });

  test('canRestoreVersion', () => {
    expect(canRestoreVersion('VIEWER')).toBe(false);
    expect(canRestoreVersion('EDITOR')).toBe(true);
    expect(canRestoreVersion('OWNER')).toBe(true);
    expect(canRestoreVersion(null)).toBe(false);
  });
});
