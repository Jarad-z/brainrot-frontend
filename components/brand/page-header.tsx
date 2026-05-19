"use client";

import { cn } from "@/lib/utils";

export type PageHeaderProps = React.HTMLAttributes<HTMLElement>;

export function PageHeader({ className, children, ...rest }: PageHeaderProps) {
  return (
    <header
      className={cn("flex items-end gap-4 mb-5 flex-wrap", className)}
      {...rest}
    >
      {children}
    </header>
  );
}

export type PageTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function PageTitle({ className, children, ...rest }: PageTitleProps) {
  return (
    <h1
      className={cn(
        "text-3xl font-extrabold text-ink-0 m-0 text-pretty page-title",
        className,
      )}
      {...rest}
    >
      {children}
    </h1>
  );
}

export type PageSubProps = React.HTMLAttributes<HTMLParagraphElement>;

export function PageSub({ className, children, ...rest }: PageSubProps) {
  return (
    <p
      className={cn("text-sm text-ink-2 font-medium m-0", className)}
      {...rest}
    >
      {children}
    </p>
  );
}
