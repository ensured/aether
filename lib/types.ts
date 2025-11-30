import { Node } from "@xyflow/react";

// Custom node data structure with index signature for React Flow compatibility
export interface NodeData extends Record<string, unknown> {
  label: string | React.ReactNode;
  color: string;
  path: string[];
  childrenLoaded: boolean;
  cacheStatus?: { isCached: boolean; expiresInMinutes?: number };
  animationIndex?: number; // Index for staggered entry animations
  isNew?: boolean; // Flag to control entry animations (only animate truly new nodes)
}

// Custom node type with extended data
export type CustomNode = Node<NodeData>;

// Root node configuration
export interface RootNodeConfig {
  id: string;
  name: string;
  color: string;
}

// Exploration history state
export interface ExplorationState {
  nodeId: string;
  selectedRootId: string | null;
}

export interface ExplorationHistory {
  states: ExplorationState[];
  currentIndex: number;
}
