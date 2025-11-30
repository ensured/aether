// Grid layout configuration with improved spacing
export const GRID_CONFIG = {
  // Root node grid settings
  nodesPerRow: 4,
  nodeWidth: 180,
  nodeHeight: 70,
  horizontalSpacing: 40, // Increased from 10 for better separation
  verticalSpacing: 30, // Increased from 0 for better row separation
  startX: 50,
  startY: 80,

  // Child node configuration
  childNodesPerRow: 4, // Separate setting for child grids
  childSpacing: 28, // Horizontal spacing between child nodes
  childVerticalSpacing: 24, // Vertical spacing between child rows
  childOffsetY: 130, // Distance below parent to start children

  // Tree/hierarchy settings
  levelSpacing: 180, // Vertical space between tree levels
  siblingSpacing: 30, // Horizontal space between sibling nodes
  subtreeSpacing: 60, // Extra space between different subtrees

  // Animation and interaction
  animationDuration: 300,

  // Bounds and limits
  minZoom: 0.1,
  maxZoom: 2.5,
  padding: 50, // Padding around the canvas edges
} as const;

// Layout modes for different visualization styles
export const LAYOUT_MODE = {
  GRID: "grid",
  RADIAL: "radial",
  TREE: "tree",
  FORCE: "force",
} as const;

// Root nodes configuration
export const ROOT_NODES = [
  { id: "1", name: "Life", color: "bg-emerald-500" },
  { id: "2", name: "Consciousness", color: "bg-violet-500" },
  { id: "3", name: "Matter", color: "bg-blue-500" },
  { id: "4", name: "Energy", color: "bg-amber-500" },
  { id: "5", name: "Space", color: "bg-slate-800" },
  { id: "6", name: "Time", color: "bg-slate-500" },
  { id: "7", name: "Emotion", color: "bg-pink-500" },
  { id: "8", name: "Mathematics", color: "bg-cyan-500" },
  { id: "9", name: "Language", color: "bg-rose-500" },
  { id: "10", name: "Evolution", color: "bg-green-600" },
  { id: "11", name: "Technology", color: "bg-gray-600" },
  { id: "12", name: "Art", color: "bg-pink-600" },
  { id: "13", name: "Logic", color: "bg-blue-600" },
  { id: "14", name: "Culture", color: "bg-red-500" },
  { id: "15", name: "Gravity", color: "bg-purple-600" },
  { id: "16", name: "Light", color: "bg-yellow-400" },
  { id: "17", name: "Sound", color: "bg-indigo-500" },
  { id: "18", name: "DNA", color: "bg-teal-500" },
  { id: "19", name: "Ecosystems", color: "bg-lime-500" },
  { id: "20", name: "Money", color: "bg-green-700" },
  { id: "21", name: "Crypto", color: "bg-orange-600" },
  { id: "22", name: "Decentralization", color: "bg-purple-700" },
  { id: "23", name: "Information", color: "bg-sky-500" },
  { id: "24", name: "Networks", color: "bg-emerald-600" },
  { id: "25", name: "AI", color: "bg-violet-700" },
  { id: "26", name: "Quantum", color: "bg-indigo-600" },
  { id: "27", name: "Ethics", color: "bg-amber-700" },
] as const;

// Color palette for new nodes
export const COLORS = [
  "bg-emerald-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-slate-800",
  "bg-slate-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-teal-500",
] as const;

// LocalStorage keys
export const STORAGE_KEYS = {
  CUSTOM_ROOT_NODES: "custom-root-nodes",
  LAYOUT_PREFERENCES: "layout-preferences",
} as const;

// Type exports for better type safety
export type LayoutMode = (typeof LAYOUT_MODE)[keyof typeof LAYOUT_MODE];
export type RootNodeConfig = (typeof ROOT_NODES)[number];
export type NodeColor = (typeof COLORS)[number];
