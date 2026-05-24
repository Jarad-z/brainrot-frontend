import type { UserSummary } from "@/lib/api/types";

interface UserAvatarChipProps {
  user: Pick<UserSummary, "id" | "name" | "email" | "avatar_url">;
  size?: "sm" | "md";
}

export function UserAvatarChip({ user, size = "md" }: UserAvatarChipProps) {
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeCls =
    size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeCls} rounded-full bg-hairline flex items-center justify-center font-medium overflow-hidden`}
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
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-ink-2">{user.email}</span>
      </div>
    </div>
  );
}
