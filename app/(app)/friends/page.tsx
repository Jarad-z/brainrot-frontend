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
    <div className="y2k-page flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="y2k-hero">Friends</h1>
          <div className="y2k-hero-sub">your circle on brainrot</div>
        </div>
        <button
          type="button"
          className="y2k-btn y2k-btn-primary"
          onClick={() => setSearchOpen(true)}
        >
          + Add by email
        </button>
      </div>
      <nav className="y2k-tabs" role="tablist">
        {(["friends", "requests", "invitations", "blocked"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={"y2k-tab" + (tab === t ? " y2k-tab-active" : "")}
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
