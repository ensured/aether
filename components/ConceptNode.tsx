"use client";

import { useState, useEffect } from "react";
import { Info, Trash2, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomNode } from "@/lib/types";
import { ROOT_NODES, GRID_CONFIG } from "@/lib/constants";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { useNodeContext } from "@/components/NodeContext";

/**
 * Renders a topic node with info dialog, delete functionality, and entry animations
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
    onDialogInteraction,
  } = useNodeContext();

  // Reconstruct node object for callbacks
  const node = { id, data, position: { x: 0, y: 0 } } as CustomNode;

  const isCustomRootNode =
    rootNodes.some((rootNode) => rootNode.id === id) &&
    !ROOT_NODES.some((originalNode) => originalNode.id === id);

  // Use cache status passed from parent
  const cacheStatus = data.cacheStatus;

  // Track if this component has been mounted (to prevent re-animations)
  const [hasAnimated, setHasAnimated] = useState(false);

  // Check if this node should animate (only truly new nodes that haven't animated yet)
  const shouldAnimate = data.isNew === true && !hasAnimated;

  // Get animation index for staggered animations (default to 0)
  const animationIndex = (data.animationIndex as number) ?? 0;
  const staggerDelay = animationIndex * 0.05; // 50ms stagger between each node

  // Client-side cache countdown state
  const [cacheMinutesLeft, setCacheMinutesLeft] = useState<number | null>(null);

  // Update cache countdown every minute
  useEffect(() => {
    if (cacheStatus?.isCached && cacheStatus.expiresInMinutes) {
      // Initialize with server value
      setCacheMinutesLeft(cacheStatus.expiresInMinutes);

      // Set up countdown timer
      const interval = setInterval(() => {
        setCacheMinutesLeft((prev) => {
          if (prev === null || prev <= 1) return null; // Clear when expired
          return prev - 1;
        });
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    } else {
      setCacheMinutesLeft(null);
    }
  }, [cacheStatus?.isCached, cacheStatus?.expiresInMinutes]);

  // Mark animation as complete after mount
  useEffect(() => {
    if (data.isNew && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, staggerDelay * 1000 + 500); // Wait for animation to complete
      return () => clearTimeout(timer);
    }
  }, [data.isNew, hasAnimated, staggerDelay]);

  // Animation variants for the node
  const nodeVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -20,
    },
    visible: (delay: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        mass: 0.8,
        delay: delay,
      },
    }),
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 20,
      },
    },
    tap: {
      scale: 0.98,
    },
  };

  // Loading pulse animation
  const loadingVariants = {
    loading: {
      boxShadow: [
        "0 0 0 0 rgba(255, 255, 255, 0)",
        "0 0 0 4px rgba(255, 255, 255, 0.3)",
        "0 0 0 0 rgba(255, 255, 255, 0)",
      ],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  // Check if currently loading
  const isLoading = loadingNodeId === id;

  // Determine text color based on background brightness
  const getTextColor = (colorClass: string) => {
    // Only yellow-400 needs dark text, all other palette colors work with white text
    return colorClass.includes("bg-yellow-400")
      ? "text-gray-900"
      : "text-white";
  };

  const textColor = getTextColor(data.color || "bg-slate-600");

  return (
    <motion.div
      className={`relative ${
        data.color || "bg-slate-600"
      } ${textColor} rounded-lg shadow-lg py-2 px-3 cursor-pointer ${
        isLoading
          ? "ring-2 ring-white/50 ring-offset-2 ring-offset-transparent"
          : ""
      }`}
      style={{
        width: GRID_CONFIG.nodeWidth,
        minHeight: GRID_CONFIG.nodeHeight,
        maxHeight: 90, // Allow for up to 3 lines
      }}
      variants={nodeVariants}
      initial={shouldAnimate ? "hidden" : "visible"}
      animate={isLoading ? "loading" : "visible"}
      custom={staggerDelay}
      whileHover={isLoading ? undefined : "hover"}
      whileTap={isLoading ? undefined : "tap"}
      layout
    >
      {/* Animated glow effect when loading */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/10"
          variants={loadingVariants}
          animate="loading"
          initial={{ opacity: 0 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Target handle at top for incoming edges */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="bg-white/50! border-white! w-2! h-2! min-w-0! min-h-0!"
        style={{ top: -4 }}
      />

      <div className="relative z-10">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {isLoading && (
              <motion.div
                className="mt-0.5"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{
                  rotate: { duration: 0.7, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <Loader2
                  className={`w-4 h-4 shrink-0 drop-shadow-md ${
                    textColor === "text-white" ? "text-white" : "text-gray-900"
                  }`}
                />
              </motion.div>
            )}
            <motion.span
              className="font-medium text-sm leading-tight line-clamp-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {data.label}
            </motion.span>
          </div>

          {/* Action buttons */}
          <motion.div
            className="flex items-start gap-1 shrink-0 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-6 w-6 transition-colors ${
                    textColor === "text-white"
                      ? "hover:bg-white/20 hover:text-white"
                      : "hover:bg-gray-900/20 hover:text-gray-900"
                  }`}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onOpenDialog(node);
                  }}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-[500px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onPointerDownOutside={() => {
                  onDialogInteraction();
                }}
                onInteractOutside={() => {
                  onDialogInteraction();
                }}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl">{data.label}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* About section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      About this topic
                    </h4>
                    {isLoadingInfo ? (
                      <div className="space-y-2">
                        {/* Skeleton lines to match 182px height */}
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{nodeInfo}</p>
                    )}
                  </div>

                  {/* Question section */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="question"
                      className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      Ask a question
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="question"
                        placeholder="What would you like to know?"
                        value={question}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          onSetQuestion(e.target.value)
                        }
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement>
                        ) => {
                          if (e.key === "Enter" && !e.shiftKey) {
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
                          "Ask"
                        )}
                      </Button>
                    </div>

                    {/* Answer display */}
                    {questionAnswer && (
                      <motion.div
                        className="mt-4 p-4 bg-muted rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Label className="text-sm font-semibold mb-2 block">
                          Answer
                        </Label>
                        <p className="text-sm leading-relaxed">
                          {questionAnswer}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {isCustomRootNode && (
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 transition-colors ${
                  textColor === "text-white"
                    ? "hover:bg-white/20 text-white"
                    : "hover:bg-gray-900/20 text-gray-900"
                }`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onRemoveNode(id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Cache duration indicator at bottom right */}
      {(cacheStatus?.isCached || cacheMinutesLeft !== null || true) && (
        <motion.div
          className={`absolute bottom-2 right-2 text-[10px] ${
            textColor === "text-white" ? "opacity-70" : "opacity-60"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span>
            {cacheMinutesLeft !== null
              ? `cached for ${cacheMinutesLeft} min`
              : cacheStatus?.isCached
              ? `cached for ${cacheStatus.expiresInMinutes} min`
              : "No cache"}
          </span>
        </motion.div>
      )}

      {/* Source handle at bottom for outgoing edges */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="bg-white/50! border-white! w-2! h-2! min-w-0! min-h-0!"
        style={{ bottom: -4 }}
      />
    </motion.div>
  );
};
