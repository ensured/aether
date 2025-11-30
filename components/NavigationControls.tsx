"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftCircle, Plus, RotateCcw, Eye, EyeOff } from "lucide-react";
import { ThemeToggleSimple } from "@/components/theme-toggle";

interface NavigationControlsProps {
  explorationHistoryLength: number;
  currentIndex: number;
  selectedRootId: string | null;
  isShowingAll: boolean;
  newRootNodeName: string;
  onSetNewRootNodeName: (name: string) => void;
  onNavigateBack: () => void;
  onReset: () => void;
  onToggleShowAll: () => void;
  onAddNewRootNode: () => void;
}

/**
 * Navigation controls for the concept explorer
 */
export const NavigationControls = ({
  explorationHistoryLength,
  currentIndex,
  selectedRootId,
  isShowingAll,
  newRootNodeName,
  onSetNewRootNodeName,
  onNavigateBack,
  onReset,
  onToggleShowAll,
  onAddNewRootNode,
}: NavigationControlsProps) => {
  const showBackButton = explorationHistoryLength > 0 && currentIndex >= 0;
  const showResetButton = currentIndex > 0;
  const showToggleButton =
    selectedRootId ||
    (explorationHistoryLength > 0 && currentIndex >= 0) ||
    isShowingAll;

  return (
    <div className="absolute top-4 left-4 right-4 z-50">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Title and controls */}
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Aether
            </h1>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {showBackButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNavigateBack}
                  className="h-8 px-2"
                  title="Go back"
                >
                  <ArrowLeftCircle className="h-4 w-4" />
                </Button>
              )}

              {showResetButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReset}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  title="Reset to root"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}

              {showToggleButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleShowAll}
                  className="h-8 px-3 gap-1.5"
                  title={isShowingAll ? "Hide all nodes" : "Show all nodes"}
                >
                  {isShowingAll ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span className="text-xs">Hide All</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Show All</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Add node input row */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add new concept..."
              value={newRootNodeName}
              onChange={(e) => onSetNewRootNodeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddNewRootNode();
                }
              }}
              className="h-9 w-64 text-sm"
            />
            <Button
              size="sm"
              onClick={onAddNewRootNode}
              disabled={!newRootNodeName.trim()}
              className="h-9 px-3 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground">
            Click any concept to explore its connections
          </p>
        </div>

        {/* Right side - Theme toggle and settings */}
        <div className="flex items-center gap-2">
          <ThemeToggleSimple />
        </div>
      </div>
    </div>
  );
};
