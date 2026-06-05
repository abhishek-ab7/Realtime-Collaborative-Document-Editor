'use client';

import { Editor } from '@/features/editor/components/editor';
import { EditorHeader } from '@/features/editor/components/editor-header';
import {
  CollaborationProvider,
  useCollaborationContext,
} from '@/features/collaboration/providers/collaboration-provider';
import { ConnectionStatus } from '@/features/collaboration/components/connection-status';
import { usePresence } from '@/features/collaboration/hooks/use-presence';
import { PRESENCE_COLORS } from '@collabdoc/shared';
import { useEffect } from 'react';

interface DocumentEditorClientProps {
  documentId: string;
  title: string;
  content: string;
  lastAccessedAt: Date | null;
  userName: string;
  userImage: string | null;
  userId: string;
}

function CollaborativeEditor({
  documentId,
  title,
  userName,
  userImage,
  userId,
}: {
  documentId: string;
  title: string;
  userName: string;
  userImage: string | null;
  userId: string;
}) {
  const { doc, awareness, saveStatus } = useCollaborationContext();
  const { setLocalUser } = usePresence();

  // Deterministic color assignment based on userId
  const colorIndex =
    userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % PRESENCE_COLORS.length;
  const userColor = PRESENCE_COLORS[colorIndex];

  // Set local user details in the awareness state once connected
  useEffect(() => {
    if (awareness) {
      setLocalUser({
        userId,
        name: userName,
        avatarUrl: userImage,
        color: userColor,
      });
    }
  }, [awareness, userId, userName, userColor, userImage, setLocalUser]);

  const isSaving = saveStatus === 'saving';
  const lastSavedAt = saveStatus === 'saved' ? new Date() : null;

  // Show loading state until synced
  if (!doc) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <EditorHeader documentId={documentId} title={title} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#6366f1]" />
            <p className="text-sm text-[#94a3b8]">Connecting to collaboration server...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <EditorHeader
        documentId={documentId}
        title={title}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
      />
      {/* Connection status bar */}
      <div className="flex items-center justify-end border-b border-[#f1f5f9] px-4 py-1">
        <ConnectionStatus />
      </div>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl">
          <Editor
            editable={true}
            yjsDoc={doc}
            awareness={awareness ?? undefined}
            user={{ name: userName, color: userColor }}
          />
        </div>
      </main>
    </div>
  );
}

export function DocumentEditorClient({
  documentId,
  title,
  userName,
  userImage,
  userId,
}: DocumentEditorClientProps) {
  return (
    <CollaborationProvider documentId={documentId}>
      <CollaborativeEditor
        documentId={documentId}
        title={title}
        userName={userName}
        userImage={userImage}
        userId={userId}
      />
    </CollaborationProvider>
  );
}
