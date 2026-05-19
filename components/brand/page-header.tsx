"use client";

import { cn } from "@/lib/utils";

export type PageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  /** Editorial layout: title block on the left, actions on the right,
   *  enlarged vertical rhythm. Default keeps the previous compact look. */
  editorial?: boolean;
};

export function PageHeader({
  className,
  editorial,
  children,
  ...rest
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        editorial
          ? "flex items-end justify-between gap-6 mb-8 flex-wrap pb-5 border-b-[1.5px] border-hairline"
          : "flex items-end gap-4 mb-5 flex-wrap",
        className,
      )}
      {...rest}
    >
      {children}
    </header>
  );
}

export type PageTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /** Use the editorial serif display style (Noto Serif SC, 56px). */
  editorial?: boolean;
};

export function PageTitle({
  className,
  editorial,
  children,
  ...rest
}: PageTitleProps) {
  return (
    <h1
      className={cn(
        "m-0 text-pretty",
        editorial
          ? "editorial-title text-[clamp(40px,5vw,64px)] text-ink-0"
          : "text-3xl font-extrabold text-ink-0 page-title",
        className,
      )}
      {...rest}
    >
      {children}
    </h1>
  );
}

export type PageSubProps = React.HTMLAttributes<HTMLParagraphElement> & {
  editorial?: boolean;
};

export function PageSub({
  className,
  editorial,
  children,
  ...rest
}: PageSubProps) {
  return (
    <p
      className={cn(
        "m-0",
        editorial
          ? "editorial-deck mt-2"
          : "text-sm text-ink-2 font-medium",
        className,
      )}
      {...rest}
    >
      {children}
    </p>
  );
}

/** Container for the title + deck pair in editorial mode, so callers
 *  can drop actions to the right side. Pure layout, no semantics. */
export function PageHeaderTitleBlock({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col min-w-0", className)} {...rest}>
      {children}
    </div>
  );
}

/** Container for action buttons in editorial mode. */
export function PageHeaderActions({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 shrink-0", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
