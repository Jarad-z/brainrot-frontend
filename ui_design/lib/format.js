// ui_design/lib/format.js
// Pure JS. Writes window.BR_LIB.format.

(function () {
  /**
   * Format byte count to "1.4 KB", "823 B", "2.1 MB", etc.
   * @param {number} bytes
   * @returns {string}
   */
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  }

  /**
   * Format ms duration to "12.4s", "1m 30s", "320ms".
   * @param {number} ms
   * @returns {string}
   */
  function formatDuration(ms) {
    if (ms < 1000) return Math.round(ms) + "ms";
    if (ms < 60_000) return (ms / 1000).toFixed(1) + "s";
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  }

  /**
   * Relative time: "刚刚", "3 分钟前", "昨天 14:32", "5/11".
   * @param {string|number|Date} when
   * @param {number} [nowMs]
   * @returns {string}
   */
  function formatRelative(when, nowMs) {
    const t = when instanceof Date ? when.getTime() : (typeof when === "number" ? when : Date.parse(when));
    const now = nowMs || Date.now();
    const diff = now - t;
    if (diff < 60_000) return "刚刚";
    if (diff < 3600_000) return Math.floor(diff / 60_000) + " 分钟前";
    if (diff < 86_400_000) return Math.floor(diff / 3600_000) + " 小时前";
    const d = new Date(t);
    if (diff < 2 * 86_400_000) {
      return `昨天 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.format = { formatBytes, formatDuration, formatRelative };
})();
