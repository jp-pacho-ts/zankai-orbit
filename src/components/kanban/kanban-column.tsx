"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import type { Column } from "@/types/orbit";
import { useBoardStore, type BoardTask, STAGE_SYMBOLS } from "@/stores/board-store";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  column: Column;
  tasks: BoardTask[];
  isFirst: boolean;
  isLast: boolean;
}

export function KanbanColumn({
  column,
  tasks,
  isFirst,
  isLast,
}: KanbanColumnProps) {
  const addTask = useBoardStore((s) => s.addTask);
  const symbol = STAGE_SYMBOLS[column.title] || "✳";

  const handleQuickAdd = () => {
    addTask(column.id);
  };

  return (
    <section className="column" aria-label={`${column.title} column`}>
      <div className="column-header">
        <div className="column-title">
          <span className="column-symbol">{symbol}</span>
          <span>{column.title}</span>
          <span className="count">{tasks.length}</span>
        </div>

        <button
          className="column-add"
          aria-label={`Add task to ${column.title}`}
          onClick={handleQuickAdd}
        >
          <Plus size={15} />
        </button>
      </div>

      <Droppable droppableId={column.id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              minHeight: "480px",
              transition: "background-color 0.2s ease",
              backgroundColor: snapshot.isDraggingOver
                ? "var(--soft)"
                : undefined,
              borderRadius: "8px",
            }}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="empty">Nothing here yet</div>
            )}

            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                stageTitle={column.title}
                isFirstStage={isFirst}
                isLastStage={isLast}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
}
