// ui_design/lib/mention-parse.js
// Pure JS. Reads: nothing. Writes: window.BR_LIB.mention.

(function () {
  /**
   * @typedef {{ id: string, handle: string, archived?: boolean }} Agent
   */

  /**
   * Filter agent candidates for the @mention popover.
   * Empty prefix returns all non-archived agents. Otherwise case-insensitive
   * prefix match against handle.
   *
   * @param {string} prefix         e.g. "wr" for `@wr`
   * @param {ReadonlyArray<Agent>} agents
   * @returns {Agent[]}
   */
  function filterCandidates(prefix, agents) {
    const p = (prefix || "").toLowerCase();
    return agents.filter(a => !a.archived).filter(a => a.handle.toLowerCase().startsWith(p));
  }

  /**
   * Parse a Composer raw text (with `@handle` literals) plus a mapping of
   * placed mention nodes into the API submit shape.
   *
   * @param {string} text                       text as the user sees it; mention chips
   *                                            contribute their `@<handle>` literal
   * @param {ReadonlyArray<{ id: string, handle: string }>} placedMentions
   *        the mentions that were committed via the popover, in click order
   * @returns {{ text: string, mentions: string[] }}
   */
  function parseSubmit(text, placedMentions) {
    const seen = new Set();
    const ids = [];
    for (const m of placedMentions) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      ids.push(m.id);
    }
    return { text, mentions: ids };
  }

  /**
   * Compute the `@`-prefix the user is currently typing, given the full Composer
   * text and the caret offset. Returns null if not inside a mention prefix.
   *
   * @param {string} text
   * @param {number} caret
   * @returns {string|null} the prefix WITHOUT the leading `@`, or null
   */
  function activePrefix(text, caret) {
    if (caret <= 0 || caret > text.length) return null;
    let i = caret - 1;
    while (i >= 0) {
      const ch = text[i];
      if (ch === "@") {
        // verify @ is at start or preceded by whitespace
        if (i === 0 || /\s/.test(text[i - 1])) {
          return text.slice(i + 1, caret);
        }
        return null;
      }
      if (/\s/.test(ch)) return null;
      i--;
    }
    return null;
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.mention = { filterCandidates, parseSubmit, activePrefix };
})();
