const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
};

function pad(n: number, w = 2): string {
  return n.toString().padStart(w, "0");
}

export function screenshotFilename(now: Date, mime: string): string {
  const ext = EXT[mime.toLowerCase()] ?? "png";
  const y = now.getUTCFullYear();
  const mo = pad(now.getUTCMonth() + 1);
  const d = pad(now.getUTCDate());
  const h = pad(now.getUTCHours());
  const mi = pad(now.getUTCMinutes());
  const s = pad(now.getUTCSeconds());
  return `screenshot-${y}${mo}${d}-${h}${mi}${s}.${ext}`;
}
