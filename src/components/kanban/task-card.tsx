"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { CalendarDays, MoreHorizontal } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import type { Priority } from "@/types/orbit";
import { useBoardStore, type BoardTask } from "@/stores/board-store";
import { useDrawerStore } from "@/stores/drawer-store";
import { useTimerStore } from "@/stores/timer-store";

interface TaskCardProps {
  task: BoardTask;
  index: number;
  stageTitle: string;
  isFirstStage: boolean;
  isLastStage: boolean;
  isListMode?: boolean;
}

export function TaskCard({
  task,
  index,
  stageTitle,
  isFirstStage,
  isLastStage,
  isListMode = false,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const openTask = useDrawerStore((s) => s.openTask);
  const moveTaskManual = useBoardStore((s) => s.moveTaskManual);
  const checklistItems = useBoardStore((s) => s.checklistMap[task.id] ?? []);
  const startFocus = useTimerStore((s) => s.startFocus);
  const setToast = useBoardStore((s) => s.setToast);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const completed = checklistItems.filter((step) => step.isCompleted).length;
  const total = checklistItems.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  // Format priority presentation
  const priorityClass =
    task.priority === "high"
      ? "High"
      : task.priority === "low"
      ? "Low"
      : "Normal";

  // Due date presentation
  const dueDisplay = task.dueDate
    ? task.dueDate.includes("T")
      ? new Date(task.dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : task.dueDate
    : "No date";

  const handleStartFocus = () => {
    startFocus(task.id, task.title);
    setToast(`Focus session started: "${task.title}"`);
    setMenuOpen(false);
  };

  const cardContent = (
    <article className="task-card">
      <div className="card-top">
        <span className="category">{task.category || "General"}</span>
        <div className="relative" ref={menuRef}>
          <button
            className="dots"
            aria-label={`Options for ${task.title}`}
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <MoreHorizontal size={17} />
          </button>

          {menuOpen && (
            <div className="dropdown card-menu">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openTask(task.id);
                }}
              >
                Open task
              </button>
              <button
                disabled={isFirstStage}
                onClick={() => {
                  setMenuOpen(false);
                  moveTaskManual(task.id, -1);
                }}
              >
                ← Move left
              </button>
              <button
                disabled={isLastStage}
                onClick={() => {
                  setMenuOpen(false);
                  moveTaskManual(task.id, 1);
                }}
              >
                Move right →
              </button>
              <button onClick={handleStartFocus}>Start focus</button>
            </div>
          )}
        </div>
      </div>

      <button className="task-title" onClick={() => openTask(task.id)}>
        {task.title}
      </button>

      <span className={`priority ${priorityClass}`}>{priorityClass}</span>

      <div className="due">
        <CalendarDays size={12} />
        <span>{dueDisplay}</span>
        {isListMode && <span className="list-stage">{stageTitle}</span>}
      </div>

      <div className="card-footer">
        <span
          className={`avatar ${task.ownerInitials}`}
          title={task.ownerName || task.ownerInitials}
        >
          {task.ownerInitials || "MC"}
        </span>
        <div className="progress">
          <span>
            {completed}/{total}
          </span>
          <span className="progress-track">
            <span
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: stageTitle === "Complete" ? "#40bfa6" : undefined,
              }}
            />
          </span>
        </div>
      </div>
    </article>
  );

  if (isListMode) {
    return cardContent;
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.85 : 1,
            cursor: "grab",
          }}
        >
          {cardContent}
        </div>
      )}
    </Draggable>
  );
}
