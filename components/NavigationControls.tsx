"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftCircle, Plus, PlusCircle, RotateCcw } from "lucide-react";
import { ThemeToggleSimple } from "@/components/theme-toggle";

interface NavigationControlsProps {
  explorationHistoryLength: number;
  currentIndex: number;
  selectedRootId: string | null;
  newRootNodeName: string;
  onSetNewRootNodeName: (name: string) => void;
  onNavigateBack: () => void;
  onReset: () => void;
  onAddNewRootNode: () => void;
}

/**
 * Navigation controls for the concept explorer
 */
export const NavigationControls = ({
  explorationHistoryLength,
  currentIndex,
  selectedRootId,
  newRootNodeName,
  onSetNewRootNodeName,
  onNavigateBack,
  onReset,
  onAddNewRootNode,
}: NavigationControlsProps) => {
  const showBackButton = explorationHistoryLength > 0 && currentIndex >= 0;
  const showResetButton = currentIndex > 0;

  return (
    <div className="absolute top-4 left-4 right-4 z-50 max-w-xs backdrop-blur-sm bg-background/50 border border-border rounded-lg">
      <div className="flex items-start justify-between gap-4 ">
        {/* Left side - Title and controls */}
        <div className="flex flex-col gap-1 ">
          {/* Header row */}
          <div className="flex items-center gap-1 ">
            <div className="flex items-center w-full p-2 gap-2.5">
              <h1 className="text-3xl font-bold tracking-tight">Aether</h1>
              <ThemeToggleSimple />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1 mr-2.5">
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
            </div>
          </div>

          {/* Add node input row */}
          <div className="flex items-center gap-1 px-2">
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
              variant={"outline"}
              onClick={onAddNewRootNode}
              disabled={!newRootNodeName.trim()}
              className="h-9 px-2 gap-1"
            >
              <Plus className="h-5! w-5!" />
            </Button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground flex items-center p-3">
            Click any concept to explore its connections
          </p>
        </div>
      </div>
    </div>
  );
};
