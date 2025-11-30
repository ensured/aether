import { useState, useCallback } from "react";
import { ExplorationHistory, ExplorationState } from "@/lib/types";

interface UseExplorationHistoryReturn {
  explorationHistory: ExplorationHistory;
  addToHistory: (state: ExplorationState) => void;
  navigateBack: (onReset: () => void) => void;
  resetHistory: () => void;
  updateHistory: (
    updater: (prev: ExplorationHistory) => ExplorationHistory
  ) => void;
}

/**
 * Custom hook to manage exploration history
 */
export const useExplorationHistory = (): UseExplorationHistoryReturn => {
  const [explorationHistory, setExplorationHistory] =
    useState<ExplorationHistory>({
      states: [],
      currentIndex: -1,
    });

  const addToHistory = useCallback((state: ExplorationState) => {
    setExplorationHistory((prev) => {
      const newStates = [...prev.states];
      if (
        newStates.length === 0 ||
        newStates[newStates.length - 1].nodeId !== state.nodeId
      ) {
        newStates.push(state);
      }
      return {
        states: newStates,
        currentIndex: newStates.length - 1,
      };
    });
  }, []);

  const navigateBack = useCallback((onReset: () => void) => {
    setExplorationHistory((prev) => {
      if (prev.currentIndex > 0) {
        return {
          ...prev,
          currentIndex: prev.currentIndex - 1,
        };
      } else if (prev.currentIndex === 0) {
        onReset();
        return {
          ...prev,
          currentIndex: -1,
        };
      }
      return prev;
    });
  }, []);

  const resetHistory = useCallback(() => {
    setExplorationHistory({
      states: [],
      currentIndex: -1,
    });
  }, []);

  const updateHistory = useCallback(
    (updater: (prev: ExplorationHistory) => ExplorationHistory) => {
      setExplorationHistory(updater);
    },
    []
  );

  return {
    explorationHistory,
    addToHistory,
    navigateBack,
    resetHistory,
    updateHistory,
  };
};
