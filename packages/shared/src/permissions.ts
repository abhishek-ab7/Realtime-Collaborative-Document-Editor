import type { Role } from './constants';

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1,
};

export function hasMinRole(userRole: string | null | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
}

export function canViewDocument(role: string | null): boolean {
  return hasMinRole(role, 'VIEWER');
}

export function canEditDocument(role: string | null): boolean {
  return hasMinRole(role, 'EDITOR');
}

export function canDeleteDocument(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canShareDocument(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canRenameDocument(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canManageCollaborators(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canRestoreVersion(role: string | null): boolean {
  return hasMinRole(role, 'EDITOR');
}
