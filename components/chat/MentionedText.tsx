import { Fragment } from "react";

interface MentionedTextProps {
  text: string;
}

const MENTION_RE = /(@[a-z][a-z0-9_-]*)/gi;

export function MentionedText({ text }: MentionedTextProps) {
  return (
    <>
      {text.split(MENTION_RE).map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={i}
              className="mention-pill inline-flex items-center gap-1 px-1.5 py-0 mx-0.5 border-[1.5px] border-ink-0 bg-paper-1 rounded-sm text-xs font-bold"
            >
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
