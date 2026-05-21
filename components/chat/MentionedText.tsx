import { Fragment } from "react";

interface MentionedTextProps {
  text: string;
}

const MENTION_RE = /(@[a-z][a-z0-9_-]*)/gi;

/**
 * Renders chat text with @mentions as inline chips. The chip uses
 * `currentColor` for the border + a translucent matching fill so it
 * reads correctly on BOTH white agent surfaces and the soft-blue user
 * bubble (white text). No hard-coded background that would punch a
 * pale rectangle through the bubble color.
 */
export function MentionedText({ text }: MentionedTextProps) {
  return (
    <>
      {text.split(MENTION_RE).map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={i}
              className="mention-pill inline-flex items-baseline px-[5px] py-px mx-[1px] rounded-md text-[0.92em] font-semibold align-baseline"
              style={{
                background: "color-mix(in srgb, currentColor 14%, transparent)",
                color: "currentColor",
              }}
            >
              <span aria-hidden style={{ opacity: 0.72, marginRight: 1 }}>
                @
              </span>
              {part.slice(1)}
            </span>
          );
        }
        return part.split("\n").map((line, li) =>
          li === 0
            ? <Fragment key={`${i}-${li}`}>{line}</Fragment>
            : <Fragment key={`${i}-${li}`}><br />{line}</Fragment>
        );
      })}
    </>
  );
}
