import { describe, it, expect } from "vitest";
import { relativeTime, formatBytes } from "@/lib/format";

const now = Date.parse("2026-05-16T12:00:00Z");

describe("relativeTime", () => {
  it("formats past minutes", () => {
    const iso = new Date(now - 5 * 60_000).toISOString();
    expect(relativeTime(iso, now)).toBe("5 分钟前");
  });

  it("formats past hours", () => {
    const iso = new Date(now - 3 * 3600_000).toISOString();
    expect(relativeTime(iso, now)).toBe("3 小时前");
  });

  it("formats past days", () => {
    const iso = new Date(now - 2 * 86400_000).toISOString();
    expect(relativeTime(iso, now)).toBe("2 天前");
  });

  it("returns 刚刚 for <60s", () => {
    const iso = new Date(now - 5_000).toISOString();
    expect(relativeTime(iso, now)).toBe("刚刚");
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats KB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1500)).toBe("1.5 KB");
  });

  it("formats MB", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });
});
