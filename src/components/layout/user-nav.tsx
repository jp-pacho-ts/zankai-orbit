"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface UserNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    initials?: string;
    tier?: "free" | "pro";
    roleTitle?: string;
  };
}

export function UserNav({
  user = {
    name: "Maya Chen",
    email: "maya@zankai.app",
    initials: "MC",
    tier: "free",
    roleTitle: "Workspace owner",
  },
}: UserNavProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const initials = user.initials || "MC";
  const tierDisplay = user.tier === "pro" ? "Pro Plan" : "Free Plan";

  return (
    <div className="relative" ref={menuRef}>
      <div
        className="profile"
        role="button"
        tabIndex={0}
        aria-expanded={menuOpen}
        aria-label="User profile options"
        onClick={() => setMenuOpen(!menuOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setMenuOpen(!menuOpen);
          }
        }}
      >
        <span className={`avatar ${initials}`} title={user.name || "User"}>
          {initials}
        </span>
        <span className="profile-meta">
          <strong>{user.name}</strong>
          <small>{user.roleTitle || "Workspace owner"} · {tierDisplay}</small>
        </span>
        <ChevronDown size={13} />
      </div>

      {menuOpen && (
        <div className="dropdown">
          <button onClick={() => setMenuOpen(false)}>Profile</button>
          <button onClick={() => setMenuOpen(false)}>Workspace settings</button>
          {user.tier !== "pro" && (
            <button
              onClick={() => setMenuOpen(false)}
              style={{ color: "var(--blue)", fontWeight: 700 }}
            >
              ✦ Upgrade to Pro
            </button>
          )}
          <button
            onClick={() => setMenuOpen(false)}
            style={{ color: "#c9544b" }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
