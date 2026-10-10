import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

// Execute the real Zustand stores; substitute only the external data boundary.
const boundary = { calls: [], fail: false };
globalThis.__t006Boundary = boundary;
const uuid = '00000000-0000-4000-8000-000000000001';
const helperCode = `
const boundary = globalThis.__t006Boundary;
const invoke = async (name, args) => {
  boundary.calls.push({ name, args });
  if (boundary.fail) throw new Error('Simulated persistence failure');
  if (name === 'addChecklistItemsBatch') {
    return args[2].map((title, index) => ({
      id: index === 0 ? '${uuid}' : '00000000-0000-4000-8000-000000000002',
      taskId: args[1], title, isCompleted: false, sortOrder: index + 3,
    }));
  }
  return { id: '${uuid}', taskId: '${uuid}' };
};
${['moveTask', 'updateTask', 'createTask', 'deleteTask', 'addChecklistItem', 'addChecklistItemsBatch', 'toggleChecklistItem', 'deleteChecklistItem', 'logFocusSession'].map(name => `export const ${name} = (...args) => invoke('${name}', args);`).join('\n')}`;
const dataUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
async function loadStore(path) {
  let code = stripTypeScriptTypes(await readFile(new URL(path, import.meta.url), 'utf8'));
  code = code.replaceAll('"zustand"', JSON.stringify(import.meta.resolve('zustand')))
    .replaceAll('"@/lib/supabase/client"', JSON.stringify(dataUrl('export const createClient = () => ({});')))
    .replaceAll('"@/lib/supabase/helpers"', JSON.stringify(dataUrl(helperCode)));
  return import(dataUrl(code));
}
const { useBoardStore: board, DEFAULT_COLUMNS, INITIAL_TASKS, INITIAL_CHECKLISTS } = await loadStore('../src/stores/board-store.ts');
const { useTimerStore: timer } = await loadStore('../src/stores/timer-store.ts');
const reset = () => {
  boundary.calls = []; boundary.fail = false;
  board.setState({ columns: structuredClone(DEFAULT_COLUMNS), tasks: structuredClone(INITIAL_TASKS), checklistMap: structuredClone(INITIAL_CHECKLISTS), toast: null });
};
const move = (id, source, destination, reason = 'DROP') => board.getState().moveTaskOptimistic({ draggableId: id, type: 'TASK', reason, source, destination });

test('unfiltered reorder and movement through all five columns normalize positions', async () => {
  reset();
  await move('task-1', { droppableId: 'col-ideas', index: 0 }, { droppableId: 'col-ideas', index: 2 });
  assert.equal(board.getState().tasks.find(t => t.id === 'task-1').sortOrder, 2);
  for (let index = 1; index < DEFAULT_COLUMNS.length; index++) {
    const task = board.getState().tasks.find(t => t.id === 'task-1');
    await move(task.id, { droppableId: task.columnId, index: task.sortOrder }, { droppableId: DEFAULT_COLUMNS[index].id, index: 0 });
    assert.equal(board.getState().tasks.find(t => t.id === task.id).columnId, DEFAULT_COLUMNS[index].id);
  }
});
test('filtered reorder moves the dragged ID rather than a hidden sibling', async () => {
  reset();
  // Visible cards are task-2 and task-3; hidden task-1 is still in the store.
  await move('task-2', { droppableId: 'col-ideas', index: 0 }, { droppableId: 'col-ideas', index: 1 });
  const ordered = board.getState().tasks.filter(t => t.columnId === 'col-ideas').sort((a,b) => a.sortOrder-b.sortOrder).map(t => t.id);
  assert.ok(ordered.indexOf('task-2') > ordered.indexOf('task-3'), `Actual order: ${ordered}`);
});
test('failed drag persistence rolls back the optimistic move', async () => {
  reset(); boundary.fail = true;
  await move('task-1', { droppableId: 'col-ideas', index: 0 }, { droppableId: 'col-waiting', index: 0 });
  assert.equal(board.getState().tasks.find(t => t.id === 'task-1').columnId, 'col-ideas');
});
test('new task reconciles the database ID for subsequent drawer mutations', async () => {
  reset();
  const id = await board.getState().addTask('col-ideas', 'Persisted task');
  assert.equal(id, uuid);
});
test('new checklist item reconciles the database ID for completion', async () => {
  reset();
  await board.getState().addChecklistItem('task-1', 'Persisted step');
  assert.equal(board.getState().checklistMap['task-1'].at(-1).id, uuid);
});
test('AI draft maintains a null due date', () => {
  reset();
  board.getState().applyAiBoardDraft({ title: 'Study', emoji: 'book', colorTheme: 'blue', tasks: [{ title: 'Read', description: '', column: 'Ideas', priority: 'medium', checklist: ['Notes'], dueDate: null }] });
  assert.equal(board.getState().tasks[0].dueDate, null);
});
test('timer pause/resume and deadline completion log one 25 minute session', async () => {
  boundary.calls = []; boundary.fail = false; timer.getState().resetFocus();
  timer.getState().startFocus(uuid, 'Read');
  assert.equal(timer.getState().remainingSeconds, 1500);
  timer.getState().pauseFocus(); assert.equal(timer.getState().status, 'paused');
  timer.getState().resumeFocus(); assert.equal(timer.getState().status, 'running');
  timer.setState({ deadlineAt: new Date(Date.now() - 1000).toISOString() });
  timer.getState().tick(); await timer.getState().completeSession();
  assert.equal(timer.getState().status, 'completed');
  assert.equal(boundary.calls.filter(c => c.name === 'logFocusSession').length, 1);
  assert.equal(boundary.calls[0].args[1].durationMinutes, 25);
});
test('failed focus logging is not marked successfully logged', async () => {
  boundary.fail = true; timer.getState().resetFocus(); timer.getState().startFocus(uuid);
  await timer.getState().completeSession();
  assert.equal(timer.getState().sessionLogged, false);
});

test('cancelled drag never mutates tasks or calls persistence', async () => {
  reset();
  const before = structuredClone(board.getState().tasks);
  await move('task-1', { droppableId: 'col-ideas', index: 0 }, { droppableId: 'col-waiting', index: 0 }, 'CANCEL');
  assert.deepEqual(board.getState().tasks, before);
  assert.equal(boundary.calls.length, 0);
});

test('failed drawer task edit restores the last persisted value', async () => {
  reset(); boundary.fail = true;
  const before = board.getState().tasks.find(t => t.id === 'task-1').title;
  await board.getState().updateTask('task-1', { title: 'Unsaved edit' });
  assert.equal(board.getState().tasks.find(t => t.id === 'task-1').title, before);
});

test('failed AI checklist persistence rejects so the drawer cannot report success', async () => {
  reset(); boundary.fail = true;
  await assert.rejects(board.getState().addChecklistItemsBatch('task-1', ['Unsaved AI step']));
});

test('saved AI checklist steps use database IDs for subsequent completion', async () => {
  reset();
  await board.getState().addChecklistItemsBatch('task-1', ['Saved AI step']);
  const added = board.getState().checklistMap['task-1'].at(-1);
  assert.equal(added.id, uuid);
  await board.getState().toggleChecklistItem('task-1', added.id);
  const savedToggle = boundary.calls.find(call => call.name === 'toggleChecklistItem');
  assert.equal(savedToggle.args[1], uuid);
  assert.equal(savedToggle.args[2], true);
});
