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

      // Calculate the full bounds of the node group with extra padding
      let minX = parentX;
      let maxX = parentX;
      let minY = parentY;
      let maxY = parentY + responsiveConfig.childOffsetY + 100;

      if (childNodes.length > 0) {
        const childXPositions = childNodes.map(node => node.position.x);
        const childYPositions = childNodes.map(node => node.position.y);

        minX = Math.min(parentX, ...childXPositions) - 50; // Extra left padding
        maxX = Math.max(parentX, ...childXPositions) + responsiveConfig.nodeWidth + 50; // Extra right padding
        minY = Math.min(parentY, ...childYPositions) - 30; // Extra top padding
        maxY = Math.max(parentY, ...childYPositions) + responsiveConfig.nodeHeight + 30; // Extra bottom padding
      }

      // Calculate center of the full bounds
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Get screen width for responsive zoom
      const screenWidth = window.innerWidth;

      // Use responsive zoom based on screen size with more padding
      let targetZoom = 1.2; // Reduced from 1.4 for better visibility

      if (screenWidth < 640) {
        // Mobile - zoom out to fit wider grid with more padding
        targetZoom = 0.5; // Reduced from 0.6
      } else if (screenWidth < 1024) {
        // Tablet - moderate zoom with better centering
        targetZoom = 0.8; // Reduced from 0.9
      }

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

      const containerWidth = window.innerWidth - 100; // Reduced padding for better fit
      const containerHeight = window.innerHeight - 100; // Reduced padding for better fit

      const zoomX = containerWidth / boundingWidth;
      const zoomY = containerHeight / boundingHeight;
      const targetZoom = Math.min(zoomX, zoomY, 2.0);
      const finalZoom = Math.max(targetZoom, 0.3); // Increased minimum zoom for better visibility

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
