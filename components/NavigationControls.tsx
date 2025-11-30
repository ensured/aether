"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowLeftCircle } from 'lucide-react';

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
    const showToggleButton = selectedRootId || (explorationHistoryLength > 0 && currentIndex >= 0) || isShowingAll;

    return (
        <div className="absolute top-6 left-6 z-50">
            <div className="flex items-center gap-4 mb-3">
                <h1 className="text-4xl font-bold tracking-tight">Concept Blocks</h1>
                {showBackButton && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onNavigateBack}
                        className="cursor-pointer px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                    >
                        <ArrowLeftCircle className="w-6! h-6!" />
                    </Button>
                )}
                {showResetButton && (
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onReset}
                        className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                    >
                        Reset
                    </Button>
                )}
                {showToggleButton && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleShowAll}
                        className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                    >
                        {isShowingAll ? 'Hide All' : 'Show All'}
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2 mb-2">
                <Input
                    placeholder="Add new root node..."
                    value={newRootNodeName}
                    onChange={(e) => onSetNewRootNodeName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onAddNewRootNode();
                        }
                    }}
                />
                <Button
                    size="sm"
                    onClick={onAddNewRootNode}
                    className="px-3 py-1 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-md transition-colors"
                >
                    Add
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">
                Click any node to explore ∞
            </p>
        </div>
    );
};
