"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Settings2 } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { StatusIndicator } from "./status-indicator";
import { WorkspaceSelector, type WorkspaceItem } from "./workspace-selector";
import { UserNav } from "./user-nav";

interface HeaderProps {
  currentWorkspace?: WorkspaceItem;
  workspaces?: WorkspaceItem[];
  user?: {
    name?: string | null;
    email?: string | null;
    initials?: string;
    tier?: "free" | "pro";
    roleTitle?: string;
  };
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

export function Header({
  currentWorkspace,
  workspaces,
  user,
  onNotificationClick,
  onSettingsClick,
}: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const settingsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  return (
    <header className="topbar">
      <div className="top-left">
        <Link href="/" className="brand">
          <span className="brand-mark">✦</span>
          <span>ZANKAI <span>ORBIT</span></span>
        </Link>

        <span className="divider" />

        <WorkspaceSelector
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
        />

        <StatusIndicator label="Orbit Live" />
      </div>

      <div className="top-right">
        <ThemeToggle />

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          onClick={() => {
            onNotificationClick?.();
          }}
        >
          <Bell size={16} />
        </button>

        <div className="relative" ref={settingsRef}>
          <button
            className="icon-button"
            aria-label="Settings"
            aria-expanded={settingsOpen}
            onClick={() => {
              setSettingsOpen(!settingsOpen);
              onSettingsClick?.();
            }}
          >
            <Settings2 size={16} />
          </button>

          {settingsOpen && (
            <div className="dropdown">
              <button onClick={() => setSettingsOpen(false)}>Profile</button>
              <button onClick={() => setSettingsOpen(false)}>
                Workspace settings
              </button>
            </div>
          )}
        </div>

        <UserNav user={user} />
      </div>
    </header>
  );
}
