import { create } from "zustand";
import type {
  Board,
  Column,
  Task,
  ChecklistItem,
  UUID,
  Priority,
  GenerateBoardResponse,
  TaskDragEndPayload,
} from "@/types/orbit";
import { createClient } from "@/lib/supabase/client";

function getBrowserSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}
import {
  moveTask as apiMoveTask,
  updateTask as apiUpdateTask,
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  addChecklistItem as apiAddChecklistItem,
  addChecklistItemsBatch as apiAddChecklistItemsBatch,
  toggleChecklistItem as apiToggleChecklistItem,
  deleteChecklistItem as apiDeleteChecklistItem,
} from "@/lib/supabase/helpers";

export interface BoardTask extends Task {
  category: string;
  ownerInitials: string;
  ownerName: string;
}

export interface BoardStore {
  board: Board | null;
  columns: Column[];
  tasks: BoardTask[];
  checklistMap: Record<UUID, ChecklistItem[]>;

  // Filters & View State
  searchQuery: string;
  selectedCategory: string;
  viewMode: "board" | "list";
  toast: string | null;
  isLoading: boolean;

  // Actions
  setBoard: (board: Board | null) => void;
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: BoardTask[]) => void;
  setChecklistMap: (map: Record<UUID, ChecklistItem[]>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setViewMode: (mode: "board" | "list") => void;
  setToast: (toast: string | null) => void;

  // Task Mutations
  moveTaskOptimistic: (payload: TaskDragEndPayload) => Promise<void>;
  moveTaskManual: (taskId: UUID, direction: -1 | 1) => Promise<void>;
  addTask: (columnId: UUID, title?: string, category?: string) => Promise<UUID>;
  updateTask: (taskId: UUID, patch: Partial<BoardTask>) => Promise<void>;
  deleteTask: (taskId: UUID) => Promise<void>;

  // Checklist Mutations
  toggleChecklistItem: (taskId: UUID, itemId: UUID) => Promise<void>;
  addChecklistItem: (taskId: UUID, title: string) => Promise<void>;
  addChecklistItemsBatch: (taskId: UUID, titles: string[]) => Promise<void>;
  deleteChecklistItem: (taskId: UUID, itemId: UUID) => Promise<void>;

  // AI Board Creation
  applyAiBoardDraft: (draft: GenerateBoardResponse) => void;
}

// Canonical stages and initial data from docs/reference/ZankaiOrbitDashboard.tsx
export const DEFAULT_COLUMNS: Column[] = [
  { id: "col-ideas", boardId: "board-default", title: "Ideas", sortOrder: 0, createdAt: new Date().toISOString() },
  { id: "col-up-next", boardId: "board-default", title: "Up Next", sortOrder: 1, createdAt: new Date().toISOString() },
  { id: "col-in-motion", boardId: "board-default", title: "In Motion", sortOrder: 2, createdAt: new Date().toISOString() },
  { id: "col-waiting", boardId: "board-default", title: "Waiting", sortOrder: 3, createdAt: new Date().toISOString() },
  { id: "col-complete", boardId: "board-default", title: "Complete", sortOrder: 4, createdAt: new Date().toISOString() },
];

export const STAGE_SYMBOLS: Record<string, string> = {
  Ideas: "✳",
  "Up Next": "◯",
  "In Motion": "◐",
  Waiting: "◈",
  Complete: "✓",
};

export const INITIAL_TASKS: BoardTask[] = [
  {
    id: "task-1",
    columnId: "col-ideas",
    boardId: "board-default",
    userId: "user-mc",
    title: "Plan spring campaign",
    description: "Bring the spring launch together with a clear message, a simple rollout plan, and useful creative assets.",
    priority: "high",
    dueDate: "2026-05-08T12:00:00.000Z",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    category: "Marketing",
    ownerInitials: "MC",
    ownerName: "Maya Chen",
  },
  {
    id: "task-2",
    columnId: "col-ideas",
    boardId: "board-default",
    userId: "user-al",
    title: "Team retreat ideas",
    description: "Collect ideas for a relaxed team retreat that gives everyone time to connect.",
    priority: "medium",
    dueDate: "2026-05-14T12:00:00.000Z",
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    category: "People",
    ownerInitials: "AL",
    ownerName: "Avery Lee",
  },
  {
    id: "task-3",
    columnId: "col-ideas",
    boardId: "board-default",
    userId: "user-sk",
    title: "Refresh welcome kit",
    description: "Make the new teammate welcome kit feel warm, useful, and easy to follow.",
    priority: "low",
    dueDate: "2026-05-21T12:00:00.000Z",
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    category: "Operations",
    ownerInitials: "SK",
    ownerName: "Sam Kim",
  },
  {
    id: "task-4",
    columnId: "col-up-next",
    boardId: "board-default",
    userId: "user-al",
    title: "Finalize event schedule",
    description: "Confirm the event timeline, speakers, and room assignments.",
    priority: "high",
    dueDate: "2026-05-04T12:00:00.000Z",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    category: "Events",
    ownerInitials: "AL",
    ownerName: "Avery Lee",
  },
  {
    id: "task-5",
    columnId: "col-up-next",
    boardId: "board-default",
    userId: "user-mc",
    title: "Draft monthly newsletter",
    description: "Share the latest updates, helpful stories, and upcoming events with the community.",
    priority: "medium",
    dueDate: "2026-05-06T12:00:00.000Z",
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    category: "Marketing",
    ownerInitials: "MC",
    ownerName: "Maya Chen",
  },
  {
    id: "task-6",
    columnId: "col-up-next",
    boardId: "board-default",
    userId: "user-sk",
    title: "Prepare Q3 goals",
    description: "Turn team priorities into a focused set of goals for the next quarter.",
    priority: "medium",
    dueDate: "2026-05-12T12:00:00.000Z",
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    category: "Planning",
    ownerInitials: "SK",
    ownerName: "Sam Kim",
  },
  {
    id: "task-7",
    columnId: "col-in-motion",
    boardId: "board-default",
    userId: "user-mc",
    title: "Launch community workshop",
    description: "Bring the next community workshop to life. Coordinate the venue, invite list, and attendee experience.",
    priority: "high",
    dueDate: "2026-05-03T12:00:00.000Z",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    category: "Events",
    ownerInitials: "MC",
    ownerName: "Maya Chen",
  },
  {
    id: "task-8",
    columnId: "col-in-motion",
    boardId: "board-default",
    userId: "user-al",
    title: "Update brand guidelines",
    description: "Make the brand guide easier for everyone to use across presentations and social content.",
    priority: "medium",
    dueDate: "2026-05-09T12:00:00.000Z",
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    category: "Design",
    ownerInitials: "AL",
    ownerName: "Avery Lee",
  },
  {
    id: "task-9",
    columnId: "col-waiting",
    boardId: "board-default",
    userId: "user-sk",
    title: "Review budget proposal",
    description: "Review the proposed budget and collect final approvals.",
    priority: "high",
    dueDate: "2026-05-05T12:00:00.000Z",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    category: "Finance",
    ownerInitials: "SK",
    ownerName: "Sam Kim",
  },
  {
    id: "task-10",
    columnId: "col-waiting",
    boardId: "board-default",
    userId: "user-mc",
    title: "Approve homepage copy",
    description: "Review the updated homepage message for clarity and tone.",
    priority: "medium",
    dueDate: "2026-05-07T12:00:00.000Z",
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    category: "Marketing",
    ownerInitials: "MC",
    ownerName: "Maya Chen",
  },
  {
    id: "task-11",
    columnId: "col-complete",
    boardId: "board-default",
    userId: "user-al",
    title: "Organize customer interviews",
    description: "Schedule customer interviews and prepare discussion prompts.",
    priority: "medium",
    dueDate: "2026-04-29T12:00:00.000Z",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    category: "Research",
    ownerInitials: "AL",
    ownerName: "Avery Lee",
  },
  {
    id: "task-12",
    columnId: "col-complete",
    boardId: "board-default",
    userId: "user-mc",
    title: "Publish April recap",
    description: "Share a friendly recap of the team's work and highlights.",
    priority: "low",
    dueDate: "2026-04-30T12:00:00.000Z",
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    category: "Marketing",
    ownerInitials: "MC",
    ownerName: "Maya Chen",
  },
];

export const INITIAL_CHECKLISTS: Record<UUID, ChecklistItem[]> = {
  "task-1": [
    { id: "step-1-1", taskId: "task-1", title: "Choose campaign theme", isCompleted: true, sortOrder: 0 },
    { id: "step-1-2", taskId: "task-1", title: "Outline key messages", isCompleted: false, sortOrder: 1 },
    { id: "step-1-3", taskId: "task-1", title: "Gather visual references", isCompleted: false, sortOrder: 2 },
  ],
  "task-2": [
    { id: "step-2-1", taskId: "task-2", title: "Collect suggestions", isCompleted: false, sortOrder: 0 },
    { id: "step-2-2", taskId: "task-2", title: "Shortlist locations", isCompleted: false, sortOrder: 1 },
    { id: "step-2-3", taskId: "task-2", title: "Share options with team", isCompleted: false, sortOrder: 2 },
  ],
  "task-3": [
    { id: "step-3-1", taskId: "task-3", title: "Review current kit", isCompleted: false, sortOrder: 0 },
    { id: "step-3-2", taskId: "task-3", title: "Update checklist", isCompleted: false, sortOrder: 1 },
  ],
  "task-4": [
    { id: "step-4-1", taskId: "task-4", title: "Confirm speakers", isCompleted: true, sortOrder: 0 },
    { id: "step-4-2", taskId: "task-4", title: "Set session times", isCompleted: true, sortOrder: 1 },
    { id: "step-4-3", taskId: "task-4", title: "Send final schedule", isCompleted: false, sortOrder: 2 },
    { id: "step-4-4", taskId: "task-4", title: "Prepare run of show", isCompleted: false, sortOrder: 3 },
  ],
  "task-5": [
    { id: "step-5-1", taskId: "task-5", title: "Collect stories", isCompleted: true, sortOrder: 0 },
    { id: "step-5-2", taskId: "task-5", title: "Draft copy", isCompleted: false, sortOrder: 1 },
    { id: "step-5-3", taskId: "task-5", title: "Choose imagery", isCompleted: false, sortOrder: 2 },
  ],
  "task-6": [
    { id: "step-6-1", taskId: "task-6", title: "Review last quarter", isCompleted: false, sortOrder: 0 },
    { id: "step-6-2", taskId: "task-6", title: "Gather team input", isCompleted: false, sortOrder: 1 },
    { id: "step-6-3", taskId: "task-6", title: "Draft goals", isCompleted: false, sortOrder: 2 },
  ],
  "task-7": [
    { id: "step-7-1", taskId: "task-7", title: "Confirm venue and host", isCompleted: true, sortOrder: 0 },
    { id: "step-7-2", taskId: "task-7", title: "Publish registration page", isCompleted: true, sortOrder: 1 },
    { id: "step-7-3", taskId: "task-7", title: "Send invitations", isCompleted: true, sortOrder: 2 },
    { id: "step-7-4", taskId: "task-7", title: "Prepare materials", isCompleted: false, sortOrder: 3 },
  ],
  "task-8": [
    { id: "step-8-1", taskId: "task-8", title: "Audit existing guide", isCompleted: true, sortOrder: 0 },
    { id: "step-8-2", taskId: "task-8", title: "Refresh examples", isCompleted: true, sortOrder: 1 },
    { id: "step-8-3", taskId: "task-8", title: "Review with team", isCompleted: false, sortOrder: 2 },
    { id: "step-8-4", taskId: "task-8", title: "Publish update", isCompleted: false, sortOrder: 3 },
  ],
  "task-9": [
    { id: "step-9-1", taskId: "task-9", title: "Check allocations", isCompleted: true, sortOrder: 0 },
    { id: "step-9-2", taskId: "task-9", title: "Ask for feedback", isCompleted: true, sortOrder: 1 },
    { id: "step-9-3", taskId: "task-9", title: "Record approval", isCompleted: false, sortOrder: 2 },
  ],
  "task-10": [
    { id: "step-10-1", taskId: "task-10", title: "Review draft", isCompleted: true, sortOrder: 0 },
    { id: "step-10-2", taskId: "task-10", title: "Leave comments", isCompleted: true, sortOrder: 1 },
    { id: "step-10-3", taskId: "task-10", title: "Approve final copy", isCompleted: false, sortOrder: 2 },
  ],
  "task-11": [
    { id: "step-11-1", taskId: "task-11", title: "Choose participants", isCompleted: true, sortOrder: 0 },
    { id: "step-11-2", taskId: "task-11", title: "Book sessions", isCompleted: true, sortOrder: 1 },
    { id: "step-11-3", taskId: "task-11", title: "Prepare prompts", isCompleted: true, sortOrder: 2 },
  ],
  "task-12": [
    { id: "step-12-1", taskId: "task-12", title: "Collect highlights", isCompleted: true, sortOrder: 0 },
    { id: "step-12-2", taskId: "task-12", title: "Write recap", isCompleted: true, sortOrder: 1 },
    { id: "step-12-3", taskId: "task-12", title: "Publish", isCompleted: true, sortOrder: 2 },
  ],
};

export const useBoardStore = create<BoardStore>((set, get) => ({
  board: {
    id: "board-default",
    userId: "user-mc",
    title: "Northstar Team",
    emoji: "🚀",
    colorTheme: "blue",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  },
  columns: DEFAULT_COLUMNS,
  tasks: INITIAL_TASKS,
  checklistMap: INITIAL_CHECKLISTS,

  searchQuery: "",
  selectedCategory: "All",
  viewMode: "board",
  toast: null,
  isLoading: false,

  setBoard: (board) => set({ board }),
  setColumns: (columns) => set({ columns }),
  setTasks: (tasks) => set({ tasks }),
  setChecklistMap: (checklistMap) => set({ checklistMap }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setViewMode: (viewMode) => set({ viewMode }),
  setToast: (toast) => set({ toast }),

  moveTaskOptimistic: async (payload) => {
    const { source, destination, draggableId } = payload;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const { tasks } = get();
    const oldTasks = [...tasks];

    // Separate tasks in source and target columns
    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    const sourceTasks = tasks
      .filter((t) => t.columnId === sourceColId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const movedTask = sourceTasks.find((t) => t.id === draggableId);
    if (!movedTask) return;

    let updatedTasks: BoardTask[] = [];

    if (sourceColId === destColId) {
      // Reordering within the same column
      const reordered = [...sourceTasks];
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);

      const reorderedWithOrder = reordered.map((t, idx) => ({ ...t, sortOrder: idx }));

      updatedTasks = tasks.map((t) => {
        const found = reorderedWithOrder.find((item) => item.id === t.id);
        return found ?? t;
      });
    } else {
      // Moving across columns
      const destTasks = tasks
        .filter((t) => t.columnId === destColId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const newSource = sourceTasks.filter((t) => t.id !== draggableId).map((t, idx) => ({ ...t, sortOrder: idx }));
      const newDest = [...destTasks];
      newDest.splice(destination.index, 0, { ...movedTask, columnId: destColId });
      const newDestWithOrder = newDest.map((t, idx) => ({ ...t, sortOrder: idx }));

      updatedTasks = tasks.map((t) => {
        if (t.id === draggableId) {
          return { ...movedTask, columnId: destColId, sortOrder: destination.index };
        }
        const fromSource = newSource.find((item) => item.id === t.id);
        if (fromSource) return fromSource;
        const fromDest = newDestWithOrder.find((item) => item.id === t.id);
        if (fromDest) return fromDest;
        return t;
      });
    }

    set({ tasks: updatedTasks });

    // Attempt persistence via Supabase helper if configured
    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiMoveTask(supabase, {
          taskId: draggableId,
          targetColumnId: destColId,
          newSortOrder: destination.index,
          affectedTasks: updatedTasks
            .filter((t) => t.columnId === destColId || t.columnId === sourceColId)
            .map((t) => ({ id: t.id, sortOrder: t.sortOrder })),
        });
      }
    } catch {
      // Keep optimistic client state intact if offline/preview
    }
  },

  moveTaskManual: async (taskId, direction) => {
    const { tasks, columns } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentColumnIndex = columns.findIndex((c) => c.id === task.columnId);
    if (currentColumnIndex < 0) return;

    const targetColumnIndex = currentColumnIndex + direction;
    if (targetColumnIndex < 0 || targetColumnIndex >= columns.length) return;

    const targetColumn = columns[targetColumnIndex];
    const targetColTasks = tasks.filter((t) => t.columnId === targetColumn.id);

    const payload: TaskDragEndPayload = {
      draggableId: taskId,
      type: "TASK",
      reason: "DROP",
      source: { droppableId: task.columnId, index: task.sortOrder },
      destination: { droppableId: targetColumn.id, index: targetColTasks.length },
    };

    await get().moveTaskOptimistic(payload);
  },

  addTask: async (columnId, title = "New task", category = "Personal") => {
    const { tasks, board } = get();
    const newId = `task-${Date.now()}`;
    const colTasks = tasks.filter((t) => t.columnId === columnId);

    const newTask: BoardTask = {
      id: newId,
      columnId,
      boardId: board?.id ?? "board-default",
      userId: board?.userId ?? "user-mc",
      title: title.trim(),
      description: "Add a few details to get started.",
      priority: "medium",
      dueDate: "No date",
      sortOrder: colTasks.length,
      createdAt: new Date().toISOString(),
      category,
      ownerInitials: "MC",
      ownerName: "Maya Chen",
    };

    const initialSteps: ChecklistItem[] = [
      { id: `step-${newId}-1`, taskId: newId, title: "Add first step", isCompleted: false, sortOrder: 0 },
    ];

    set((state) => ({
      tasks: [...state.tasks, newTask],
      checklistMap: { ...state.checklistMap, [newId]: initialSteps },
      toast: "Task added",
    }));

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiCreateTask(supabase, {
          boardId: newTask.boardId,
          columnId: newTask.columnId,
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          sortOrder: newTask.sortOrder,
        });
      }
    } catch {
      // Client optimistic preview succeeds
    }

    return newId;
  },

  updateTask: async (taskId, patch) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    }));

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiUpdateTask(supabase, taskId, {
          title: patch.title,
          description: patch.description,
          priority: patch.priority,
          columnId: patch.columnId,
          sortOrder: patch.sortOrder,
          dueDate: patch.dueDate,
        });
      }
    } catch {
      // Local optimistic state preserved
    }
  },

  deleteTask: async (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      toast: "Task deleted",
    }));

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiDeleteTask(supabase, taskId);
      }
    } catch {
      // Ignored in preview
    }
  },

  toggleChecklistItem: async (taskId, itemId) => {
    const { checklistMap } = get();
    const items = checklistMap[taskId] ?? [];
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const nextCompleted = !item.isCompleted;
    const updated = items.map((i) => (i.id === itemId ? { ...i, isCompleted: nextCompleted } : i));

    set({
      checklistMap: { ...checklistMap, [taskId]: updated },
    });

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiToggleChecklistItem(supabase, itemId, nextCompleted);
      }
    } catch {
      // Optimistic update retained
    }
  },

  addChecklistItem: async (taskId, title) => {
    if (!title.trim()) return;
    const { checklistMap } = get();
    const items = checklistMap[taskId] ?? [];
    const newItem: ChecklistItem = {
      id: `step-${Date.now()}`,
      taskId,
      title: title.trim(),
      isCompleted: false,
      sortOrder: items.length,
    };

    set({
      checklistMap: { ...checklistMap, [taskId]: [...items, newItem] },
    });

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiAddChecklistItem(supabase, {
          taskId,
          title: newItem.title,
          sortOrder: newItem.sortOrder,
        });
      }
    } catch {
      // Optimistic update retained
    }
  },

  addChecklistItemsBatch: async (taskId, titles) => {
    if (titles.length === 0) return;
    const { checklistMap } = get();
    const existing = checklistMap[taskId] ?? [];
    const newItems: ChecklistItem[] = titles.map((title, idx) => ({
      id: `step-${Date.now()}-${idx}`,
      taskId,
      title: title.trim(),
      isCompleted: false,
      sortOrder: existing.length + idx,
    }));

    set({
      checklistMap: { ...checklistMap, [taskId]: [...existing, ...newItems] },
      toast: "Next steps added",
    });

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiAddChecklistItemsBatch(supabase, taskId, titles);
      }
    } catch {
      // Optimistic update retained
    }
  },

  deleteChecklistItem: async (taskId, itemId) => {
    const { checklistMap } = get();
    const items = checklistMap[taskId] ?? [];
    const updated = items.filter((i) => i.id !== itemId);

    set({
      checklistMap: { ...checklistMap, [taskId]: updated },
    });

    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await apiDeleteChecklistItem(supabase, itemId);
      }
    } catch {
      // Optimistic update retained
    }
  },

  applyAiBoardDraft: (draft) => {
    const { columns } = get();
    const newTasks: BoardTask[] = [];
    const newChecklistMap: Record<UUID, ChecklistItem[]> = {};

    draft.tasks.forEach((genTask, idx) => {
      const col = columns.find(
        (c) => c.title.toLowerCase().trim() === genTask.column.toLowerCase().trim()
      ) ?? columns[0];

      const taskId = `ai-task-${Date.now()}-${idx}`;
      newTasks.push({
        id: taskId,
        columnId: col.id,
        boardId: "board-default",
        userId: "user-mc",
        title: genTask.title,
        description: genTask.description,
        priority: genTask.priority,
        dueDate: genTask.dueDate ?? "Tomorrow",
        sortOrder: idx,
        createdAt: new Date().toISOString(),
        category: "Goals",
        ownerInitials: "MC",
        ownerName: "Maya Chen",
      });

      if (genTask.checklist && genTask.checklist.length > 0) {
        newChecklistMap[taskId] = genTask.checklist.map((step, sIdx) => ({
          id: `step-${taskId}-${sIdx}`,
          taskId,
          title: step,
          isCompleted: false,
          sortOrder: sIdx,
        }));
      }
    });

    set((state) => ({
      board: state.board ? { ...state.board, title: draft.title, emoji: draft.emoji } : null,
      tasks: newTasks,
      checklistMap: newChecklistMap,
      toast: `Generated board: "${draft.title}"`,
    }));
  },
}));
