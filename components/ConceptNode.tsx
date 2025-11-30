"use client";

import { Info, Trash2, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomNode } from '@/lib/types';
import { ROOT_NODES, GRID_CONFIG } from '@/lib/constants';
import { NodeProps } from '@xyflow/react';
import { useNodeContext } from '@/components/NodeContext';

/**
 * Renders a concept node with info dialog and delete functionality
 */
export const ConceptNode = ({ id, data }: NodeProps<CustomNode>) => {
    const {
        loadingNodeId,
        rootNodes,
        nodeInfo,
        question,
        questionAnswer,
        isLoadingInfo,
        isLoadingQuestion,
        onSetQuestion,
        onRemoveNode,
        onOpenDialog,
        onAskQuestion,
    } = useNodeContext();

    // Reconstruct node object for callbacks
    const node = { id, data, position: { x: 0, y: 0 } } as CustomNode;

    const isCustomRootNode = rootNodes.some(rootNode => rootNode.id === id) &&
        !ROOT_NODES.some(originalNode => originalNode.id === id);

    // Use cache status passed from parent
    const cacheStatus = data.cacheStatus;

    return (
        <div
            className={`relative ${data.color} text-white rounded-md shadow-lg hover:shadow-xl transition-shadow py-1 px-2`}
            style={{ width: GRID_CONFIG.nodeWidth }}
        >
            <div className="">
                {/* Header with title and actions */}
                <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {loadingNodeId === id && (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        )}
                        <span className="font-medium text-sm ">{data.label}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 hover:bg-white/20 hover:text-white"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onOpenDialog(node);
                                    }}
                                >
                                    <Info className="w-4.5 h-4.5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                                <DialogHeader>
                                    <DialogTitle className="text-xl">{data.label}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    {/* About section */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            About this concept
                                        </h4>
                                        {isLoadingInfo ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Loading information...</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed">{nodeInfo}</p>
                                        )}
                                    </div>

                                    {/* Question section */}
                                    <div className="space-y-3">
                                        <Label htmlFor="question" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            Ask a question
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="question"
                                                placeholder="What would you like to know?"
                                                value={question}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetQuestion(e.target.value)}
                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        onAskQuestion(node, question);
                                                    }
                                                }}
                                                className="flex-1"
                                            />
                                            <Button
                                                size="default"
                                                onClick={() => onAskQuestion(node, question)}
                                                disabled={isLoadingQuestion || !question.trim()}
                                            >
                                                {isLoadingQuestion ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Ask'
                                                )}
                                            </Button>
                                        </div>

                                        {/* Answer display */}
                                        {questionAnswer && (
                                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                                <Label className="text-sm font-semibold mb-2 block">Answer</Label>
                                                <p className="text-sm leading-relaxed">{questionAnswer}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {isCustomRootNode && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-white/20 text-white"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onRemoveNode(id);
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Cache status indicator */}
                {cacheStatus?.isCached && (
                    <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 opacity-70" />
                        <span className="text-[10px] opacity-70">
                            Cached • {cacheStatus.expiresInMinutes}m left
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
