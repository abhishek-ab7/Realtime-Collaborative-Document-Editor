import { prisma } from '@collabdoc/database';
import { hasMinRole } from '@collabdoc/shared';
import type { Role } from '@collabdoc/shared';

export type DocumentRole = 'OWNER' | 'EDITOR' | 'VIEWER' | null;

/**
 * Resolve a user's role for a given document.
 * Returns OWNER if the user is the document creator,
 * EDITOR/VIEWER if they are a collaborator, or null if no access.
 */
export async function getDocumentRole(documentId: string, userId: string): Promise<DocumentRole> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!doc) return null;
  if (doc.ownerId === userId) return 'OWNER';

  const collab = await prisma.collaborator.findUnique({
    where: { documentId_userId: { documentId, userId } },
    select: { role: true },
  });

  return (collab?.role as DocumentRole) ?? null;
}

/**
 * Higher-order function that wraps an API route handler with permission checks.
 * Authenticates the user, resolves their role, and enforces the minimum required role.
 */
export function withPermission(
  requiredRole: Role,
  handler: (
    request: Request,
    context: { params: Record<string, string>; userId: string; role: DocumentRole },
  ) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<Record<string, string>> }) => {
    // Dynamic import to avoid circular dependency issues
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const documentId = params.id;

    if (!documentId) {
      return Response.json({ error: 'Document ID required' }, { status: 400 });
    }

    const role = await getDocumentRole(documentId, session.user.id);
    if (!role) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!hasMinRole(role, requiredRole)) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return handler(request, { params, userId: session.user.id, role });
  };
}
