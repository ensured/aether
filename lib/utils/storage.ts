import { STORAGE_KEYS } from "../constants";
import { RootNodeConfig } from "../types";

/**
 * Load custom nodes from localStorage
 */
export const loadCustomNodes = (): RootNodeConfig[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_ROOT_NODES);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading custom nodes:", error);
    return [];
  }
};

/**
 * Save custom nodes to localStorage
 */
export const saveCustomNodes = (customNodes: RootNodeConfig[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_ROOT_NODES,
      JSON.stringify(customNodes)
    );
  } catch (error) {
    console.error("Error saving custom nodes:", error);
  }
};
