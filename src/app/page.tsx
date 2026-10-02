"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";

type Stage = "Ideas" | "Up Next" | "In Motion" | "Waiting" | "Complete";
type Priority = "Urgent" | "High" | "Normal" | "Low";
type Step = { text: string; completed: boolean };

type Task = {
  id: number;
  title: string;
  stage: Stage;
  category: string;
  priority: Priority;
  due: string;
  owner: string;
  summary: string;
  steps: Step[];
};

const stages: Stage[] = [
  "Ideas",
  "Up Next",
  "In Motion",
  "Waiting",
  "Complete",
];

const owners: Record<string, string> = {
  MC: "Maya Chen",
  AL: "Avery Lee",
  SK: "Sam Kim",
};

const marks: Record<Stage, string> = {
  Ideas: "✳",
  "Up Next": "◯",
  "In Motion": "◐",
  Waiting: "◈",
  Complete: "✓",
};

function checklist(labels: string[], completed = 0): Step[] {
  return labels.map((text, index) => ({
    text,
    completed: index < completed,
  }));
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Plan spring campaign",
    stage: "Ideas",
    category: "Marketing",
    priority: "High",
    due: "May 8",
    owner: "MC",
    summary:
      "Bring the spring launch together with a clear message, a simple rollout plan, and useful creative assets.",
    steps: checklist(
      [
        "Choose campaign theme",
        "Outline key messages",
        "Gather visual references",
      ],
      1
    ),
  },
  {
    id: 2,
    title: "Team retreat ideas",
    stage: "Ideas",
    category: "People",
    priority: "Normal",
    due: "May 14",
    owner: "AL",
    summary:
      "Collect ideas for a relaxed team retreat that gives everyone time to connect.",
    steps: checklist([
      "Collect suggestions",
      "Shortlist locations",
      "Share options with team",
    ]),
  },
  {
    id: 3,
    title: "Refresh welcome kit",
    stage: "Ideas",
    category: "Operations",
    priority: "Low",
    due: "May 21",
    owner: "SK",
    summary:
      "Make the new teammate welcome kit feel warm, useful, and easy to follow.",
    steps: checklist(["Review current kit", "Update checklist"]),
  },
  {
    id: 4,
    title: "Finalize event schedule",
    stage: "Up Next",
    category: "Events",
    priority: "High",
    due: "Tomorrow",
    owner: "AL",
    summary: "Confirm the event timeline, speakers, and room assignments.",
    steps: checklist(
      [
        "Confirm speakers",
        "Set session times",
        "Send final schedule",
        "Prepare run of show",
      ],
      2
    ),
  },
  {
    id: 5,
    title: "Draft monthly newsletter",
    stage: "Up Next",
    category: "Marketing",
    priority: "Normal",
    due: "May 6",
    owner: "MC",
    summary:
      "Share the latest updates, helpful stories, and upcoming events with the community.",
    steps: checklist(["Collect stories", "Draft copy", "Choose imagery"], 1),
  },
  {
    id: 6,
    title: "Prepare Q3 goals",
    stage: "Up Next",
    category: "Planning",
    priority: "Normal",
    due: "May 12",
    owner: "SK",
    summary:
      "Turn team priorities into a focused set of goals for the next quarter.",
    steps: checklist([
      "Review last quarter",
      "Gather team input",
      "Draft goals",
    ]),
  },
  {
    id: 7,
    title: "Launch community workshop",
    stage: "In Motion",
    category: "Events",
    priority: "Urgent",
    due: "Today",
    owner: "MC",
    summary:
      "Bring the next community workshop to life. Coordinate the venue, invite list, and attendee experience.",
    steps: checklist(
      [
        "Confirm venue and host",
        "Publish registration page",
        "Send invitations",
        "Prepare materials",
      ],
      3
    ),
  },
  {
    id: 8,
    title: "Update brand guidelines",
    stage: "In Motion",
    category: "Design",
    priority: "Normal",
    due: "May 9",
    owner: "AL",
    summary:
      "Make the brand guide easier for everyone to use across presentations and social content.",
    steps: checklist(
      [
        "Audit existing guide",
        "Refresh examples",
        "Review with team",
        "Publish update",
      ],
      2
    ),
  },
  {
    id: 9,
    title: "Review budget proposal",
    stage: "Waiting",
    category: "Finance",
    priority: "High",
    due: "May 5",
    owner: "SK",
    summary: "Review the proposed budget and collect final approvals.",
    steps: checklist(
      ["Check allocations", "Ask for feedback", "Record approval"],
      2
    ),
  },
  {
    id: 10,
    title: "Approve homepage copy",
    stage: "Waiting",
    category: "Marketing",
    priority: "Normal",
    due: "May 7",
    owner: "MC",
    summary: "Review the updated homepage message for clarity and tone.",
    steps: checklist(
      ["Review draft", "Leave comments", "Approve final copy"],
      2
    ),
  },
  {
    id: 11,
    title: "Organize customer interviews",
    stage: "Complete",
    category: "Research",
    priority: "Normal",
    due: "Apr 29",
    owner: "AL",
    summary: "Schedule customer interviews and prepare discussion prompts.",
    steps: checklist(
      ["Choose participants", "Book sessions", "Prepare prompts"],
      3
    ),
  },
  {
    id: 12,
    title: "Publish April recap",
    stage: "Complete",
    category: "Marketing",
    priority: "Low",
    due: "Apr 30",
    owner: "MC",
    summary: "Share a friendly recap of the team's work and highlights.",
    steps: checklist(["Collect highlights", "Write recap", "Publish"], 3),
  },
];

function Avatar({ owner }: { owner: string }) {
  return (
    <span className={`avatar ${owner}`} title={owners[owner] || owner}>
      {owner}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`priority ${priority}`}>{priority}</span>;
}

export default function HomePage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"board" | "list">("board");
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(1398);
  const [focusId, setFocusId] = useState(1);
  const [newStep, setNewStep] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const current = tasks.find((task) => task.id === selectedId);
  const focusTask = tasks.find((task) => task.id === focusId);

  const categories = [
    "All",
    ...Array.from(new Set(tasks.map((task) => task.category))).sort(),
  ];

  const shown = tasks.filter(
    (task) =>
      (category === "All" || task.category === category) &&
      `${task.title} ${task.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedId(null);
        setFilterOpen(false);
        setMenuId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function update(id: number, patch: Partial<Task>) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, ...patch } : task
      )
    );
  }

  function openTask(id: number) {
    setSelectedId(id);
    setNewStep("");
    setMenuId(null);
  }

  function addTask(stage: Stage) {
    const id = Math.max(0, ...tasks.map((task) => task.id)) + 1;
    setTasks((previous) => [
      ...previous,
      {
        id,
        title: "New task",
        stage,
        category: "Personal",
        priority: "Normal",
        due: "No date",
        owner: "MC",
        summary: "Add a few details to get started.",
        steps: checklist(["Add first step"]),
      },
    ]);
    openTask(id);
    setToast("Task added");
  }

  function moveTask(task: Task, direction: number) {
    const nextStage = stages[stages.indexOf(task.stage) + direction];
    if (nextStage) update(task.id, { stage: nextStage });
    setMenuId(null);
  }

  function toggleStep(task: Task, index: number) {
    update(task.id, {
      steps: task.steps.map((step, i) =>
        i === index ? { ...step, completed: !step.completed } : step
      ),
    });
  }

  function addStep() {
    if (!current || !newStep.trim()) return;
    update(current.id, {
      steps: [
        ...current.steps,
        { text: newStep.trim(), completed: false },
      ],
    });
    setNewStep("");
  }

  function askOrbit() {
    if (!current) return;
    const suggestions = [
      "Share an update with the team",
      "Review the final result",
    ].filter(
      (text) => !current.steps.some((step) => step.text === text)
    );

    if (!suggestions.length) {
      setToast("These sample suggestions are already in the task");
      return;
    }

    update(current.id, {
      steps: [
        ...current.steps,
        ...suggestions.map((text) => ({ text, completed: false })),
      ],
    });
    setToast("Sample next steps added");
  }

  async function copySummary() {
    if (!current) return;
    try {
      const summary = [
        current.title,
        "",
        current.summary,
        `Due: ${current.due}`,
        `Assigned to: ${owners[current.owner] || current.owner}`,
        "",
        "To-dos:",
        ...current.steps.map(
          (step) => `${step.completed ? "✓" : "○"} ${step.text}`
        ),
      ].join("\n");

      await navigator.clipboard.writeText(summary);
      setToast("Task summary copied");
    } catch {
      setToast("Clipboard access is unavailable");
    }
  }

  function startFocus(task: Task) {
    setFocusId(task.id);
    setSeconds(0);
    setRunning(true);
    setSelectedId(null);
    setToast("Focus session started");
  }

  const clock = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  function renderCard(task: Task) {
    const completed = task.steps.filter((step) => step.completed).length;
    const progress = task.steps.length
      ? (completed / task.steps.length) * 100
      : 0;

    return (
      <article className="task-card" key={task.id}>
        <div className="card-top">
          <span className="category">{task.category}</span>
          <div className="relative">
            <button
              className="dots"
              aria-label={`Options for ${task.title}`}
              aria-expanded={menuId === task.id}
              onClick={() =>
                setMenuId(menuId === task.id ? null : task.id)
              }
            >
              <MoreHorizontal size={17} />
            </button>

            {menuId === task.id && (
              <div className="dropdown card-menu">
                <button onClick={() => openTask(task.id)}>Open task</button>
                <button
                  disabled={task.stage === stages[0]}
                  onClick={() => moveTask(task, -1)}
                >
                  ← Move left
                </button>
                <button
                  disabled={task.stage === stages[stages.length - 1]}
                  onClick={() => moveTask(task, 1)}
                >
                  Move right →
                </button>
                <button onClick={() => startFocus(task)}>Start focus</button>
              </div>
            )}
          </div>
        </div>

        <button className="task-title" onClick={() => openTask(task.id)}>
          {task.title}
        </button>

        <PriorityBadge priority={task.priority} />

        <div className="due">
          <CalendarDays size={12} />
          {task.due}
          {view === "list" && <span className="list-stage">{task.stage}</span>}
        </div>

        <div className="card-footer">
          <Avatar owner={task.owner} />
          <div className="progress">
            <span>
              {completed}/{task.steps.length}
            </span>
            <span className="progress-track">
              <span
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background:
                    task.stage === "Complete" ? "#40bfa6" : undefined,
                }}
              />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      <Header
        onNotificationClick={() => setToast("You're all caught up")}
      />

      <main className="main">
        {/* Prompt-to-Board Planning Bar */}
        <section
          aria-label="Ask AI to plan a board"
          style={{
            marginBottom: "24px",
            padding: "16px 20px",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            boxShadow: "0 4px 14px var(--shadow)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #2673e9, #458ff4)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} />
            </span>
            <div>
              <strong style={{ fontSize: "13px", fontWeight: 800 }}>
                Prompt-to-Board Planning
              </strong>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "var(--muted)",
                }}
              >
                Describe any project or goal in everyday words — Orbit will organize it into an actionable board.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (aiPrompt.trim()) {
                setToast(`Planning board for: "${aiPrompt.trim()}"`);
                setAiPrompt("");
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: "1 1 320px",
              maxWidth: "520px",
            }}
          >
            <input
              type="text"
              aria-label="Describe your goal"
              placeholder="✨ Ask Orbit to plan a board (e.g. 'Plan a spring launch')..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                height: "37px",
                border: "1px solid var(--line)",
                background: "var(--panel)",
                borderRadius: "9px",
                padding: "0 12px",
                color: "var(--text)",
                fontSize: "11px",
              }}
            />
            <button
              type="submit"
              className="primary-button"
              style={{ height: "37px", padding: "0 14px", fontSize: "11px" }}
            >
              Plan with AI
              <ArrowRight size={14} />
            </button>
          </form>
        </section>

        <div className="eyebrow">Northstar Team / Overview</div>

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
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="relative">
              <button
                className="button"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter size={14} />
                Filter
                {category !== "All" && <span>· {category}</span>}
              </button>

              {filterOpen && (
                <div className="dropdown">
                  {categories.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        setCategory(name);
                        setFilterOpen(false);
                      }}
                    >
                      {category === name ? "✓ " : ""}
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="primary-button" onClick={() => addTask("Ideas")}>
              <Plus size={15} />
              New task
            </button>
          </div>
        </div>

        <div className="board-strip">
          <div className="strip-left">
            <strong>{shown.length} tasks</strong>
            <span className="tiny-divider" />
            <span>Updated just now</span>
            <span className="tiny-divider" />
            <div className="avatars">
              <Avatar owner="MC" />
              <Avatar owner="AL" />
              <Avatar owner="SK" />
              <span className="avatar extra">+2</span>
            </div>
          </div>

          <div className="view-switch">
            <button
              className={view === "board" ? "active" : ""}
              onClick={() => setView("board")}
            >
              <LayoutGrid size={13} />
              Board
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <List size={13} />
              List
            </button>
          </div>
        </div>

        {view === "board" ? (
          <div className="board">
            {stages.map((stage) => {
              const cards = shown.filter((task) => task.stage === stage);
              return (
                <section className="column" key={stage}>
                  <div className="column-header">
                    <div className="column-title">
                      <span className="column-symbol">{marks[stage]}</span>
                      {stage}
                      <span className="count">{cards.length}</span>
                    </div>

                    <button
                      className="column-add"
                      aria-label={`Add task to ${stage}`}
                      onClick={() => addTask(stage)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {cards.length === 0 && (
                    <div className="empty">Nothing here yet</div>
                  )}

                  {cards.map(renderCard)}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="task-list">
            {shown.length === 0 && (
              <div className="empty">No matching tasks</div>
            )}
            {shown.map(renderCard)}
          </div>
        )}
      </main>

      <div className="focus-timer">
        <span className={`glow ${running ? "" : "paused"}`} />
        <span className="focus-label">
          {running ? "Focus:" : "Paused:"}{" "}
          <strong>{focusTask?.title || "Your task"}</strong>
        </span>
        <strong className="timer-clock">{clock}</strong>
        <button
          onClick={() => {
            setRunning(!running);
            setToast(running ? "Focus session paused" : "Focus session resumed");
          }}
        >
          {running ? "Pause focus" : "Resume focus"}
        </button>
      </div>

      {current && (
        <>
          <div className="overlay" onClick={() => setSelectedId(null)} />

          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Task details"
          >
            <div className="drawer-header">
              <span>✦ TASK DETAILS</span>
              <button
                aria-label="Close task"
                onClick={() => setSelectedId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <input
                className="title-input"
                aria-label="Task title"
                value={current.title}
                onChange={(event) =>
                  update(current.id, { title: event.target.value })
                }
              />

              <div className="task-fields">
                <select
                  aria-label="Priority"
                  value={current.priority}
                  onChange={(event) =>
                    update(current.id, {
                      priority: event.target.value as Priority,
                    })
                  }
                >
                  {["Urgent", "High", "Normal", "Low"].map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>

                <select
                  aria-label="Task status"
                  value={current.stage}
                  onChange={(event) =>
                    update(current.id, {
                      stage: event.target.value as Stage,
                    })
                  }
                >
                  {stages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              <h4>Overview</h4>
              <textarea
                className="notes"
                aria-label="Task overview"
                value={current.summary}
                onChange={(event) =>
                  update(current.id, { summary: event.target.value })
                }
              />

              <div className="checklist-heading">
                <h4>To-dos</h4>
                <span>
                  {current.steps.filter((step) => step.completed).length} of{" "}
                  {current.steps.length} complete
                </span>
              </div>

              {current.steps.map((step, index) => (
                <label
                  className={`step ${step.completed ? "completed" : ""}`}
                  key={`${current.id}-${index}`}
                >
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => toggleStep(current, index)}
                  />
                  <span className="checkbox">
                    {step.completed && <Check size={12} />}
                  </span>
                  <span>{step.text}</span>
                </label>
              ))}

              <form
                className="add-step"
                onSubmit={(event) => {
                  event.preventDefault();
                  addStep();
                }}
              >
                <input
                  aria-label="New to-do"
                  placeholder="Add a to-do..."
                  value={newStep}
                  onChange={(event) => setNewStep(event.target.value)}
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
                    value={current.due}
                    onChange={(event) =>
                      update(current.id, { due: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="drawer-section">
                <h4>Assigned to</h4>
                <div className="detail-row">
                  <Avatar owner={current.owner} />
                  <select
                    className="owner-select"
                    aria-label="Assignee"
                    value={current.owner}
                    onChange={(event) =>
                      update(current.id, { owner: event.target.value })
                    }
                  >
                    {Object.entries(owners).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="button start-focus"
                onClick={() => startFocus(current)}
              >
                Start focus session
              </button>
            </div>

            <div className="drawer-bottom">
              <div className="drawer-actions">
                <button className="ai-button" onClick={askOrbit}>
                  <Sparkles size={15} />
                  Ask Orbit
                </button>
                <button className="copy-button" onClick={copySummary}>
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
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
