export function PageSkeleton() {
  return (
    <div className="p-8 space-y-4">
      <div className="h-8 w-64 rounded-md bg-paper-2 animate-pulse" />
      <div className="h-4 w-96 rounded-md bg-paper-2 animate-pulse" />
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="h-32 rounded-xl bg-paper-2 animate-pulse" />
        <div className="h-32 rounded-xl bg-paper-2 animate-pulse" />
        <div className="h-32 rounded-xl bg-paper-2 animate-pulse" />
      </div>
    </div>
  );
}
