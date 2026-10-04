"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/stores/timer-store";

export function useFocusTimer() {
  const {
    status,
    remainingSeconds,
    durationSeconds,
    taskId,
    taskTitle,
    startFocus,
    pauseFocus,
    resumeFocus,
    resetFocus,
    tick,
  } = useTimerStore();

  useEffect(() => {
    if (status !== "running") return;

    const interval = window.setInterval(() => {
      tick();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status, tick]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const clock = [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  return {
    status,
    remainingSeconds,
    durationSeconds,
    taskId,
    taskTitle,
    clock,
    isRunning: status === "running",
    isPaused: status === "paused",
    startFocus,
    pauseFocus,
    resumeFocus,
    resetFocus,
  };
}
