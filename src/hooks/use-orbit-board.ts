"use client";

import { useEffect } from "react";
import { useBoardStore } from "@/stores/board-store";
import { createClient } from "@/lib/supabase/client";
import { getUserBoards, getBoardWithDetails } from "@/lib/supabase/helpers";

export function useOrbitBoard() {
  const store = useBoardStore();

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialBoard() {
      try {
        const supabase = createClient();
        const boards = await getUserBoards(supabase);
        if (isCancelled || boards.length === 0) return;

        const activeBoard = boards[0];
        const boardDetails = await getBoardWithDetails(supabase, activeBoard.id);
        if (isCancelled || !boardDetails) return;

        store.setBoard(boardDetails.board);
        store.setColumns(boardDetails.columns.map((c) => c.column));

        const mappedTasks = boardDetails.columns.flatMap((col) =>
          col.tasks.map((tcv) => ({
            ...tcv.task,
            category: tcv.categoryLabel,
            ownerInitials: tcv.owner.displayName
              ? tcv.owner.displayName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "MC",
            ownerName: tcv.owner.displayName ?? "User",
          }))
        );

        const mappedChecklists: Record<string, typeof store.checklistMap[string]> = {};
        boardDetails.columns.forEach((col) => {
          col.tasks.forEach((tcv) => {
            mappedChecklists[tcv.task.id] = tcv.checklistItems;
          });
        });

        store.setTasks(mappedTasks);
        store.setChecklistMap(mappedChecklists);
      } catch {
        // Unauthenticated or local preview: store retains its rich mock initial data
      }
    }

    loadInitialBoard();

    return () => {
      isCancelled = true;
    };
  }, []);

  return store;
}
