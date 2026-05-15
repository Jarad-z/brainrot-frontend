// ui_design/chat/parts/ResultBanner.jsx
// Reads: window.React
// Writes: window.ResultBanner, window.ResultLine (legacy alias)

function ResultBanner({ msg }) {
  const secs = (msg.parsed.durationMs / 1000).toFixed(1);
  return (
    <div className="result-line">
      <span className="ok-dot" />
      完成 · {secs}s · 用了 {msg.parsed.tools} 个工具
    </div>
  );
}

window.ResultBanner = ResultBanner;
// legacy alias for any code still calling ResultLine
window.ResultLine = ResultBanner;
