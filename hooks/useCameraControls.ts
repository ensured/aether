import { useCallback, useState, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { CustomNode } from "@/lib/types";
import { GRID_CONFIG, getResponsiveGridConfig } from "@/lib/constants";

export const useCameraControls = (isDragging = false) => {
  const { fitView, setCenter, getViewport } = useReactFlow();
  const [isPanning, setIsPanning] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pan to a specific position with smooth animation
  const panToPosition = useCallback(
    (x: number, y: number, zoom = 1, duration = 800) => {
      // Don't pan if user is currently dragging
      if (isDragging) {
        return;
      }

      setIsPanning(true);
      setCenter(x, y, { zoom, duration });

      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Reset panning state after animation completes
      animationTimeoutRef.current = setTimeout(
        () => setIsPanning(false),
        duration + 100,
      );
    },
    [setCenter, isDragging],
  );

  // Focus on a single node with appropriate zoom
  const focusOnNode = useCallback(
    (node: CustomNode, zoom = 1.2, duration = 800) => {
      // Don't focus if user is currently dragging
      if (isDragging) {
        return;
      }

      setIsPanning(true);
      setCenter(node.position.x, node.position.y, { zoom, duration });

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(
        () => setIsPanning(false),
        duration + 100,
      );
    },
    [setCenter, isDragging],
  );

  // Pan camera to focus on newly generated child nodes
  const panToNewNodes = useCallback(
    (parentNode: CustomNode, childNodes: CustomNode[], duration = 600) => {
      if (childNodes.length === 0) return;

      // Don't pan if user is currently dragging
      if (isDragging) {
        return;
      }

      setIsPanning(true);

      // Get responsive grid configuration
      const responsiveConfig = getResponsiveGridConfig();

      // Simplified calculation - just focus on the parent with a reasonable offset
      const parentX = parentNode.position.x;
      const parentY = parentNode.position.y;

      // Calculate a simple center point based on child positions
      let avgChildX = parentX;
      let avgChildY = parentY + responsiveConfig.childOffsetY + 100;

      if (childNodes.length > 0) {
        avgChildX =
          childNodes.reduce((sum, node) => sum + node.position.x, 0) /
          childNodes.length;
        avgChildY =
          childNodes.reduce((sum, node) => sum + node.position.y, 0) /
          childNodes.length;
      }

      // For mobile, adjust centering to account for wider grid spread
      const screenWidth = window.innerWidth;
      let centerX = (parentX + avgChildX) / 2;
      const centerY = (parentY + avgChildY) / 2;

      if (screenWidth < 640) {
        // Mobile - shift center to the right to compensate for wider grid
        const gridWidth = responsiveConfig.childNodesPerRow * (responsiveConfig.nodeWidth + responsiveConfig.childSpacing);
        centerX += gridWidth * 0.15; // Shift right by 15% of grid width
      } else if (screenWidth < 1024) {
        // Tablet - smaller adjustment for 3-column grid
        const gridWidth = responsiveConfig.childNodesPerRow * (responsiveConfig.nodeWidth + responsiveConfig.childSpacing);
        centerX += gridWidth * 0.08; // Shift right by 8% of grid width
      }

      // Use responsive zoom based on screen size
      let targetZoom = 1.4;

      if (screenWidth < 640) {
        // Mobile - zoom out even more to fit wider grid
        targetZoom = 0.6;
      } else if (screenWidth < 1024) {
        // Tablet - use a more conservative zoom for consistency
        targetZoom = 0.9;
      }
      // Desktop - keep original zoom

      // Smoothly animate to the new position and zoom
      setCenter(centerX, centerY, { zoom: targetZoom, duration });

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(
        () => setIsPanning(false),
        duration + 50,
      );
    },
    [setCenter, isDragging],
  );

  // Fit view to show all visible nodes
  const fitAllNodes = useCallback(
    (duration = 800, padding = 0.1) => {
      // Don't fit view if user is currently dragging
      if (isDragging) {
        return;
      }

      setIsPanning(true);
      fitView({ duration, padding });

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(
        () => setIsPanning(false),
        duration + 100,
      );
    },
    [fitView, isDragging],
  );

  // Pan to show a specific area defined by multiple nodes
  const panToNodeGroup = useCallback(
    (nodes: CustomNode[], duration = 800, padding = 80) => {
      if (nodes.length === 0) return;

      // Don't pan if user is currently dragging
      if (isDragging) {
        return;
      }

      setIsPanning(true);

      const positions = nodes.map((node) => node.position);
      const nodeWidth = GRID_CONFIG.nodeWidth;
      const nodeHeight = GRID_CONFIG.nodeHeight;

      const minX = Math.min(...positions.map((pos) => pos.x)) - padding;
      const maxX =
        Math.max(...positions.map((pos) => pos.x)) + nodeWidth + padding;
      const minY = Math.min(...positions.map((pos) => pos.y)) - padding;
      const maxY =
        Math.max(...positions.map((pos) => pos.y)) + nodeHeight + padding;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const boundingWidth = maxX - minX;
      const boundingHeight = maxY - minY;

      const containerWidth = window.innerWidth - 200;
      const containerHeight = window.innerHeight - 200;

      const zoomX = containerWidth / boundingWidth;
      const zoomY = containerHeight / boundingHeight;
      const targetZoom = Math.min(zoomX, zoomY, 2.0);
      const finalZoom = Math.max(targetZoom, 0.2);

      setCenter(centerX, centerY, { zoom: finalZoom, duration });

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(
        () => setIsPanning(false),
        duration + 100,
      );
    },
    [setCenter, isDragging],
  );

  // Get current viewport info
  const getCurrentViewport = useCallback(() => {
    return getViewport();
  }, [getViewport]);

  // Smooth zoom to a specific level
  const zoomToLevel = useCallback(
    (zoomLevel: number, duration = 600) => {
      // Don't zoom if user is currently dragging
      if (isDragging) {
        return;
      }

      setIsPanning(true);
      const viewport = getViewport();
      setCenter(viewport.x, viewport.y, { zoom: zoomLevel, duration });

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(
        () => setIsPanning(false),
        duration + 100,
      );
    },
    [getViewport, setCenter, isDragging],
  );

  return {
    panToPosition,
    focusOnNode,
    panToNewNodes,
    fitAllNodes,
    panToNodeGroup,
    getCurrentViewport,
    zoomToLevel,
    isPanning,
  };
};
