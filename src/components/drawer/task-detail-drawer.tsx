"use client";

import * as React from "react";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Plus,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { useDrawerStore } from "@/stores/drawer-store";
import { useBoardStore } from "@/stores/board-store";
import { useTimerStore } from "@/stores/timer-store";
import type { Priority, BreakdownTaskResponse, OrbitApiError } from "@/types/orbit";

const OWNERS: Record<string, string> = {
  MC: "Maya Chen",
  AL: "Avery Lee",
  SK: "Sam Kim",
};

const UI_TO_DB_PRIORITY: Record<string, Priority> = {
  Urgent: "high",
  High: "high",
  Normal: "medium",
  Low: "low",
};

export function TaskDetailDrawer() {
  const { selectedTaskId, isOpen, closeTask } = useDrawerStore();
  const {
    tasks,
    columns,
    checklistMap,
    updateTask,
    toggleChecklistItem,
    addChecklistItem,
    addChecklistItemsBatch,
    setToast,
  } = useBoardStore();

  const startFocus = useTimerStore((s) => s.startFocus);

  const [newStepText, setNewStepText] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);

  const task = tasks.find((t) => t.id === selectedTaskId);
  const checklist = task ? checklistMap[task.id] ?? [] : [];
  const currentColumn = task ? columns.find((c) => c.id === task.columnId) : null;

  if (!isOpen || !task) {
    return null;
  }

  const completedCount = checklist.filter((item) => item.isCompleted).length;
  const totalCount = checklist.length;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTask(task.id, { title: e.target.value });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    const mapped = UI_TO_DB_PRIORITY[selected] || "medium";
    updateTask(task.id, { priority: mapped });
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetCol = columns.find((c) => c.title === e.target.value);
    if (targetCol) {
      updateTask(task.id, { columnId: targetCol.id });
    }
  };

  const handleOverviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTask(task.id, { description: e.target.value });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTask(task.id, { dueDate: e.target.value });
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const initials = e.target.value;
    updateTask(task.id, {
      ownerInitials: initials,
      ownerName: OWNERS[initials] || initials,
    });
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    addChecklistItem(task.id, newStepText.trim());
    setNewStepText("");
  };

  const handleStartFocus = () => {
    startFocus(task.id, task.title);
    closeTask();
    setToast(`Focus session started: "${task.title}"`);
  };

  const handleAskOrbit = async () => {
    setIsAskingAi(true);
    setToast("Asking Orbit to break down this task...");

    try {
      const response = await fetch("/api/ai/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description || undefined,
        }),
      });

      if (response.ok) {
        const data: BreakdownTaskResponse = await response.json();
        const existingTitles = new Set(checklist.map((item) => item.title.toLowerCase()));
        const newTitles = (data.subtasks || [])
          .map((st) => st.title.trim())
          .filter((t) => t && !existingTitles.has(t.toLowerCase()));

        if (newTitles.length > 0) {
          await addChecklistItemsBatch(task.id, newTitles);
          setToast("Orbit added suggested steps to your checklist!");
        } else {
          setToast("Suggested steps are already in your checklist.");
        }
      } else {
        const errorData: OrbitApiError = await response.json().catch(() => ({
          message: "Unable to break down task right now. Please try again.",
        }));
        setToast(errorData.message || "Failed to break down task");
      }
    } catch {
      setToast("Network error while connecting to Orbit AI. Please try again.");
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleCopySummary = async () => {
    try {
      const formattedDue = task.dueDate || "No date";
      const ownerLabel = OWNERS[task.ownerInitials] || task.ownerName || "Unassigned";

      const lines = [
        task.title,
        "",
        task.description || "No overview provided.",
        `Due: ${formattedDue}`,
        `Assigned to: ${ownerLabel}`,
        "",
        "To-dos:",
        ...checklist.map(
          (step) => `${step.isCompleted ? "✓" : "○"} ${step.title}`
        ),
      ];

      await navigator.clipboard.writeText(lines.join("\n"));
      setToast("Task summary copied to clipboard");
    } catch {
      setToast("Clipboard access is unavailable in this environment");
    }
  };

  const prioritySelectValue =
    task.priority === "high"
      ? "High"
      : task.priority === "low"
      ? "Low"
      : "Normal";

  return (
    <>
      <div className="overlay" onClick={closeTask} />

      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        <div className="drawer-header">
          <span>✦ TASK DETAILS</span>
          <button aria-label="Close task drawer" onClick={closeTask}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <input
            className="title-input"
            aria-label="Task title"
            value={task.title}
            onChange={handleTitleChange}
          />

          <div className="task-fields">
            <select
              aria-label="Priority"
              value={prioritySelectValue}
              onChange={handlePriorityChange}
            >
              {["Urgent", "High", "Normal", "Low"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              aria-label="Task status"
              value={currentColumn?.title || "Ideas"}
              onChange={handleStageChange}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.title}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <h4>Overview</h4>
          <textarea
            className="notes"
            aria-label="Task overview"
            value={task.description || ""}
            onChange={handleOverviewChange}
            placeholder="Add a few details or context for this task..."
          />

          <div className="checklist-heading">
            <h4>To-dos</h4>
            <span>
              {completedCount} of {totalCount} complete
            </span>
          </div>

          {checklist.map((step) => (
            <label
              className={`step ${step.isCompleted ? "completed" : ""}`}
              key={step.id}
            >
              <input
                type="checkbox"
                checked={step.isCompleted}
                onChange={() => toggleChecklistItem(task.id, step.id)}
              />
              <span className="checkbox">
                {step.isCompleted && <Check size={12} />}
              </span>
              <span>{step.title}</span>
            </label>
          ))}

          <form className="add-step" onSubmit={handleAddStep}>
            <input
              aria-label="New to-do"
              placeholder="Add a to-do..."
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
            />
            <button type="submit" aria-label="Add to-do">
              <Plus size={16} />
            </button>
          </form>

          <div className="drawer-section">
            <h4>Due date</h4>
            <div className="detail-row">
              <CalendarDays size={14} />
              <input
                className="detail-input"
                aria-label="Due date"
                value={task.dueDate || ""}
                onChange={handleDueDateChange}
                placeholder="e.g. May 8 or Tomorrow"
              />
            </div>
          </div>

          <div className="drawer-section">
            <h4>Assigned to</h4>
            <div className="detail-row">
              <span className={`avatar ${task.ownerInitials}`}>
                {task.ownerInitials || "MC"}
              </span>
              <select
                className="owner-select"
                aria-label="Assignee"
                value={task.ownerInitials || "MC"}
                onChange={handleOwnerChange}
              >
                {Object.entries(OWNERS).map(([initials, name]) => (
                  <option key={initials} value={initials}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="button start-focus"
            onClick={handleStartFocus}
          >
            Start focus session
          </button>
        </div>

        <div className="drawer-bottom">
          <div className="drawer-actions">
            <button
              className="ai-button"
              onClick={handleAskOrbit}
              disabled={isAskingAi}
            >
              {isAskingAi ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              Ask Orbit
            </button>
            <button className="copy-button" onClick={handleCopySummary}>
              <Copy size={15} />
              Copy summary
            </button>
          </div>
          <div className="hint">
            Orbit offers smart planning suggestions in this preview
          </div>
        </div>
      </aside>
    </>
  );
}
