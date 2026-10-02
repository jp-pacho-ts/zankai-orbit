/**
 * T-001 shared contracts. Database helpers map SQL snake_case rows to these
 * camelCase shapes. This module has no server or UI dependencies.
 */
export type UUID = string;
export type ISODateTimeString = string;
export type CalendarDateString = string; // YYYY-MM-DD, without a timezone

export const DEFAULT_COLUMN_TITLES = [
  'Ideas',
  'Up Next',
  'In Motion',
  'Waiting',
  'Complete',
] as const;

export type DefaultColumnTitle = (typeof DEFAULT_COLUMN_TITLES)[number];
export type Priority = 'low' | 'medium' | 'high';
export type Tier = 'free' | 'pro';

export interface Profile {
  id: UUID;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  tier: Tier;
  aiMonthlyGenerations: number;
  maxAiGenerations: number;
  createdAt: ISODateTimeString;
}

export interface Board {
  id: UUID;
  userId: UUID;
  title: string;
  emoji: string;
  colorTheme: string;
  sortOrder: number;
  createdAt: ISODateTimeString;
}

export interface Column {
  id: UUID;
  boardId: UUID;
  title: string;
  sortOrder: number;
  createdAt: ISODateTimeString;
}

export interface Task {
  id: UUID;
  columnId: UUID;
  boardId: UUID;
  userId: UUID;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: ISODateTimeString | null;
  sortOrder: number;
  createdAt: ISODateTimeString;
}

export interface ChecklistItem {
  id: UUID;
  taskId: UUID;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface FocusSession {
  id: UUID;
  userId: UUID;
  taskId: UUID | null;
  durationMinutes: number;
  completedAt: ISODateTimeString;
}

/** POST /api/ai/generate-board: request from the signed-in user's prompt bar. */
export interface GenerateBoardRequest {
  prompt: string;
  theme?: string;
}

/** Model suggestion only. The database assigns IDs and column relationships. */
export interface GeneratedTask {
  title: string;
  description: string;
  column: DefaultColumnTitle;
  priority: Priority;
  checklist: string[];
  dueDate: CalendarDateString | null;
}

/** Successful POST /api/ai/generate-board response; no rows are persisted yet. */
export interface GenerateBoardResponse {
  title: string;
  emoji: string;
  colorTheme: string;
  tasks: GeneratedTask[];
}

/** POST /api/ai/breakdown-task; taskId is checked against the signed-in user. */
export interface BreakdownTaskRequest {
  taskId: UUID;
  taskTitle: string;
  taskDescription?: string;
}

export interface BreakdownTaskResponse {
  subtasks: Array<{ title: string }>;
  summary: string;
}

/** Only human-readable copy is sent on an API error. */
export interface OrbitApiError {
  message: string;
}

export interface ChecklistProgress {
  completed: number;
  total: number;
}

export interface TaskCardView {
  task: Task;
  checklistItems: ChecklistItem[];
  checklistProgress: ChecklistProgress;
  /** Presentation-only label derived from the board or column title. */
  categoryLabel: string;
  /** The signed-in board owner, not a persisted assignment. */
  owner: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface ColumnView {
  column: Column;
  tasks: TaskCardView[];
}

export interface BoardView {
  board: Board;
  columns: ColumnView[];
}

/** Structural subset of @hello-pangea/dnd DropResult. */
export interface DragLocation {
  droppableId: UUID; // column ID
  index: number; // zero-based position
}

export interface TaskDragEndPayload {
  draggableId: UUID; // task ID
  type: string; // use the TASK droppable type
  reason: 'DROP' | 'CANCEL';
  source: DragLocation;
  destination: DragLocation | null;
}

export interface TaskMove {
  taskId: UUID;
  fromColumnId: UUID;
  toColumnId: UUID;
  fromIndex: number;
  toIndex: number;
}

export type FocusTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface FocusTimerState {
  status: FocusTimerStatus;
  durationSeconds: number; // 1500 for the standard session
  remainingSeconds: number;
  /** Wall-clock deadline when running; null otherwise. */
  deadlineAt: ISODateTimeString | null;
  taskId: UUID | null;
  /** Guards duplicate session logging after a render or timer tick. */
  sessionLogged: boolean;
}

/** Authenticated client insert; userId is inferred, never supplied by the UI. */
export interface LogFocusSessionPayload {
  taskId: UUID | null;
  durationMinutes: 25;
  completedAt: ISODateTimeString;
}


