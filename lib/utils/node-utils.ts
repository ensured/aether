import { GRID_CONFIG } from "../constants";

// Types for position calculations
export interface Position {
  x: number;
  y: number;
}

export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutOptions {
  centerX?: number;
  centerY?: number;
  spread?: number;
  startAngle?: number;
}

/**
 * Calculate grid position for root nodes
 * Creates a clean, evenly-spaced grid layout
 */
export const calculateGridPosition = (
  index: number,
  options?: { nodesPerRow?: number },
): Position => {
  const {
    nodesPerRow,
    nodeWidth,
    nodeHeight,
    horizontalSpacing,
    verticalSpacing,
    startX,
    startY,
  } = GRID_CONFIG;

  const columns = options?.nodesPerRow ?? nodesPerRow;
  const row = Math.floor(index / columns);
  const col = index % columns;

  // Calculate total width of a cell (node + spacing)
  const cellWidth = nodeWidth + horizontalSpacing;
  const cellHeight = nodeHeight + verticalSpacing;

  return {
    x: startX + col * cellWidth,
    y: startY + row * cellHeight,
  };
};

/**
 * Calculate child node positions in a centered grid below the parent
 * Ensures children don't overlap and are properly centered
 */
export const calculateChildPosition = (
  parentPosition: Position,
  childIndex: number,
  totalChildren: number,
  options?: { maxPerRow?: number },
): Position => {
  const {
    childNodesPerRow,
    nodeWidth,
    nodeHeight,
    childSpacing,
    childVerticalSpacing,
    childOffsetY,
  } = GRID_CONFIG;

  const maxPerRow = options?.maxPerRow ?? childNodesPerRow;

  // Calculate row position
  const currentRow = Math.floor(childIndex / maxPerRow);
  const currentCol = childIndex % maxPerRow;

  // How many nodes are in the current row
  const nodesInCurrentRow = Math.min(
    maxPerRow,
    totalChildren - currentRow * maxPerRow,
  );

  // Calculate the total width of the current row
  const rowWidth =
    nodesInCurrentRow * nodeWidth + (nodesInCurrentRow - 1) * childSpacing;

  // Center the row under the parent
  const rowStartX = parentPosition.x + nodeWidth / 2 - rowWidth / 2;

  // Calculate vertical position
  const y =
    parentPosition.y +
    childOffsetY +
    currentRow * (nodeHeight + childVerticalSpacing);

  // Calculate horizontal position within the row
  const x = rowStartX + currentCol * (nodeWidth + childSpacing);

  return { x, y };
};

/**
 * Calculate positions in a radial/fan layout around a parent
 * Good for showing relationships in a more organic way
 */
export const calculateRadialChildPosition = (
  parentPosition: Position,
  childIndex: number,
  totalChildren: number,
  options?: LayoutOptions,
): Position => {
  const { nodeWidth, nodeHeight, childOffsetY } = GRID_CONFIG;

  const spread = options?.spread ?? 180; // Degrees of spread (180 = semicircle below)
  const startAngle = options?.startAngle ?? 180; // Start from bottom-left

  // Calculate radius based on number of children
  const baseRadius = childOffsetY + Math.max(0, totalChildren - 4) * 15;
  const radius = Math.max(baseRadius, 100);

  // Calculate angle for this child
  const angleStep = totalChildren > 1 ? spread / (totalChildren - 1) : 0;
  const angle =
    startAngle + (totalChildren > 1 ? childIndex * angleStep : spread / 2);

  // Convert to radians
  const radians = (angle * Math.PI) / 180;

  // Calculate position
  const centerX = parentPosition.x + nodeWidth / 2;
  const centerY = parentPosition.y + nodeHeight / 2;

  return {
    x: centerX + radius * Math.cos(radians) - nodeWidth / 2,
    y: centerY + radius * Math.sin(radians) - nodeHeight / 2,
  };
};

/**
 * Calculate positions in a tree/hierarchical layout
 * Children are spread horizontally with proper spacing
 */
export const calculateTreeChildPosition = (
  parentPosition: Position,
  childIndex: number,
  totalChildren: number,
  depth: number = 1,
): Position => {
  const { nodeWidth, levelSpacing, siblingSpacing } = GRID_CONFIG;

  // Calculate the total width needed for all children
  const totalWidth =
    totalChildren * nodeWidth + (totalChildren - 1) * siblingSpacing;

  // Start position (centered under parent)
  const startX = parentPosition.x + nodeWidth / 2 - totalWidth / 2;

  // Y position based on depth
  const y = parentPosition.y + levelSpacing * depth;

  // X position for this child
  const x = startX + childIndex * (nodeWidth + siblingSpacing);

  return { x, y };
};

/**
 * Calculate positions in a cascading/waterfall layout
 * Each child is slightly offset, creating a stacked effect
 */
export const calculateCascadeChildPosition = (
  parentPosition: Position,
  childIndex: number,
  _totalChildren: number,
): Position => {
  const { nodeWidth, childSpacing } = GRID_CONFIG;

  const offsetX = 30; // Horizontal cascade offset
  const offsetY = 25; // Vertical cascade offset

  // Start position (to the right and below parent)
  const startX = parentPosition.x + nodeWidth + childSpacing;
  const startY = parentPosition.y;

  return {
    x: startX + childIndex * offsetX,
    y: startY + childIndex * offsetY,
  };
};

/**
 * Calculate bounding box for a set of positions
 * Useful for camera fitting and collision detection
 */
export const calculateBoundingBox = (
  positions: Position[],
): {
  min: Position;
  max: Position;
  center: Position;
  width: number;
  height: number;
} => {
  const { nodeWidth, nodeHeight } = GRID_CONFIG;

  if (positions.length === 0) {
    return {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 },
      center: { x: 0, y: 0 },
      width: 0,
      height: 0,
    };
  }

  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x)) + nodeWidth;
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y)) + nodeHeight;

  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Check if two node bounds overlap
 */
export const checkOverlap = (
  a: NodeBounds,
  b: NodeBounds,
  padding: number = 10,
): boolean => {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
};

/**
 * Adjust position to avoid overlapping with existing nodes
 * Uses simple collision resolution
 */
export const resolveOverlap = (
  newPosition: Position,
  existingPositions: Position[],
  padding: number = 20,
): Position => {
  const { nodeWidth, nodeHeight } = GRID_CONFIG;

  const newBounds: NodeBounds = {
    x: newPosition.x,
    y: newPosition.y,
    width: nodeWidth,
    height: nodeHeight,
  };

  const adjustedPosition = { ...newPosition };
  let hasOverlap = true;
  let iterations = 0;
  const maxIterations = 50;

  while (hasOverlap && iterations < maxIterations) {
    hasOverlap = false;

    for (const existing of existingPositions) {
      const existingBounds: NodeBounds = {
        x: existing.x,
        y: existing.y,
        width: nodeWidth,
        height: nodeHeight,
      };

      if (
        checkOverlap(
          { ...newBounds, x: adjustedPosition.x, y: adjustedPosition.y },
          existingBounds,
          padding,
        )
      ) {
        hasOverlap = true;

        // Calculate push direction (push down and slightly right)
        adjustedPosition.y += nodeHeight + padding;

        // If we've pushed too far down, move to next column
        if (iterations > 10 && iterations % 10 === 0) {
          adjustedPosition.x += nodeWidth + padding;
          adjustedPosition.y = newPosition.y;
        }

        break;
      }
    }

    iterations++;
  }

  return adjustedPosition;
};

/**
 * Calculate optimal positions for a group of child nodes
 * Combines grid layout with overlap resolution
 */
export const calculateOptimalChildPositions = (
  parentPosition: Position,
  childCount: number,
  existingPositions: Position[] = [],
  layoutType: "grid" | "radial" | "tree" = "grid",
): Position[] => {
  const positions: Position[] = [];

  for (let i = 0; i < childCount; i++) {
    let position: Position;

    switch (layoutType) {
      case "radial":
        position = calculateRadialChildPosition(parentPosition, i, childCount);
        break;
      case "tree":
        position = calculateTreeChildPosition(parentPosition, i, childCount);
        break;
      case "grid":
      default:
        position = calculateChildPosition(parentPosition, i, childCount);
        break;
    }

    // Resolve any overlaps with existing nodes
    const allExisting = [...existingPositions, ...positions];
    position = resolveOverlap(position, allExisting);

    positions.push(position);
  }

  return positions;
};

/**
 * Calculate the center point for camera focus
 * Includes parent and all children
 */
export const calculateFocusCenter = (
  parentPosition: Position,
  childPositions: Position[],
): Position => {
  const { nodeWidth, nodeHeight } = GRID_CONFIG;

  const allPositions = [parentPosition, ...childPositions];

  // Calculate center of bounding box
  const bounds = calculateBoundingBox(allPositions);

  return bounds.center;
};

/**
 * Calculate appropriate zoom level to fit nodes in view
 */
export const calculateFitZoom = (
  positions: Position[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 100,
): number => {
  const bounds = calculateBoundingBox(positions);

  if (bounds.width === 0 || bounds.height === 0) {
    return 1;
  }

  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;

  const zoomX = availableWidth / bounds.width;
  const zoomY = availableHeight / bounds.height;

  // Use the smaller zoom to ensure everything fits
  const zoom = Math.min(zoomX, zoomY);

  // Clamp to reasonable bounds
  return Math.max(GRID_CONFIG.minZoom, Math.min(zoom, GRID_CONFIG.maxZoom));
};

/**
 * Get recommended number of children per row based on total count
 * Adapts the grid to look balanced
 */
export const getOptimalChildrenPerRow = (totalChildren: number): number => {
  if (totalChildren <= 3) return totalChildren;
  if (totalChildren <= 6) return 3;
  if (totalChildren <= 9) return 3;
  if (totalChildren <= 12) return 4;
  return 4; // Max 4 per row for readability
};

/**
 * Calculate staggered animation delays for child nodes
 * Creates a nice cascade effect when nodes appear
 */
export const calculateAnimationDelay = (
  childIndex: number,
  totalChildren: number,
  baseDelay: number = 50,
): number => {
  return childIndex * baseDelay;
};

/**
 * Generate positions for a compact cluster layout
 * Useful for showing many related concepts
 */
export const calculateClusterPosition = (
  centerPosition: Position,
  nodeIndex: number,
  totalNodes: number,
  clusterRadius: number = 150,
): Position => {
  const { nodeWidth, nodeHeight } = GRID_CONFIG;

  // Golden angle for nice distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = nodeIndex * goldenAngle;

  // Radius increases with index for spiral effect
  const radius = Math.sqrt(nodeIndex / totalNodes) * clusterRadius;

  return {
    x: centerPosition.x + radius * Math.cos(angle) - nodeWidth / 2,
    y: centerPosition.y + radius * Math.sin(angle) - nodeHeight / 2,
  };
};

/**
 * Validate that a position is within canvas bounds
 */
export const clampToCanvas = (
  position: Position,
  canvasWidth: number = 10000,
  canvasHeight: number = 10000,
): Position => {
  const { nodeWidth: nw, nodeHeight: nh, padding } = GRID_CONFIG;

  return {
    x: Math.max(padding, Math.min(position.x, canvasWidth - nw - padding)),
    y: Math.max(padding, Math.min(position.y, canvasHeight - nh - padding)),
  };
};
