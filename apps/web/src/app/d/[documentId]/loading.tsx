import { Skeleton } from '@/components/ui/skeleton';

export default function EditorLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#e2e8f0] bg-white/95 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="sticky top-14 z-40 flex items-center gap-1 border-b border-[#e2e8f0] bg-white/95 px-4 py-2">
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="mx-auto w-full max-w-5xl px-12 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4 rounded-lg" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-4 w-3/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
