"use client";

import * as React from "react";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PromptBar } from "@/components/ai-bar/prompt-bar";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskDetailDrawer } from "@/components/drawer/task-detail-drawer";
import { FocusTimer } from "@/components/timer/focus-timer";
import { useOrbitBoard } from "@/hooks/use-orbit-board";

export default function HomePage() {
  const { toast, setToast, board } = useOrbitBoard();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [toast, setToast]);

  return (
    <>
      <Header
        currentWorkspace={{
          id: board?.id || "board-default",
          title: board?.title || "Northstar Team",
          iconLetter: (board?.title || "Northstar Team")[0].toUpperCase(),
        }}
        onNotificationClick={() => setToast("You're all caught up")}
      />

      <main className="main">
        {/* Universal AI Planning Bar */}
        <PromptBar />

        {/* 5-Column Kanban Board & List Switcher with Drag & Drop */}
        <KanbanBoard />
      </main>

      {/* Floating Focus Timer (Bottom-Center) */}
      <FocusTimer />

      {/* Right-Sliding Task Details Drawer */}
      <TaskDetailDrawer />

      {/* Toast Notification */}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
