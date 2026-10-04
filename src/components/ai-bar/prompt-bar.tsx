"use client";

import * as React from "react";
import { useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useBoardStore } from "@/stores/board-store";
import type { GenerateBoardResponse, OrbitApiError } from "@/types/orbit";
import { createClient } from "@/lib/supabase/client";
import { createBoardFromDraft } from "@/lib/supabase/helpers";

function getBrowserSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

export function PromptBar() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const applyAiBoardDraft = useBoardStore((s) => s.applyAiBoardDraft);
  const setToast = useBoardStore((s) => s.setToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    if (cleanPrompt.length < 10) {
      setToast("Please enter a few more details (at least 10 characters).");
      return;
    }

    setLoading(true);
    setToast("Orbit AI is creating your board plan...");

    try {
      const response = await fetch("/api/ai/generate-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });

      if (!response.ok) {
        const errorData: OrbitApiError = await response.json().catch(() => ({
          message: "Unable to plan board right now. Please try again.",
        }));
        setToast(errorData.message || "Failed to generate board");
        setLoading(false);
        return;
      }

      const data: GenerateBoardResponse = await response.json();
      applyAiBoardDraft(data);

      // Attempt background Supabase persistence if user is signed in
      try {
        const supabase = getBrowserSupabase();
        if (supabase) {
          await createBoardFromDraft(supabase, data);
        }
      } catch {
        // Optimistic client projection succeeds in preview/mock mode
      }

      setPrompt("");
      setToast(`Generated board: "${data.title}"`);
    } catch {
      setToast("Network error while connecting to Orbit AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-label="Prompt-to-board goal planner"
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
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
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
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: "1 1 320px",
          maxWidth: "540px",
        }}
      >
        <input
          type="text"
          aria-label="Describe your goal"
          placeholder="✨ Ask Orbit to plan a board (e.g. 'Plan a spring launch campaign')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
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
          disabled={loading || !prompt.trim()}
          className="primary-button"
          style={{ height: "37px", padding: "0 14px", fontSize: "11px" }}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Planning...
            </>
          ) : (
            <>
              Plan with AI
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>
    </section>
  );
}
