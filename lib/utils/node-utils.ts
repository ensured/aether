import { GRID_CONFIG } from "../constants";

/**
 * Calculate grid position for a node based on its index
 */
export const calculateGridPosition = (index: number, isChild = false) => {
  const {
    nodesPerRow,
    nodeWidth,
    nodeHeight,
    horizontalSpacing,
    verticalSpacing,
    startX,
    startY,
    childSpacing,
  } = GRID_CONFIG;

  const row = Math.floor(index / nodesPerRow);
  const col = index % nodesPerRow;

  const hSpacing = isChild ? childSpacing : horizontalSpacing;
  const vSpacing = isChild ? childSpacing : verticalSpacing;

  return {
    x: startX + col * (nodeWidth + hSpacing),
    y: startY + row * (nodeHeight + vSpacing),
  };
};

/**
 * Calculate child node positions centered under parent
 * This positions children below the parent in a grid, with proper spacing
 */
export const calculateChildPosition = (
  parentPosition: { x: number; y: number },
  childIndex: number,
  totalChildren: number
) => {
  const { nodesPerRow, nodeWidth, nodeHeight, childSpacing, childOffsetY } =
    GRID_CONFIG;

  const row = Math.floor(childIndex / nodesPerRow);
  const col = childIndex % nodesPerRow;

  // Calculate grid width for centering
  const nodesInRow = Math.min(nodesPerRow, totalChildren - row * nodesPerRow);
  const gridWidth = nodesInRow * (nodeWidth + childSpacing) - childSpacing;

  // Center the grid under the parent
  const startX = parentPosition.x - gridWidth / 2 + nodeWidth / 2;

  // Position below parent
  const startY = parentPosition.y + childOffsetY;

  return {
    x: startX + col * (nodeWidth + childSpacing),
    y: startY + row * (nodeHeight + childSpacing),
  };
};
