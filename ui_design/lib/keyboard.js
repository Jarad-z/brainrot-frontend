// ui_design/lib/keyboard.js
// Keyboard helpers — pure JS. Writes window.BR_LIB.keyboard.

(function () {
  const ENTER = "Enter";
  const TAB = "Tab";
  const ESC = "Escape";
  const ARROW_UP = "ArrowUp";
  const ARROW_DOWN = "ArrowDown";
  const BACKSPACE = "Backspace";

  /**
   * Returns true if the event represents Ctrl+Enter or Cmd+Enter.
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  function isSubmitChord(e) {
    return e.key === ENTER && (e.ctrlKey || e.metaKey);
  }

  /**
   * Cycle an index forward by N items, looping (0..n-1).
   * @param {number} i
   * @param {number} delta
   * @param {number} n
   * @returns {number}
   */
  function cycle(i, delta, n) {
    if (n === 0) return 0;
    return ((i + delta) % n + n) % n;
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.keyboard = { ENTER, TAB, ESC, ARROW_UP, ARROW_DOWN, BACKSPACE, isSubmitChord, cycle };
})();
