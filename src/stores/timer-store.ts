import { create } from "zustand";
import type { UUID, FocusTimerStatus } from "@/types/orbit";
import { createClient } from "@/lib/supabase/client";
import { logFocusSession } from "@/lib/supabase/helpers";

function getBrowserSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

export interface FocusTimerStore {
  status: FocusTimerStatus;
  durationSeconds: number;
  remainingSeconds: number;
  deadlineAt: string | null;
  taskId: UUID | null;
  taskTitle: string | null;
  sessionLogged: boolean;

  startFocus: (taskId: UUID | null, taskTitle?: string | null) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  resetFocus: () => void;
  tick: () => void;
  completeSession: () => Promise<void>;
}

const DEFAULT_DURATION = 1500; // 25 minutes

export const useTimerStore = create<FocusTimerStore>((set, get) => ({
  status: "idle",
  durationSeconds: DEFAULT_DURATION,
  remainingSeconds: DEFAULT_DURATION,
  deadlineAt: null,
  taskId: null,
  taskTitle: null,
  sessionLogged: false,

  startFocus: (taskId, taskTitle = null) => {
    const now = new Date();
    const deadline = new Date(now.getTime() + DEFAULT_DURATION * 1000).toISOString();
    set({
      status: "running",
      durationSeconds: DEFAULT_DURATION,
      remainingSeconds: DEFAULT_DURATION,
      deadlineAt: deadline,
      taskId: taskId ?? null,
      taskTitle: taskTitle ?? null,
      sessionLogged: false,
    });
  },

  pauseFocus: () => {
    const { status, remainingSeconds } = get();
    if (status !== "running") return;
    set({
      status: "paused",
      deadlineAt: null,
      remainingSeconds,
    });
  },

  resumeFocus: () => {
    const { status, remainingSeconds } = get();
    if (status !== "paused") return;
    const now = new Date();
    const deadline = new Date(now.getTime() + remainingSeconds * 1000).toISOString();
    set({
      status: "running",
      deadlineAt: deadline,
    });
  },

  resetFocus: () => {
    set({
      status: "idle",
      durationSeconds: DEFAULT_DURATION,
      remainingSeconds: DEFAULT_DURATION,
      deadlineAt: null,
      taskId: null,
      taskTitle: null,
      sessionLogged: false,
    });
  },

  tick: () => {
    const { status, deadlineAt } = get();
    if (status !== "running" || !deadlineAt) return;

    const now = Date.now();
    const target = new Date(deadlineAt).getTime();
    const diff = Math.max(0, Math.ceil((target - now) / 1000));

    if (diff <= 0) {
      set({ remainingSeconds: 0, status: "completed" });
      get().completeSession();
    } else {
      set({ remainingSeconds: diff });
    }
  },

  completeSession: async () => {
    const { sessionLogged, taskId } = get();
    if (sessionLogged) return;

    set({ sessionLogged: true });

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await logFocusSession(supabase, {
          taskId: taskId ?? null,
          durationMinutes: 25,
          completedAt: new Date().toISOString(),
        });
      }
    } catch {
      // If logging fails or throws, revert sessionLogged to false so future retries are possible
      set({ sessionLogged: false });
    }
  },
}));
