"use client";

import { useState } from "react";
import { FriendsList } from "./_components/FriendsList";
import { RequestsList } from "./_components/RequestsList";
import { InvitationsList } from "./_components/InvitationsList";
import { BlockedList } from "./_components/BlockedList";
import { UserSearchDialog } from "@/components/user/UserSearchDialog";

type Tab = "friends" | "requests" | "invitations" | "blocked";

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("friends");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Friends</h1>
        <button
          className="rounded bg-ink-0 px-3 py-1.5 text-sm text-paper-0"
          onClick={() => setSearchOpen(true)}
        >
          Add by email
        </button>
      </div>
      <nav className="flex gap-4 border-b border-line">
        {(["friends", "requests", "invitations", "blocked"] as Tab[]).map((t) => (
          <button
            key={t}
            className={
              "pb-2 text-sm " +
              (tab === t ? "border-b-2 border-ink-0 font-medium" : "text-ink-2")
            }
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
      {tab === "friends" && <FriendsList />}
      {tab === "requests" && <RequestsList />}
      {tab === "invitations" && <InvitationsList />}
      {tab === "blocked" && <BlockedList />}
      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
