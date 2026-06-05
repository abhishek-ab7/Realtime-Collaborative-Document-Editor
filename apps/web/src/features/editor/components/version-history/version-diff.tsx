import useSWR from 'swr';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VersionItem } from '../../hooks/use-versions';
import { DiffPart } from '@collabdoc/shared';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch diff');
    return res.json();
  });

export function VersionDiffViewer({
  documentId,
  version,
  onClose,
  onRestore,
}: {
  documentId: string;
  version: VersionItem | null;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}) {
  const { data, isLoading } = useSWR<{ diff: DiffPart[] }>(
    version ? `/api/documents/${documentId}/versions/${version.id}/diff` : null,
    fetcher,
  );

  return (
    <Dialog open={!!version} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 bg-white px-6 py-4">
          <DialogTitle>Version {version?.versionNum}</DialogTitle>
          <DialogDescription>
            {version && format(new Date(version.createdAt), 'MMMM d, yyyy h:mm a')} by{' '}
            {version?.creator.name || version?.creator.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            </div>
          ) : data?.diff ? (
            <div className="prose max-w-none rounded-lg border border-slate-200 bg-white p-8 font-sans leading-relaxed whitespace-pre-wrap shadow-sm">
              {data.diff.map((part, index) => {
                if (part.added) {
                  return (
                    <span key={index} className="rounded bg-emerald-100 px-1 text-emerald-900">
                      {part.value}
                    </span>
                  );
                }
                if (part.removed) {
                  return (
                    <del
                      key={index}
                      className="rounded bg-rose-100 px-1 text-rose-900 line-through opacity-70"
                    >
                      {part.value}
                    </del>
                  );
                }
                return <span key={index}>{part.value}</span>;
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">Failed to load diff</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              if (version && confirm('Are you sure you want to restore this version?')) {
                onRestore(version.id);
                onClose();
              }
            }}
          >
            Restore this version
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
