import type {
  Board,
  ChecklistItem,
  Column,
  FocusSession,
  Profile,
  Task,
} from '@/types/orbit';
import type { Database } from './types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type BoardRow = Database['public']['Tables']['boards']['Row'];
type ColumnRow = Database['public']['Tables']['columns']['Row'];
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type ChecklistItemRow = Database['public']['Tables']['checklist_items']['Row'];
type FocusSessionRow = Database['public']['Tables']['focus_sessions']['Row'];

/**
 * Maps a profiles table row (snake_case) to the Profile model (camelCase).
 */
export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    tier: row.tier,
    aiMonthlyGenerations: row.ai_monthly_generations,
    maxAiGenerations: row.max_ai_generations,
    createdAt: row.created_at,
  };
}

/**
 * Maps a boards table row (snake_case) to the Board model (camelCase).
 */
export function mapBoardRow(row: BoardRow): Board {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    emoji: row.emoji,
    colorTheme: row.color_theme,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/**
 * Maps a columns table row (snake_case) to the Column model (camelCase).
 */
export function mapColumnRow(row: ColumnRow): Column {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/**
 * Maps a tasks table row (snake_case) to the Task model (camelCase).
 */
export function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    columnId: row.column_id,
    boardId: row.board_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/**
 * Maps a checklist_items table row (snake_case) to the ChecklistItem model (camelCase).
 */
export function mapChecklistItemRow(row: ChecklistItemRow): ChecklistItem {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    isCompleted: row.is_completed,
    sortOrder: row.sort_order,
  };
}

/**
 * Maps a focus_sessions table row (snake_case) to the FocusSession model (camelCase).
 */
export function mapFocusSessionRow(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    durationMinutes: row.duration_minutes,
    completedAt: row.completed_at,
  };
}
