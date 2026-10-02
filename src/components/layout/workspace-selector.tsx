"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface WorkspaceItem {
  id: string;
  title: string;
  iconLetter: string;
}

interface WorkspaceSelectorProps {
  currentWorkspace?: WorkspaceItem;
  workspaces?: WorkspaceItem[];
  onSelect?: (workspace: WorkspaceItem) => void;
}

const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  { id: "ws-1", title: "Northstar Team", iconLetter: "N" },
  { id: "ws-2", title: "Productivity Launchpad", iconLetter: "P" },
  { id: "ws-3", title: "Creative Goals", iconLetter: "C" },
];

export function WorkspaceSelector({
  currentWorkspace = DEFAULT_WORKSPACES[0],
  workspaces = DEFAULT_WORKSPACES,
  onSelect,
}: WorkspaceSelectorProps) {
  const [workspaceOpen, setWorkspaceOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<WorkspaceItem>(currentWorkspace);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setWorkspaceOpen(false);
      }
    }
    if (workspaceOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [workspaceOpen]);

  const handleChoose = (ws: WorkspaceItem) => {
    setSelected(ws);
    setWorkspaceOpen(false);
    onSelect?.(ws);
  };

  return (
    <div className="relative workspace-wrap" ref={dropdownRef}>
      <button
        className="workspace"
        aria-expanded={workspaceOpen}
        onClick={() => setWorkspaceOpen(!workspaceOpen)}
      >
        <span className="workspace-icon">{selected.iconLetter}</span>
        <span className="workspace-name">{selected.title}</span>
        <ChevronDown size={13} />
      </button>

      {workspaceOpen && (
        <div className="dropdown align-left">
          {workspaces.map((ws) => (
            <button key={ws.id} onClick={() => handleChoose(ws)}>
              {selected.id === ws.id ? "✓ " : ""}
              {ws.title}
            </button>
          ))}
          <button
            onClick={() => {
              setWorkspaceOpen(false);
            }}
          >
            + Add workspace
          </button>
        </div>
      )}
    </div>
  );
}
