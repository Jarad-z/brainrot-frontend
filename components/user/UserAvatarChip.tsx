import type { UserSummary } from "@/lib/api/types";

interface UserAvatarChipProps {
  user: Pick<UserSummary, "id" | "name" | "email" | "avatar_url">;
  size?: "sm" | "md";
  /** Opts into the Y2K candy-ball avatar treatment used on .y2k-page surfaces. */
  y2k?: boolean;
}

export function UserAvatarChip({ user, size = "md", y2k = false }: UserAvatarChipProps) {
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeCls =
    size === "sm" ? "h-6 w-6 text-xs" : "h-9 w-9 text-sm";
  const avatarCls = y2k
    ? `${sizeCls} flex items-center justify-center font-semibold overflow-hidden`
    : `${sizeCls} rounded-full bg-hairline flex items-center justify-center font-medium overflow-hidden`;
  const nameCls = y2k
    ? "text-[13px] font-bold text-[var(--y2k-fb-blue-deep,#1e3a72)]"
    : "text-sm font-medium";
  const emailCls = y2k
    ? "text-[11px] text-[#6c8acd] font-mono"
    : "text-xs text-ink-2";
  return (
    <div className="flex items-center gap-3">
      <div
        className={avatarCls}
        {...(y2k ? { "data-y2k-avatar": "true" } : {})}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span>{initials || "?"}</span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className={nameCls}>{user.name}</span>
        <span className={emailCls}>{user.email}</span>
      </div>
    </div>
  );
}
