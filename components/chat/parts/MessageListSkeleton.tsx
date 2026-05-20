export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-9 h-9 rounded-sm bg-paper-2 skeleton-pixel" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-paper-2 rounded-sm skeleton-pixel" />
            <div className="h-12 w-3/4 bg-paper-2 rounded-sm skeleton-pixel" />
          </div>
        </div>
      ))}
    </div>
  );
}
