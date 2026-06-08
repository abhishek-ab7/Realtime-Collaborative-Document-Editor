'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, History, BarChart2, Settings, Send, Check, X } from 'lucide-react';
import { useCollaborationContext } from '@/features/collaboration/providers/collaboration-provider';
import { PRESENCE_COLORS } from '@collabdoc/shared';
import type { DocumentRole } from '@/lib/permissions';

interface Reply {
  id: string;
  author: string;
  avatarUrl: string | null;
  content: string;
  time: string;
}

interface Comment {
  id: string;
  author: string;
  avatarUrl: string | null;
  content: string;
  time: string;
  resolved?: boolean;
  replies?: Reply[];
}

import type { VersionItem } from '@/features/editor/hooks/use-versions';

interface CommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userImage: string | null;
  versions?: VersionItem[];
  onRestoreVersion?: (versionId: string) => void;
  wordCount?: number;
  charCount?: number;
  documentRole?: DocumentRole;
  activeTab?: 'comments' | 'history' | 'analytics' | 'settings';
  onActiveTabChange?: (tab: 'comments' | 'history' | 'analytics' | 'settings') => void;
}

export function CommentsSidebar({
  isOpen,
  onClose,
  userName,
  userImage,
  versions = [],
  onRestoreVersion,
  wordCount = 0,
  charCount = 0,
  documentRole = 'VIEWER',
  activeTab: externalActiveTab,
  onActiveTabChange,
}: CommentsSidebarProps) {
  const { connectedUsers, doc } = useCollaborationContext();
  const [localActiveTab, setLocalActiveTab] = useState<
    'comments' | 'history' | 'analytics' | 'settings'
  >('comments');
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : localActiveTab;
  const setActiveTab = onActiveTabChange !== undefined ? onActiveTabChange : setLocalActiveTab;

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!doc) return;
    const yComments = doc.getArray<Comment>('comments');

    const observer = () => {
      setComments(yComments.toArray());
    };

    yComments.observe(observer);
    Promise.resolve().then(() => {
      setComments(yComments.toArray());
    });
    return () => {
      yComments.unobserve(observer);
    };
  }, [doc]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!commentText.trim() || !doc) return;
    const yComments = doc.getArray<Comment>('comments');
    const newComment: Comment = {
      id: Date.now().toString(),
      author: userName,
      avatarUrl: userImage,
      content: commentText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replies: [],
    };
    yComments.push([newComment]);
    setCommentText('');
  };

  const handleResolve = (id: string) => {
    if (!doc) return;
    const yComments = doc.getArray<Comment>('comments');
    const index = yComments.toArray().findIndex((c: Comment) => c.id === id);
    if (index !== -1) {
      yComments.delete(index, 1);
    }
  };

  const handleSendReply = (commentId: string) => {
    if (!replyText.trim() || !doc) return;
    const yComments = doc.getArray<Comment>('comments');
    const commentIndex = yComments.toArray().findIndex((c: Comment) => c.id === commentId);
    if (commentIndex === -1) return;

    const comment = yComments.get(commentIndex);
    const newReply: Reply = {
      id: Date.now().toString(),
      author: userName,
      avatarUrl: userImage,
      content: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedComment: Comment = {
      ...comment,
      replies: [...(comment.replies || []), newReply],
    };

    doc.transact(() => {
      yComments.delete(commentIndex, 1);
      yComments.insert(commentIndex, [updatedComment]);
    });

    setReplyText('');
    setReplyingToId(null);
  };

  return (
    <aside className="absolute top-0 right-0 bottom-0 z-40 flex h-full w-full max-w-[320px] shrink-0 flex-col border-l border-[#e2e8f0] bg-white shadow-xl transition-all duration-200 ease-in-out lg:relative lg:w-[320px] lg:shadow-none">
      {/* Sidebar Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white p-4">
        <div>
          <h3 className="text-sm leading-none font-bold text-[#191c1e]">Collaboration</h3>
          <p className="mt-1 text-[10px] font-medium text-[#464555]">Active Now</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Avatars */}
          <div className="flex -space-x-1.5 overflow-hidden">
            {connectedUsers.map((user, i) => {
              const colorIndex =
                user.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                PRESENCE_COLORS.length;
              const userColor = PRESENCE_COLORS[colorIndex];
              return (
                <div
                  key={user.userId + i}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: userColor || '#4f46e5' }}
                  title={user.name}
                >
                  {user.name.charAt(0)}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex cursor-pointer items-center justify-center rounded-md p-1 text-[#464555] transition-colors hover:bg-[#eceef0] active:opacity-80"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sidebar Tabs */}
      <div className="flex border-b border-[#e2e8f0] bg-white px-2">
        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-3 text-xs font-semibold ${
            activeTab === 'comments'
              ? 'border-b-2 border-[#3525cd] text-[#3525cd]'
              : 'text-[#464555] hover:text-[#191c1e]'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Comments</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex cursor-pointer items-center justify-center px-3 py-3 text-xs font-semibold ${
            activeTab === 'history' ? 'text-[#3525cd]' : 'text-[#464555] hover:text-[#191c1e]'
          }`}
        >
          <History className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex cursor-pointer items-center justify-center px-3 py-3 text-xs font-semibold ${
            activeTab === 'analytics' ? 'text-[#3525cd]' : 'text-[#464555] hover:text-[#191c1e]'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex cursor-pointer items-center justify-center px-3 py-3 text-xs font-semibold ${
            activeTab === 'settings' ? 'text-[#3525cd]' : 'text-[#464555] hover:text-[#191c1e]'
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {activeTab === 'comments' ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="relative rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-xs"
            >
              <div className="absolute top-0 bottom-0 left-0 w-1 rounded-l-lg bg-[#3525cd]" />
              <div className="mb-1.5 flex items-start gap-2.5">
                {comment.avatarUrl ? (
                  <img
                    src={comment.avatarUrl}
                    alt={comment.author}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="animate-in fade-in zoom-in flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase duration-200"
                    style={{
                      backgroundColor:
                        PRESENCE_COLORS[
                          comment.author
                            .split('')
                            .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                            PRESENCE_COLORS.length
                        ] || '#4f46e5',
                    }}
                  >
                    {comment.author.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="truncate text-xs font-bold text-[#191c1e]">
                      {comment.author}
                    </span>
                    <span className="shrink-0 text-[10px] text-[#464555]">{comment.time}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap text-[#464555]">
                    {comment.content}
                  </p>
                </div>
              </div>

              {/* Nested Reply Threads */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-10">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="animate-in fade-in slide-in-from-top-1 flex items-start gap-2 duration-150"
                    >
                      {reply.avatarUrl ? (
                        <img
                          src={reply.avatarUrl}
                          alt={reply.author}
                          className="h-6 w-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white uppercase"
                          style={{
                            backgroundColor:
                              PRESENCE_COLORS[
                                reply.author
                                  .split('')
                                  .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                                  PRESENCE_COLORS.length
                              ] || '#4f46e5',
                          }}
                        >
                          {reply.author.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between">
                          <span className="truncate text-xs font-bold text-[#191c1e]">
                            {reply.author}
                          </span>
                          <span className="shrink-0 text-[9px] text-[#464555]">{reply.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed whitespace-pre-wrap text-[#464555]">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply / Resolve Actions */}
              <div className="mt-2 flex gap-3 pl-10">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(comment.id);
                    setReplyText('');
                  }}
                  className="cursor-pointer text-xs font-semibold text-[#3525cd] hover:underline"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(comment.id)}
                  className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#464555] hover:text-[#3525cd]"
                >
                  <Check className="h-3 w-3" /> Resolve
                </button>
              </div>

              {/* Reply Form */}
              {replyingToId === comment.id && (
                <div className="animate-in fade-in slide-in-from-top-1 mt-3 flex flex-col gap-2 pl-10 duration-150">
                  <div className="relative">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendReply(comment.id);
                      }}
                      className="w-full rounded-lg border-none bg-[#f2f4f6] py-1.5 pr-8 pl-3 text-xs transition-all outline-none focus:bg-white focus:ring-2 focus:ring-[#3525cd]"
                      placeholder="Write a reply..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSendReply(comment.id)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-[#3525cd] transition-colors hover:bg-[#eceef0]"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="cursor-pointer text-[10px] font-semibold text-[#464555] hover:text-[#191c1e]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : activeTab === 'history' ? (
          <div className="space-y-3">
            <h4 className="mb-2 text-xs font-bold tracking-wide text-[#191c1e] uppercase">
              Version History
            </h4>
            {versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94a3b8]">No versions saved yet</div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="relative rounded-lg border border-[#e2e8f0] bg-slate-50/50 p-3 transition-all hover:border-[#3525cd]"
                >
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-[#191c1e]">Version {v.versionNum}</span>
                    <span className="text-[9px] text-[#94a3b8]">
                      {new Date(v.createdAt).toLocaleDateString()}{' '}
                      {new Date(v.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mb-2 truncate text-[11px] text-[#464555]">{v.titleAtTime}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#464555]">
                    <span>{v.wordCount} words</span>
                    {onRestoreVersion && (
                      <button
                        type="button"
                        onClick={() => onRestoreVersion(v.id)}
                        className="cursor-pointer font-bold text-[#3525cd] hover:underline"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'analytics' ? (
          <div className="space-y-4">
            <h4 className="mb-2 text-xs font-bold tracking-wide text-[#191c1e] uppercase">
              Document Analytics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                <span className="block text-[10px] text-[#94a3b8] uppercase">Words</span>
                <span className="text-base font-bold text-[#191c1e]">{wordCount}</span>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                <span className="block text-[10px] text-[#94a3b8] uppercase">Characters</span>
                <span className="text-base font-bold text-[#191c1e]">{charCount}</span>
              </div>
            </div>
            <div className="space-y-2 border-t border-[#e2e8f0] pt-3 text-xs text-[#464555]">
              <div className="flex justify-between">
                <span>Reading Time:</span>
                <span className="font-semibold text-[#191c1e]">
                  {Math.ceil(wordCount / 200)} min
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Editors:</span>
                <span className="font-semibold text-[#191c1e]">{connectedUsers.length}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="mb-2 text-xs font-bold tracking-wide text-[#191c1e] uppercase">
              Document Settings
            </h4>
            <div className="space-y-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-[#464555]">
              <div>
                <span className="block text-[10px] text-[#94a3b8] uppercase">Your Access Role</span>
                <span className="font-bold text-[#191c1e]">{documentRole}</span>
              </div>
              <div className="border-t border-[#e2e8f0] pt-2">
                <span className="block text-[10px] text-[#94a3b8] uppercase">Sync Engine</span>
                <span className="font-semibold text-[#191c1e]">Yjs + Socket.io Protocol</span>
              </div>
            </div>
            <div className="text-xs">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Document link copied to clipboard!');
                }}
                className="w-full cursor-pointer rounded-lg bg-[#3525cd] py-2 text-center font-semibold text-white transition-opacity hover:opacity-90"
              >
                Copy Document Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Comment Input */}
      {activeTab === 'comments' && (
        <div className="sticky bottom-0 border-t border-[#e2e8f0] bg-white p-4">
          <div className="relative">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              className="w-full rounded-lg border-none bg-[#f2f4f6] py-2 pr-10 pl-4 text-xs transition-all outline-none focus:bg-white focus:ring-2 focus:ring-[#3525cd]"
              placeholder="Add Comment..."
            />
            <button
              type="button"
              onClick={handleSend}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[#3525cd] transition-colors hover:bg-[#eceef0]"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
