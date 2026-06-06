'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@/features/editor/components/editor';
import { EditorHeader } from '@/features/editor/components/editor-header';
import { OfflineBanner } from '@/features/editor/components/offline-banner';
import {
  CollaborationProvider,
  useCollaborationContext,
} from '@/features/collaboration/providers/collaboration-provider';
import { usePresence } from '@/features/collaboration/hooks/use-presence';
import { PRESENCE_COLORS, canEditDocument } from '@collabdoc/shared';
import { useVersions, VersionItem } from '@/features/editor/hooks/use-versions';
import { VersionPanel } from '@/features/editor/components/version-history/version-panel';
import { VersionDiffViewer } from '@/features/editor/components/version-history/version-diff';
import { CommentsSidebar } from '@/features/editor/components/comments-sidebar';
import { AIAssistantPanel } from '@/features/editor/components/ai-assistant-panel';
import { CommandPalette } from '@/features/editor/components/command-palette';
import type { DocumentRole } from '@/lib/permissions';
import type { Editor as TipTapEditor } from '@tiptap/react';

interface DocumentEditorClientProps {
  documentId: string;
  title: string;
  content: string;
  lastAccessedAt: Date | null;
  userName: string;
  userImage: string | null;
  userId: string;
  role: DocumentRole;
}

function CollaborativeEditor({
  documentId,
  title,
  userName,
  userImage,
  userId,
  role,
}: {
  documentId: string;
  title: string;
  userName: string;
  userImage: string | null;
  userId: string;
  role: DocumentRole;
}) {
  const { doc, awareness, saveStatus, connectionStatus } = useCollaborationContext();
  const { setLocalUser } = usePresence();

  const colorIndex =
    userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % PRESENCE_COLORS.length;
  const userColor = PRESENCE_COLORS[colorIndex];

  const editable = canEditDocument(role);

  // Document Title State
  const [currentTitle, setCurrentTitle] = useState(title);

  // Versions State
  const [editor, setEditor] = useState<TipTapEditor | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commentsTab, setCommentsTab] = useState<'comments' | 'history' | 'analytics' | 'settings'>(
    'comments',
  );
  const versionsHook = useVersions(documentId, isCommentsOpen && commentsTab === 'history');
  const [diffVersion, setDiffVersion] = useState<VersionItem | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!doc) return;
    const yComments = doc.getArray('comments');
    const observer = () => {
      setCommentCount(yComments.length);
    };
    yComments.observe(observer);
    Promise.resolve().then(() => {
      setCommentCount(yComments.length);
    });
    return () => {
      yComments.unobserve(observer);
    };
  }, [doc]);

  // Push local user info into awareness once connected
  useEffect(() => {
    if (awareness) {
      setLocalUser({ userId, name: userName, avatarUrl: userImage, color: userColor });
    }
  }, [awareness, userId, userName, userColor, userImage, setLocalUser]);

  // Warn the browser before closing when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        // Modern browsers ignore the returnValue string but still show the dialog
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Listen for open-diff-viewer event
  useEffect(() => {
    const handleOpenDiff = (e: CustomEvent<VersionItem>) => {
      setDiffVersion(e.detail);
    };
    window.addEventListener('open-diff-viewer', handleOpenDiff as EventListener);
    return () => window.removeEventListener('open-diff-viewer', handleOpenDiff as EventListener);
  }, []);

  // Listen for command palette trigger
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isOffline = connectionStatus === 'disconnected';

  // Loading state until socket sync
  if (!doc) {
    return (
      <div className="bg-background flex h-screen w-full flex-col overflow-hidden">
        <EditorHeader documentId={documentId} title={title} role={role} />
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
    <div className="bg-background flex h-screen w-full flex-col overflow-hidden">
      <EditorHeader
        documentId={documentId}
        title={currentTitle}
        onOpenHistory={versionsHook.togglePanel}
        onOpenComments={() => setIsCommentsOpen(!isCommentsOpen)}
        onOpenAI={() => setIsAIOpen(!isAIOpen)}
        role={role}
        commentCount={commentCount}
        editor={editor}
        onTitleSave={setCurrentTitle}
      />

      {/* Offline warning banner */}
      {isOffline && <OfflineBanner />}

      {/* View-only banner for viewers */}
      {!editable && (
        <div className="flex items-center justify-center border-b border-[#fef3c7] bg-[#fffbeb] px-4 py-2">
          <p className="text-xs font-medium text-[#d97706]">
            🔒 You have view-only access to this document
          </p>
        </div>
      )}

      <main className="relative flex flex-1 overflow-hidden">
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Editor
            editable={editable}
            yjsDoc={doc}
            awareness={awareness ?? undefined}
            user={{ name: userName, color: userColor }}
            onCountChange={(words, chars) => {
              setWordCount(words);
              setCharCount(chars);
            }}
            onEditorLoad={setEditor}
          />
        </div>

        <CommentsSidebar
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          userName={userName}
          userImage={userImage}
          versions={versionsHook.versions}
          onRestoreVersion={versionsHook.restoreVersion}
          wordCount={wordCount}
          charCount={charCount}
          documentRole={role}
          activeTab={commentsTab}
          onActiveTabChange={setCommentsTab}
        />

        <AIAssistantPanel
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          documentId={documentId}
          editor={editor}
          documentTitle={currentTitle}
        />

        <VersionPanel
          documentId={documentId}
          isOpen={versionsHook.isOpen}
          onClose={() => versionsHook.setIsOpen(false)}
          versions={versionsHook.versions}
          isLoading={versionsHook.isLoading}
          onCreateManualVersion={versionsHook.createManualVersion}
          onRestoreVersion={versionsHook.restoreVersion}
        />
      </main>

      <VersionDiffViewer
        documentId={documentId}
        version={diffVersion}
        onClose={() => setDiffVersion(null)}
        onRestore={versionsHook.restoreVersion}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenHistory={versionsHook.togglePanel}
        onOpenAI={() => setIsAIOpen(true)}
      />
    </div>
  );
}

export function DocumentEditorClient({
  documentId,
  title,
  userName,
  userImage,
  userId,
  role,
}: DocumentEditorClientProps) {
  return (
    <CollaborationProvider documentId={documentId}>
      <CollaborativeEditor
        documentId={documentId}
        title={title}
        userName={userName}
        userImage={userImage}
        userId={userId}
        role={role}
      />
    </CollaborationProvider>
  );
}
