import { create } from "zustand";
import type { UUID } from "@/types/orbit";

export interface DrawerStore {
  selectedTaskId: UUID | null;
  isOpen: boolean;
  openTask: (taskId: UUID) => void;
  closeTask: () => void;
}

export const useDrawerStore = create<DrawerStore>((set) => ({
  selectedTaskId: null,
  isOpen: false,
  openTask: (taskId: UUID) => set({ selectedTaskId: taskId, isOpen: true }),
  closeTask: () => set({ selectedTaskId: null, isOpen: false }),
}));
