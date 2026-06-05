'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Copy, Check, Trash2 } from 'lucide-react';
import type { ShareLinkItem } from '../hooks/use-share-link';

interface ShareLinkManagerProps {
  links: ShareLinkItem[];
  isGenerating: boolean;
  onGenerate: (permission: 'VIEW' | 'EDIT', expiresIn: string) => Promise<ShareLinkItem | null>;
  onRevokeAll: () => Promise<void>;
  onCopy: (url: string) => Promise<void>;
  isOwner: boolean;
}

export function ShareLinkManager({
  links,
  isGenerating,
  onGenerate,
  onRevokeAll,
  onCopy,
  isOwner,
}: ShareLinkManagerProps) {
  const [permission, setPermission] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [expiresIn, setExpiresIn] = useState('never');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    const link = await onGenerate(permission, expiresIn);
    if (link?.shareUrl) {
      setLastGeneratedUrl(link.shareUrl);
    }
  };

  const handleCopy = async (url: string, id: string) => {
    await onCopy(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOwner) {
    return (
      <div className="py-8 text-center" data-testid="share-link-no-access">
        <Link2 className="mx-auto mb-2 h-8 w-8 text-[#cbd5e1]" />
        <p className="text-sm text-[#94a3b8]">Only the document owner can manage share links.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="share-link-manager">
      {/* Configuration */}
      <div className="space-y-3 rounded-lg border border-[#e2e8f0] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e0e7ff]">
            <Link2 className="h-4 w-4 text-[#4f46e5]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0f172a]">Share with link</p>
            <p className="text-xs text-[#94a3b8]">Anyone with the link can access this document</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'VIEW' | 'EDIT')}
            className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs text-[#334155] outline-none focus:border-[#4f46e5]"
            data-testid="link-permission-select"
          >
            <option value="VIEW">Can view</option>
            <option value="EDIT">Can edit</option>
          </select>

          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs text-[#334155] outline-none focus:border-[#4f46e5]"
            data-testid="link-expiry-select"
          >
            <option value="never">Never expires</option>
            <option value="1d">Expires in 1 day</option>
            <option value="7d">Expires in 7 days</option>
            <option value="30d">Expires in 30 days</option>
          </select>

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-1.5 bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            data-testid="generate-link-button"
          >
            <Link2 className="h-3.5 w-3.5" />
            {isGenerating ? 'Creating...' : 'Create link'}
          </Button>
        </div>
      </div>

      {/* Last generated URL */}
      {lastGeneratedUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-[#c7d2fe] bg-[#eef2ff] p-3">
          <input
            readOnly
            value={lastGeneratedUrl}
            className="flex-1 truncate bg-transparent text-xs text-[#4f46e5] outline-none"
            data-testid="generated-link-input"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(lastGeneratedUrl, 'new')}
            className="shrink-0 gap-1 text-[#4f46e5] hover:text-[#4338ca]"
            data-testid="copy-link-button"
          >
            {copiedId === 'new' ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </Button>
        </div>
      )}

      {/* Active links count */}
      {links.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {links.length} active {links.length === 1 ? 'link' : 'links'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevokeAll}
            className="gap-1 text-xs text-red-500 hover:text-red-700"
            data-testid="revoke-all-button"
          >
            <Trash2 className="h-3 w-3" />
            Revoke all
          </Button>
        </div>
      )}
    </div>
  );
}
