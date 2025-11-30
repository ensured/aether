"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftCircle,
  Plus,
  PlusCircle,
  RotateCcw,
  Menu,
  ChevronUp,
} from "lucide-react";
import { ThemeToggleSimple } from "@/components/theme-toggle";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile - Top navigation bar */}
      <div className="sm:hidden absolute top-4 left-4 right-4 z-50">
        <div className="backdrop-blur-sm bg-background/60 border border-border/15 rounded-lg">
          <Collapsible
            open={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
          >
            <div className="flex items-center justify-between p-0.5">
              {/* Left: Menu button */}
              <CollapsibleTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>

              {/* Center: Title or Navigation buttons */}
              <div className="flex items-center gap-1">
                {!showBackButton && !showResetButton ? (
                  <h1 className="text-lg font-bold tracking-tight">Concept Explorer</h1>
                ) : (
                  <>
                    {showBackButton && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onNavigateBack}
                        className="h-8 px-2 gap-1"
                      >
                        <ArrowLeftCircle className="h-4 w-4" />
                        <span className="text-xs">Back</span>
                      </Button>
                    )}
                    {showResetButton && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onReset}
                        className="h-8 px-2 gap-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="text-xs">Reset</span>
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Right: Theme toggle */}
              <ThemeToggleSimple />
            </div>

            {/* Collapsible content */}
            <CollapsibleContent className="px-0.5 pb-4 pt-1.5">
              <div className="space-y-2">
                {/* Add node input */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add new concept..."
                    value={newRootNodeName}
                    onChange={(e) => onSetNewRootNodeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onAddNewRootNode();
                      }
                    }}
                    className="h-9 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddNewRootNode}
                    disabled={!newRootNodeName.trim()}
                    className="h-9 px-2 gap-1"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Click any concept to explore its connections
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Desktop/Tablet - Full menu */}
      <div className="hidden sm:block absolute top-4 left-4 right-4 z-50 max-w-xs backdrop-blur-sm bg-background/50 border border-border rounded-lg">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Title and controls */}
          <div className="flex flex-col gap-1">
            {/* Header row */}
            <div className="flex items-center gap-1">
              <div className="flex items-center w-full p-2 gap-2.5">
                <h1 className="text-3xl font-bold tracking-tight">Aether</h1>
                <ThemeToggleSimple />
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1 mr-2.5">
                {showBackButton && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onNavigateBack}
                    className="h-9 px-2 gap-1"
                  >
                    <ArrowLeftCircle className="h-4 w-4" />
                  </Button>
                )}
                {showResetButton && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onReset}
                    className="h-9 px-2 gap-1"
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
                    onAddNewRootNode();
                  }
                }}
                className="h-9 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={onAddNewRootNode}
                disabled={!newRootNodeName.trim()}
                className="h-9 px-2 gap-1"
              >
                <Plus className="h-5! w-5!" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground flex items-center p-3">
              Click any concept to explore its connections
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
