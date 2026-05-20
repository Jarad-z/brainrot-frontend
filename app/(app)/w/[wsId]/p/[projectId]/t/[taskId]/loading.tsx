export default function Loading() {
  return (
    <div className="h-full grid grid-cols-[260px_1fr_320px]">
      <div className="border-r-[1.5px] border-hairline p-4 space-y-3">
        <div className="h-6 w-32 rounded-md bg-paper-2 animate-pulse" />
        <div className="h-12 rounded-md bg-paper-2 animate-pulse" />
        <div className="h-12 rounded-md bg-paper-2 animate-pulse" />
        <div className="h-12 rounded-md bg-paper-2 animate-pulse" />
      </div>
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 rounded-md bg-paper-2 animate-pulse" />
        <div className="h-20 rounded-lg bg-paper-2 animate-pulse" />
        <div className="h-16 rounded-lg bg-paper-2 animate-pulse" />
        <div className="h-24 rounded-lg bg-paper-2 animate-pulse" />
      </div>
      <div className="border-l-[1.5px] border-hairline p-4 space-y-3">
        <div className="h-6 w-24 rounded-md bg-paper-2 animate-pulse" />
        <div className="h-32 rounded-lg bg-paper-2 animate-pulse" />
      </div>
    </div>
  );
}
