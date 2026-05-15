// ui_design/lib/codec.js
// Pure JS — no React, no JSX. Loaded as a plain <script>.
// Reads from: nothing. Writes to: window.BR_LIB.codec.

(function () {
  /**
   * Error class for base64+JSON decode failures. Carries the offending input.
   */
  class CodecError extends Error {
    /**
     * @param {string} message
     * @param {string} rawInput
     */
    constructor(message, rawInput) {
      super(message);
      this.name = "CodecError";
      this.rawInput = rawInput;
    }
  }

  /**
   * Decode a base64 string into JSON. The wire format used across the backend
   * encodes message.content / message.metadata / agent.custom_env etc. this way.
   *
   * @param {string} b64
   * @returns {unknown}
   * @throws {CodecError} if base64 is malformed or contents are not valid JSON.
   */
  function decodeJSON(b64) {
    if (typeof b64 !== "string") {
      throw new CodecError("expected string", String(b64));
    }
    let raw;
    try {
      raw = atob(b64);
    } catch (e) {
      throw new CodecError("invalid base64: " + (e && e.message), b64);
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      throw new CodecError("invalid JSON: " + (e && e.message), b64);
    }
  }

  /**
   * Encode a JS value to base64 JSON. Convenience inverse used by mock data.
   * @param {unknown} value
   * @returns {string}
   */
  function encodeJSON(value) {
    return btoa(JSON.stringify(value));
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.codec = { decodeJSON, encodeJSON, CodecError };
})();
