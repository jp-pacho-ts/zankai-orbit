"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";
import { useBoardStore } from "@/stores/board-store";
import type { TaskDragEndPayload } from "@/types/orbit";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";

export function KanbanBoard() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const {
    board,
    columns,
    tasks,
    searchQuery,
    selectedCategory,
    viewMode,
    setSearchQuery,
    setSelectedCategory,
    setViewMode,
    moveTaskOptimistic,
    addTask,
  } = useBoardStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterOpen]);

  // Extract distinct categories from tasks
  const categories = [
    "All",
    ...Array.from(new Set(tasks.map((t) => t.category || "General"))).sort(),
  ];

  // Real-time search & category filter
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory =
      selectedCategory === "All" || (task.category || "General") === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === "" ||
      `${task.title} ${task.category || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesQuery;
  });

  const handleDragEnd = (result: DropResult) => {
    const payload: TaskDragEndPayload = {
      draggableId: result.draggableId,
      type: result.type,
      reason: result.reason,
      source: {
        droppableId: result.source.droppableId,
        index: result.source.index,
      },
      destination: result.destination
        ? {
            droppableId: result.destination.droppableId,
            index: result.destination.index,
          }
        : null,
    };

    moveTaskOptimistic(payload);
  };

  const handleAddNewTask = () => {
    const firstColId = columns[0]?.id || "col-ideas";
    addTask(firstColId);
  };

  // Safe client-side render check for DnD
  if (!mounted) {
    return (
      <div style={{ minHeight: "500px", padding: "20px 0" }}>
        <div className="eyebrow">{board?.title || "Northstar Team"} / Overview</div>
        <div className="board-heading">
          <div>
            <h1>Team Board</h1>
            <p>A calm place to keep everything moving.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="eyebrow">{board?.title || "Northstar Team"} / Overview</div>

      <div className="board-heading">
        <div>
          <h1>Team Board</h1>
          <p>A calm place to keep everything moving.</p>
        </div>

        <div className="board-actions">
          <label className="search">
            <Search size={14} />
            <input
              aria-label="Search tasks"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div className="relative" ref={filterRef}>
            <button
              className="button"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter size={14} />
              Filter
              {selectedCategory !== "All" && <span>· {selectedCategory}</span>}
            </button>

            {filterOpen && (
              <div className="dropdown">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setFilterOpen(false);
                    }}
                  >
                    {selectedCategory === cat ? "✓ " : ""}
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="primary-button" onClick={handleAddNewTask}>
            <Plus size={15} />
            New task
          </button>
        </div>
      </div>

      <div className="board-strip">
        <div className="strip-left">
          <strong>{filteredTasks.length} tasks</strong>
          <span className="tiny-divider" />
          <span>Updated just now</span>
          <span className="tiny-divider" />
          <div className="avatars">
            <span className="avatar MC" title="Maya Chen">
              MC
            </span>
            <span className="avatar AL" title="Avery Lee">
              AL
            </span>
            <span className="avatar SK" title="Sam Kim">
              SK
            </span>
            <span className="avatar extra">+2</span>
          </div>
        </div>

        <div className="view-switch">
          <button
            className={viewMode === "board" ? "active" : ""}
            onClick={() => setViewMode("board")}
            aria-label="Switch to Board view"
          >
            <LayoutGrid size={13} />
            Board
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
            aria-label="Switch to List view"
          >
            <List size={13} />
            List
          </button>
        </div>
      </div>

      {viewMode === "board" ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="board">
            {columns.map((col, idx) => {
              const colTasks = filteredTasks
                .filter((t) => t.columnId === col.id)
                .sort((a, b) => a.sortOrder - b.sortOrder);

              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={colTasks}
                  isFirst={idx === 0}
                  isLast={idx === columns.length - 1}
                />
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <div className="task-list">
          {filteredTasks.length === 0 && (
            <div className="empty">No matching tasks</div>
          )}
          {filteredTasks.map((task, idx) => {
            const col = columns.find((c) => c.id === task.columnId);
            return (
              <TaskCard
                key={task.id}
                task={task}
                index={idx}
                stageTitle={col?.title || "Tasks"}
                isFirstStage={false}
                isLastStage={false}
                isListMode={true}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
