import { useEffect, useCallback } from "react";
import { useCameraControls } from "./useCameraControls";

export const useKeyboardShortcuts = (
  onToggleHelp?: () => void,
  isDragging = false,
) => {
  const { fitAllNodes, zoomToLevel, getCurrentViewport, panToPosition } =
    useCameraControls(isDragging);

  // Reset view to fit all nodes
  const resetView = useCallback(() => {
    fitAllNodes(800, 0.1);
  }, [fitAllNodes]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    const viewport = getCurrentViewport();
    const newZoom = Math.min(viewport.zoom * 1.3, 3);
    zoomToLevel(newZoom, 400);
  }, [getCurrentViewport, zoomToLevel]);

  const zoomOut = useCallback(() => {
    const viewport = getCurrentViewport();
    const newZoom = Math.max(viewport.zoom * 0.7, 0.1);
    zoomToLevel(newZoom, 400);
  }, [getCurrentViewport, zoomToLevel]);

  // Pan functions
  const panUp = useCallback(() => {
    const viewport = getCurrentViewport();
    panToPosition(viewport.x, viewport.y - 100, viewport.zoom, 300);
  }, [getCurrentViewport, panToPosition]);

  const panDown = useCallback(() => {
    const viewport = getCurrentViewport();
    panToPosition(viewport.x, viewport.y + 100, viewport.zoom, 300);
  }, [getCurrentViewport, panToPosition]);

  const panLeft = useCallback(() => {
    const viewport = getCurrentViewport();
    panToPosition(viewport.x - 100, viewport.y, viewport.zoom, 300);
  }, [getCurrentViewport, panToPosition]);

  const panRight = useCallback(() => {
    const viewport = getCurrentViewport();
    panToPosition(viewport.x + 100, viewport.y, viewport.zoom, 300);
  }, [getCurrentViewport, panToPosition]);

  // Zoom to specific levels
  const zoomTo100 = useCallback(() => {
    zoomToLevel(1, 600);
  }, [zoomToLevel]);

  const zoomTo150 = useCallback(() => {
    zoomToLevel(1.5, 600);
  }, [zoomToLevel]);

  const zoomTo50 = useCallback(() => {
    zoomToLevel(0.5, 600);
  }, [zoomToLevel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === "true"
      ) {
        return;
      }

      // Don't trigger shortcuts if user is dragging nodes
      if (isDragging) {
        return;
      }

      // Handle different key combinations
      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModPressed = ctrlKey || metaKey;

      switch (key.toLowerCase()) {
        // Reset view
        case "r":
          if (!isModPressed) {
            event.preventDefault();
            resetView();
          }
          break;

        // Zoom controls
        case "=":
        case "+":
          event.preventDefault();
          if (isModPressed) {
            zoomIn();
          }
          break;

        case "-":
        case "_":
          event.preventDefault();
          if (isModPressed) {
            zoomOut();
          }
          break;

        // Zoom to specific levels
        case "0":
          if (isModPressed) {
            event.preventDefault();
            zoomTo100();
          }
          break;

        case "1":
          if (isModPressed && shiftKey) {
            event.preventDefault();
            zoomTo150();
          }
          break;

        case "5":
          if (isModPressed && shiftKey) {
            event.preventDefault();
            zoomTo50();
          }
          break;

        // Pan with arrow keys (when Shift is held)
        case "arrowup":
          if (shiftKey && !isModPressed) {
            event.preventDefault();
            panUp();
          }
          break;

        case "arrowdown":
          if (shiftKey && !isModPressed) {
            event.preventDefault();
            panDown();
          }
          break;

        case "arrowleft":
          if (shiftKey && !isModPressed) {
            event.preventDefault();
            panLeft();
          }
          break;

        case "arrowright":
          if (shiftKey && !isModPressed) {
            event.preventDefault();
            panRight();
          }
          break;

        // Alternative pan controls with WASD
        case "w":
          if (!isModPressed && !shiftKey) {
            event.preventDefault();
            panUp();
          }
          break;

        case "s":
          if (!isModPressed && !shiftKey) {
            event.preventDefault();
            panDown();
          }
          break;

        case "a":
          if (!isModPressed && !shiftKey) {
            event.preventDefault();
            panLeft();
          }
          break;

        case "d":
          if (!isModPressed && !shiftKey) {
            event.preventDefault();
            panRight();
          }
          break;

        // Fit view
        case "f":
          if (!isModPressed) {
            event.preventDefault();
            fitAllNodes(800, 0.05);
          }
          break;

        // Help toggle
        case "?":
        case "/":
          if (!isModPressed && onToggleHelp) {
            event.preventDefault();
            onToggleHelp();
          }
          break;

        default:
          break;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    resetView,
    zoomIn,
    zoomOut,
    panUp,
    panDown,
    panLeft,
    panRight,
    zoomTo100,
    zoomTo150,
    zoomTo50,
    fitAllNodes,
    onToggleHelp,
    isDragging,
  ]);

  return {
    // Expose functions for programmatic use
    resetView,
    zoomIn,
    zoomOut,
    panUp,
    panDown,
    panLeft,
    panRight,
    zoomTo100,
    zoomTo150,
    zoomTo50,
  };
};

// Hook that provides keyboard shortcut information for help display
export const useKeyboardShortcutHelp = () => {
  const shortcuts = [
    { keys: ["R"], description: "Reset view to show all nodes" },
    { keys: ["F"], description: "Fit all visible nodes" },
    { keys: ["Ctrl/Cmd", "+"], description: "Zoom in" },
    { keys: ["Ctrl/Cmd", "-"], description: "Zoom out" },
    { keys: ["Ctrl/Cmd", "0"], description: "Reset zoom to 100%" },
    { keys: ["Ctrl/Cmd", "Shift", "1"], description: "Zoom to 150%" },
    { keys: ["Ctrl/Cmd", "Shift", "5"], description: "Zoom to 50%" },
    { keys: ["W", "A", "S", "D"], description: "Pan camera" },
    { keys: ["Shift", "↑↓←→"], description: "Pan camera with arrow keys" },
  ];

  return { shortcuts };
};
