"use client";

import * as React from "react";
import { useFocusTimer } from "@/hooks/use-focus-timer";
import { useBoardStore } from "@/stores/board-store";

export function FocusTimer() {
  const {
    status,
    clock,
    taskTitle,
    isRunning,
    isPaused,
    pauseFocus,
    resumeFocus,
    startFocus,
  } = useFocusTimer();

  const setToast = useBoardStore((s) => s.setToast);
  const tasks = useBoardStore((s) => s.tasks);

  const currentTitle = taskTitle || (tasks[0]?.title ?? "Personal Focus");

  const handleToggle = () => {
    if (isRunning) {
      pauseFocus();
      setToast("Focus session paused");
    } else if (isPaused) {
      resumeFocus();
      setToast("Focus session resumed");
    } else {
      startFocus(null, currentTitle);
      setToast("Focus session started");
    }
  };

  const isTimerActive = isRunning || isPaused;

  return (
    <aside
      className="focus-timer"
      role="region"
      aria-label="Pomodoro focus session timer"
    >
      <span className={`glow ${isRunning ? "" : "paused"}`} />
      <span className="focus-label">
        {isRunning ? "Focus:" : "Paused:"}{" "}
        <strong>{currentTitle}</strong>
      </span>
      <strong className="timer-clock">{clock}</strong>
      <button
        onClick={handleToggle}
        aria-label={isRunning ? "Pause focus session" : "Resume focus session"}
      >
        {isRunning ? "Pause focus" : isPaused ? "Resume focus" : "Start focus"}
      </button>
    </aside>
  );
}
