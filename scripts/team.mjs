#!/usr/bin/env node
import { parseArgs, fail } from './team-lib.mjs';
import { runInit } from './team-init.mjs';
import { runStatus } from './team-status.mjs';
import { runBoard } from './team-board.mjs';
import { runNew, runTask, runAssign } from './team-task.mjs';
import { runShow } from './team-show.mjs';
import { runHandoff } from './team-handoff.mjs';
import { runQa } from './team-qa.mjs';
import { runRoute } from './team-route.mjs';
import { runCopy } from './team-copy.mjs';

const commands = {
  init: runInit,
  status: runStatus,
  board: runBoard,
  new: runNew,
  show: runShow,
  task: runTask,
  assign: runAssign,
  handoff: runHandoff,
  qa: runQa,
  route: runRoute,
  copy: runCopy
};

try {
  const [command, ...argv] = process.argv.slice(2);
  if (!commands[command]) {
    fail(`Unknown command ${command || '(none)'}. Use npm run team:init, team:status, team:board, team:new, team:show, team:task, team:assign, team:handoff, team:qa, team:route, or team:copy.`);
  }
  await commands[command](parseArgs(argv));
} catch (error) {
  console.error(`Team CLI: ${error.message}`);
  process.exitCode = 1;
}
