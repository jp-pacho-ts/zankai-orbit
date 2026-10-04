import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Board,
  BoardView,
  ChecklistItem,
  Column,
  ColumnView,
  FocusSession,
  GenerateBoardResponse,
  ISODateTimeString,
  LogFocusSessionPayload,
  Priority,
  Profile,
  Task,
  TaskCardView,
  UUID,
} from '@/types/orbit';
import {
  mapBoardRow,
  mapChecklistItemRow,
  mapColumnRow,
  mapFocusSessionRow,
  mapProfileRow,
  mapTaskRow,
} from './mappers';
import type { Database } from './types';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Retrieves the currently authenticated user from Supabase auth.
 */
export async function getCurrentUser(supabase: TypedSupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Retrieves the current user's profile.
 */
export async function getCurrentProfile(
  supabase: TypedSupabaseClient
): Promise<Profile | null> {
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfileRow(data);
}

/**
 * Calls the atomic SQL function consume_board_generation_quota().
 * Returns true if quota was available and incremented, false otherwise.
 */
export async function consumeBoardGenerationQuota(
  supabase: TypedSupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.rpc('consume_board_generation_quota');
  if (error) {
    console.error('Failed to consume board generation quota:', error.message);
    return false;
  }

  return Boolean(data);
}

/**
 * Fetches all boards owned by the authenticated user.
 */
export async function getUserBoards(
  supabase: TypedSupabaseClient
): Promise<Board[]> {
  const user = await getCurrentUser(supabase);
  if (!user) return [];

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to fetch user boards');
  }

  return data.map(mapBoardRow);
}

/**
 * Fetches all columns for a specific board.
 */
export async function getBoardColumns(
  supabase: TypedSupabaseClient,
  boardId: UUID
): Promise<Column[]> {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to fetch columns');
  }

  return data.map(mapColumnRow);
}

/**
 * Fetches a full board view including columns, tasks, checklist progress, and owner.
 */
export async function getBoardWithDetails(
  supabase: TypedSupabaseClient,
  boardId: UUID
): Promise<BoardView | null> {
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  // 1. Fetch board
  const { data: boardData, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single();

  if (boardError || !boardData) {
    return null;
  }

  const board = mapBoardRow(boardData);

  // 2. Fetch owner profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', board.userId)
    .single();

  const owner: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'> = {
    id: board.userId,
    displayName: profileData?.display_name ?? 'User',
    avatarUrl: profileData?.avatar_url ?? null,
  };

  // 3. Fetch columns
  const { data: columnsData, error: columnsError } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('sort_order', { ascending: true });

  if (columnsError || !columnsData) {
    throw new Error(columnsError?.message ?? 'Failed to fetch board columns');
  }

  const columns = columnsData.map(mapColumnRow);

  // 4. Fetch tasks
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('board_id', boardId)
    .order('sort_order', { ascending: true });

  if (tasksError || !tasksData) {
    throw new Error(tasksError?.message ?? 'Failed to fetch board tasks');
  }

  const tasks = tasksData.map(mapTaskRow);

  // 5. Fetch checklist items for all tasks
  const taskIds = tasks.map((t) => t.id);
  let checklistMap = new Map<string, ChecklistItem[]>();

  if (taskIds.length > 0) {
    const { data: checklistData, error: checklistError } = await supabase
      .from('checklist_items')
      .select('*')
      .in('task_id', taskIds)
      .order('sort_order', { ascending: true });

    if (checklistError) {
      throw new Error(checklistError.message);
    }

    if (checklistData) {
      for (const item of checklistData) {
        const mapped = mapChecklistItemRow(item);
        const existing = checklistMap.get(mapped.taskId) ?? [];
        existing.push(mapped);
        checklistMap.set(mapped.taskId, existing);
      }
    }
  }

  // 6. Assemble TaskCardView for each column
  const columnViews: ColumnView[] = columns.map((col) => {
    const colTasks = tasks.filter((t) => t.columnId === col.id);
    const taskCardViews: TaskCardView[] = colTasks.map((t) => {
      const items = checklistMap.get(t.id) ?? [];
      const completed = items.filter((i) => i.isCompleted).length;
      return {
        task: t,
        checklistItems: items,
        checklistProgress: {
          completed,
          total: items.length,
        },
        categoryLabel: board.title || col.title,
        owner,
      };
    });

    return {
      column: col,
      tasks: taskCardViews,
    };
  });

  return {
    board,
    columns: columnViews,
  };
}

/**
 * Creates a new board. The database trigger automatically creates the 5 default columns.
 */
export async function createBoard(
  supabase: TypedSupabaseClient,
  payload: {
    title: string;
    emoji?: string;
    colorTheme?: string;
  }
): Promise<Board> {
  const user = await getCurrentUser(supabase);
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('boards')
    .insert({
      user_id: user.id,
      title: payload.title.trim(),
      emoji: payload.emoji ?? '🚀',
      color_theme: payload.colorTheme ?? 'blue',
      sort_order: 0,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create board');
  }

  return mapBoardRow(data);
}

/**
 * Creates a board from an AI-generated draft response.
 * Follows the architecture contract: inserts board, uses trigger-created columns,
 * maps tasks to existing columns, and inserts tasks and checklist items.
 */
export async function createBoardFromDraft(
  supabase: TypedSupabaseClient,
  draft: GenerateBoardResponse
): Promise<{ board: Board; columns: Column[]; tasks: Task[] }> {
  // 1. Insert board (trigger will generate 5 columns)
  const board = await createBoard(supabase, {
    title: draft.title,
    emoji: draft.emoji,
    colorTheme: draft.colorTheme,
  });

  // 2. Fetch trigger-created columns
  const columns = await getBoardColumns(supabase, board.id);
  const columnMap = new Map<string, Column>();
  for (const col of columns) {
    columnMap.set(col.title.toLowerCase().trim(), col);
  }

  // 3. Insert generated tasks
  const createdTasks: Task[] = [];

  for (let i = 0; i < draft.tasks.length; i++) {
    const genTask = draft.tasks[i];
    const targetColumn =
      columnMap.get(genTask.column.toLowerCase().trim()) ?? columns[0];

    const task = await createTask(supabase, {
      boardId: board.id,
      columnId: targetColumn.id,
      title: genTask.title,
      description: genTask.description,
      priority: genTask.priority,
      dueDate: genTask.dueDate
        ? `${genTask.dueDate}T12:00:00.000Z`
        : null,
      sortOrder: i,
    });

    createdTasks.push(task);

    // 4. Insert checklist items if present
    if (genTask.checklist && genTask.checklist.length > 0) {
      await addChecklistItemsBatch(supabase, task.id, genTask.checklist);
    }
  }

  return {
    board,
    columns,
    tasks: createdTasks,
  };
}

/**
 * Updates an existing board.
 */
export async function updateBoard(
  supabase: TypedSupabaseClient,
  boardId: UUID,
  updates: Partial<Pick<Board, 'title' | 'emoji' | 'colorTheme' | 'sortOrder'>>
): Promise<Board> {
  const dbUpdates: Database['public']['Tables']['boards']['Update'] = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
  if (updates.colorTheme !== undefined) dbUpdates.color_theme = updates.colorTheme;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from('boards')
    .update(dbUpdates)
    .eq('id', boardId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update board');
  }

  return mapBoardRow(data);
}

/**
 * Deletes a board by ID.
 */
export async function deleteBoard(
  supabase: TypedSupabaseClient,
  boardId: UUID
): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', boardId);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Creates a new task.
 */
export async function createTask(
  supabase: TypedSupabaseClient,
  payload: {
    boardId: UUID;
    columnId: UUID;
    title: string;
    description?: string | null;
    priority?: Priority;
    dueDate?: ISODateTimeString | null;
    sortOrder?: number;
  }
): Promise<Task> {
  const user = await getCurrentUser(supabase);
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      board_id: payload.boardId,
      column_id: payload.columnId,
      user_id: user.id,
      title: payload.title.trim(),
      description: payload.description ?? null,
      priority: payload.priority ?? 'medium',
      due_date: payload.dueDate ?? null,
      sort_order: payload.sortOrder ?? 0,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create task');
  }

  return mapTaskRow(data);
}

/**
 * Updates an existing task.
 */
export async function updateTask(
  supabase: TypedSupabaseClient,
  taskId: UUID,
  updates: Partial<{
    title: string;
    description: string | null;
    priority: Priority;
    dueDate: ISODateTimeString | null;
    columnId: UUID;
    sortOrder: number;
  }>
): Promise<Task> {
  const dbUpdates: Database['public']['Tables']['tasks']['Update'] = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.columnId !== undefined) dbUpdates.column_id = updates.columnId;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update task');
  }

  return mapTaskRow(data);
}

/**
 * Deletes a task by ID.
 */
export async function deleteTask(
  supabase: TypedSupabaseClient,
  taskId: UUID
): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Moves a task to a target column and updates affected sort orders.
 */
export async function moveTask(
  supabase: TypedSupabaseClient,
  payload: {
    taskId: UUID;
    targetColumnId: UUID;
    newSortOrder: number;
    affectedTasks?: Array<{ id: UUID; sortOrder: number }>;
  }
): Promise<void> {
  // Update the target task
  const { error: moveError } = await supabase
    .from('tasks')
    .update({
      column_id: payload.targetColumnId,
      sort_order: payload.newSortOrder,
    })
    .eq('id', payload.taskId);

  if (moveError) {
    throw new Error(moveError.message);
  }

  // Update positions of any affected sibling tasks and propagate any errors
  if (payload.affectedTasks && payload.affectedTasks.length > 0) {
    for (const item of payload.affectedTasks) {
      if (item.id === payload.taskId) continue;
      const { error: siblingError } = await supabase
        .from('tasks')
        .update({ sort_order: item.sortOrder })
        .eq('id', item.id);

      if (siblingError) {
        throw new Error(
          `Failed to update sibling task sort order (${item.id}): ${siblingError.message}`
        );
      }
    }
  }
}

/**
 * Adds a single checklist item to a task.
 */
export async function addChecklistItem(
  supabase: TypedSupabaseClient,
  payload: {
    taskId: UUID;
    title: string;
    sortOrder?: number;
  }
): Promise<ChecklistItem> {
  let sortOrder = payload.sortOrder;

  if (sortOrder === undefined) {
    const { data: existingItems, error: fetchError } = await supabase
      .from('checklist_items')
      .select('sort_order')
      .eq('task_id', payload.taskId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch checklist items: ${fetchError.message}`);
    }

    sortOrder =
      existingItems && existingItems.length > 0
        ? existingItems[0].sort_order + 1
        : 0;
  }

  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      task_id: payload.taskId,
      title: payload.title.trim(),
      sort_order: sortOrder,
      is_completed: false,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to add checklist item');
  }

  return mapChecklistItemRow(data);
}

/**
 * Adds multiple checklist items in batch (e.g. from AI breakdown).
 * Calculates current maximum sort_order so appended items continue
 * from the correct index rather than restarting at zero.
 */
export async function addChecklistItemsBatch(
  supabase: TypedSupabaseClient,
  taskId: UUID,
  titles: string[]
): Promise<ChecklistItem[]> {
  if (titles.length === 0) return [];

  // Query existing items to determine the next sort_order
  const { data: existingItems, error: fetchError } = await supabase
    .from('checklist_items')
    .select('sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: false })
    .limit(1);

  if (fetchError) {
    throw new Error(`Failed to fetch checklist items: ${fetchError.message}`);
  }

  const startingSortOrder =
    existingItems && existingItems.length > 0
      ? existingItems[0].sort_order + 1
      : 0;

  const inserts = titles.map((title, index) => ({
    task_id: taskId,
    title: title.trim(),
    sort_order: startingSortOrder + index,
    is_completed: false,
  }));

  const { data, error } = await supabase
    .from('checklist_items')
    .insert(inserts)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to insert checklist items batch');
  }

  return data.map(mapChecklistItemRow);
}

/**
 * Toggles a checklist item's completion status.
 */
export async function toggleChecklistItem(
  supabase: TypedSupabaseClient,
  itemId: UUID,
  isCompleted: boolean
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('checklist_items')
    .update({ is_completed: isCompleted })
    .eq('id', itemId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update checklist item');
  }

  return mapChecklistItemRow(data);
}

/**
 * Deletes a checklist item by ID.
 */
export async function deleteChecklistItem(
  supabase: TypedSupabaseClient,
  itemId: UUID
): Promise<void> {
  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Logs a completed Pomodoro focus session.
 * Authenticated user ID is inferred from session identity.
 */
export async function logFocusSession(
  supabase: TypedSupabaseClient,
  payload: LogFocusSessionPayload
): Promise<FocusSession> {
  const user = await getCurrentUser(supabase);
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: user.id,
      task_id: payload.taskId,
      duration_minutes: payload.durationMinutes,
      completed_at: payload.completedAt,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to log focus session');
  }

  return mapFocusSessionRow(data);
}

/**
 * Fetches recent focus sessions for the authenticated user.
 */
export async function getUserFocusSessions(
  supabase: TypedSupabaseClient,
  limit = 20
): Promise<FocusSession[]> {
  const user = await getCurrentUser(supabase);
  if (!user) return [];

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to fetch focus sessions');
  }

  return data.map(mapFocusSessionRow);
}
