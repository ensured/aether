// src/app/page.tsx
"use client";

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "@xyflow/react";
import {
  useCallback,
  useState,
  useTransition,
  useEffect,
  useMemo,
  memo,
} from "react";
import "@xyflow/react/dist/style.css";

// Custom components
import AnimatedEdge from "@/components/AnimatedEdge";

// Server actions
import { getChildConcepts } from "@/actions/groqActions";

// Components
import { ConceptNode } from "@/components/ConceptNode";
import { NavigationControls } from "@/components/NavigationControls";
import { NodeContext } from "@/components/NodeContext";
import { DotCameraPanningIndicator } from "@/components/CameraPanningIndicator";
import {
  KeyboardShortcutsHelp,
  KeyboardShortcutsButton,
  useKeyboardShortcutsHelp,
} from "@/components/KeyboardShortcutsHelp";

// Hooks
import { useNodeInfo } from "@/hooks/useNodeInfo";
import { useExplorationHistory } from "@/hooks/useExplorationHistory";
import { useCameraControls } from "@/hooks/useCameraControls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

// Utils & Types
import { Edge } from "@xyflow/react";
import { CustomNode, RootNodeConfig } from "@/lib/types";
import { ROOT_NODES, COLORS } from "@/lib/constants";
import {
  calculateGridPosition,
  calculateChildPosition,
  getOptimalChildrenPerRow,
} from "@/lib/utils/node-utils";
import { getChildColor } from "@/lib/utils/color-utils";
import { loadCustomNodes, saveCustomNodes } from "@/lib/utils/storage";

const FlowWithControls = memo(() => {
  // State management
  const [rootNodes, setRootNodes] = useState<RootNodeConfig[]>(() => [
    ...ROOT_NODES,
    ...loadCustomNodes(),
  ]);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [newRootNodeName, setNewRootNodeName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [lastDialogInteraction, setLastDialogInteraction] = useState(0);
  const [viewportDimensions, setViewportDimensions] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  }));

  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Camera controls
  const { panToNewNodes, fitAllNodes, panToPosition, isPanning } =
    useCameraControls(isDragging);

  // Custom hooks
  const {
    explorationHistory,
    addToHistory,
    navigateBack: navigateBackHistory,
    resetHistory,
    updateHistory,
  } = useExplorationHistory();
  const {
    nodeInfo,
    question,
    questionAnswer,
    isLoadingInfo,
    isLoadingQuestion,
    setQuestion,
    getNodeInfo,
    askQuestion,
    resetInfo,
  } = useNodeInfo();

  // Help system
  const { isHelpOpen, toggleHelp, closeHelp } = useKeyboardShortcutsHelp();

  // Keyboard shortcuts
  useKeyboardShortcuts(toggleHelp, isDragging);

  // Define node types (memoized to prevent re-creation)
  const nodeTypes = useMemo(
    () => ({
      concept: ConceptNode,
    }),
    []
  );

  // Define edge types (memoized to prevent re-creation)
  const edgeTypes = useMemo(
    () => ({
      animated: AnimatedEdge,
    }),
    []
  );

  // Initialize nodes
  const getInitialNodes = useCallback(() => {
    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
    return allRootNodes.map((node, i) => ({
      id: node.id,
      type: "concept",
      position: calculateGridPosition(i, {
        totalNodes: allRootNodes.length,
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
      }),
      data: {
        label: node.name,
        color: node.color,
        path: [node.name],
        childrenLoaded: false,
      },
    }));
  }, [viewportDimensions]);

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>(
    getInitialNodes()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Save custom nodes to localStorage
  useEffect(() => {
    const customOnly = rootNodes.filter(
      (node) => !ROOT_NODES.some((originalNode) => originalNode.id === node.id)
    );
    saveCustomNodes(customOnly);
  }, [rootNodes]);

  // Fit view to all nodes on initial mount
  useEffect(() => {
    // Only run on initial mount when no root is selected and no exploration history
    if (!selectedRootId && explorationHistory.states.length === 0) {
      // Small delay to ensure ReactFlow is fully initialized
      setTimeout(() => {
        fitAllNodes(800, 0.05);
      }, 100);
    }
  }, [fitAllNodes, selectedRootId, explorationHistory.states.length]);

  // Handle opening dialog for a node
  const handleNodeDialog = useCallback(
    (node: CustomNode) => {
      resetInfo();
      getNodeInfo(node);
    },
    [getNodeInfo, resetInfo]
  );

  // Fetch cache statuses for nodes with debouncing
  const fetchCacheStatuses = useCallback(
    async (nodesToFetch: CustomNode[]) => {
      if (nodesToFetch.length === 0) return;

      // Process in smaller batches to avoid overwhelming the API
      const batchSize = 6;
      const batches: CustomNode[][] = [];
      for (let i = 0; i < nodesToFetch.length; i += batchSize) {
        batches.push(nodesToFetch.slice(i, i + batchSize));
      }

      // Process batches with delays to prevent API overload
      for (let i = 0; i < batches.length; i++) {
        setTimeout(async () => {
          try {
            const batch = batches[i];
            const response = await fetch("/api/cache-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                batch.map((n: CustomNode) => ({
                  topic: n.data.label,
                  path: n.data.path,
                }))
              ),
            });

            const results = await response.json();

            setNodes((nds) =>
              nds.map((node) => {
                const result = results.find(
                  (r: { topic: string }) => r.topic === node.data.label
                );
                if (result && !node.data.cacheStatus) {
                  return {
                    ...node,
                    data: { ...node.data, cacheStatus: result },
                  };
                }
                return node;
              })
            );
          } catch (error) {
            console.error(
              `Error fetching cache statuses for batch ${i}:`,
              error
            );
          }
        }, i * 200); // Stagger requests by 200ms
      }
    },
    [setNodes]
  );

  // Initial cache fetch with better debouncing
  useEffect(() => {
    const nodesWithoutCache = nodes.filter((n) => !n.data.cacheStatus);
    if (nodesWithoutCache.length > 0) {
      // Longer debounce to prevent excessive API calls
      const timer = setTimeout(() => {
        fetchCacheStatuses(nodesWithoutCache);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fetchCacheStatuses]);

  // Load children for any node
  const loadChildrenForNode = useCallback(
    async (clickedNode: CustomNode) => {
      try {
        // Note: setLoadingNodeId is now called immediately in onNodeClick for optimistic UI
        // We don't set it here to avoid any delay from startTransition

        const children = await getChildConcepts(
          clickedNode.data.label as string,
          clickedNode.data.path
        );

        // Limit to maximum 12 nodes for performance
        const limitedChildren = children.slice(0, 12);

        // Calculate optimal layout based on number of children
        const optimalPerRow = getOptimalChildrenPerRow(limitedChildren.length);

        const newNodes = limitedChildren.map((child: string, i: number) => ({
          id: `${clickedNode.id}-${i}`,
          type: "concept",
          position: calculateChildPosition(
            clickedNode.position,
            i,
            limitedChildren.length,
            { maxPerRow: optimalPerRow }
          ),
          data: {
            label: child,
            // Get lighter shade based on depth in the tree
            color: getChildColor(clickedNode.data.color, [
              ...clickedNode.data.path,
              child,
            ]),
            path: [...clickedNode.data.path, child],
            childrenLoaded: false,
            animationIndex: i, // For staggered entry animations
            isNew: true, // Flag for entry animation (only new nodes animate)
          },
        }));

        const newEdges = limitedChildren.map((_: string, i: number) => ({
          id: `e-${clickedNode.id}-${i}`,
          source: clickedNode.id,
          target: `${clickedNode.id}-${i}`,
          type: "animated", // Use custom animated edge
          style: {
            stroke: "rgba(148, 163, 184, 0.6)",
            strokeWidth: 1.5,
          },
          sourceHandle: "bottom",
          targetHandle: "top",
        }));

        // Batch state updates using React's automatic batching
        startTransition(() => {
          setNodes((nds) => [
            ...nds.map((n) =>
              n.id === clickedNode.id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      childrenLoaded: true,
                      // Add immediate cache status - concepts are cached for 60 minutes
                      cacheStatus: {
                        isCached: true,
                        timestamp: Date.now(),
                        expiresIn: 60 * 60 * 1000, // 60 minutes in ms
                        expiresInMinutes: 60,
                      },
                    },
                  }
                : n
            ),
            ...newNodes,
          ]);
          setEdges((eds) => [...eds, ...newEdges]);
        });

        // Delay expensive operations until after render
        setTimeout(() => {
          // Pan camera first for immediate visual feedback
          panToNewNodes(clickedNode, newNodes);

          // Fetch cache for new nodes after a longer delay
          setTimeout(() => {
            fetchCacheStatuses(newNodes);
          }, 300);
        }, 150);
      } catch (error) {
        console.error("Error loading children:", error);
      } finally {
        // Clear loading state after a delay to prevent flicker
        setTimeout(() => {
          setLoadingNodeId(null);
        }, 150);
      }
    },
    [setNodes, setEdges, fetchCacheStatuses, panToNewNodes, startTransition]
  );

  // Handle node drag start
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle node drag stop
  const onNodeDragStop = useCallback(() => {
    // Add a small delay to prevent immediate click triggers after dragging
    setTimeout(() => {
      setIsDragging(false);
    }, 150);
  }, []);

  // Handle node click
  const onNodeClick = useCallback(
    (event: React.MouseEvent, clickedNode: CustomNode) => {
      // Prevent click handling if we just finished dragging
      if (isDragging) {
        return;
      }

      // Prevent click handling if recent dialog interaction (prevents bubbling after closing dialog)
      if (Date.now() - lastDialogInteraction < 300) {
        return;
      }
      // If this is a root node, toggle selection
      if (rootNodes.some((node) => node.id === clickedNode.id)) {
        const wasSelected = selectedRootId === clickedNode.id;
        setSelectedRootId(wasSelected ? null : clickedNode.id);

        if (!wasSelected) {
          updateHistory(() => ({
            states: [
              {
                nodeId: clickedNode.id,
                selectedRootId: clickedNode.id,
              },
            ],
            currentIndex: 0,
          }));

          // Load children if not already loaded
          if (!clickedNode.data.childrenLoaded && !loadingNodeId) {
            // Immediately show loading spinner (optimistic UI)
            setLoadingNodeId(clickedNode.id);
            startTransition(() => loadChildrenForNode(clickedNode));
          }
        } else {
          resetHistory();
        }
        return;
      }

      // For non-root nodes
      if (clickedNode.data.childrenLoaded || loadingNodeId) return;

      // Immediately show loading spinner (optimistic UI)
      setLoadingNodeId(clickedNode.id);

      // Update exploration history
      addToHistory({
        nodeId: clickedNode.id,
        selectedRootId: clickedNode.id,
      });

      startTransition(() => loadChildrenForNode(clickedNode));
    },
    [
      loadingNodeId,
      rootNodes,
      selectedRootId,
      startTransition,
      loadChildrenForNode,
      addToHistory,
      updateHistory,
      resetHistory,
      isDragging,
      lastDialogInteraction,
    ]
  );

  // Reset to root view
  const resetToRoot = useCallback(() => {
    setSelectedRootId(null);
    resetHistory();

    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
    setRootNodes(allRootNodes);

    const resetNodes = allRootNodes.map((rootNode, i) => ({
      id: rootNode.id,
      type: "concept",
      position: calculateGridPosition(i, {
        totalNodes: allRootNodes.length,
        viewportWidth: viewportDimensions.width,
        viewportHeight: viewportDimensions.height,
      }),
      data: {
        label: rootNode.name,
        color: rootNode.color,
        path: [rootNode.name],
        childrenLoaded: false,
      },
    }));

    setNodes(resetNodes);
    setEdges([]);

    // Fit view to show all root nodes
    setTimeout(() => {
      fitAllNodes(800, 0.1);
    }, 100);
  }, [setNodes, setEdges, resetHistory, fitAllNodes, viewportDimensions]);

  // Navigate back in history
  const navigateBack = useCallback(() => {
    navigateBackHistory(() => {
      resetToRoot();
    });

    // Update selected root based on new current index
    if (explorationHistory.currentIndex > 0) {
      const previousState =
        explorationHistory.states[explorationHistory.currentIndex - 1];
      setSelectedRootId(previousState.selectedRootId);
    }
  }, [navigateBackHistory, resetToRoot, explorationHistory]);

  // Recalculate node positions
  const recalculateNodePositions = useCallback(
    (allRootNodes: RootNodeConfig[], currentNodes: CustomNode[]) => {
      return allRootNodes.map((rootNode, i) => {
        const existingNode = currentNodes.find(
          (node) => node.id === rootNode.id
        );

        return {
          id: rootNode.id,
          type: "concept",
          position: calculateGridPosition(i, {
            totalNodes: allRootNodes.length,
            viewportWidth: viewportDimensions.width,
            viewportHeight: viewportDimensions.height,
          }),
          data: {
            label: rootNode.name,
            color: rootNode.color,
            path: [rootNode.name],
            childrenLoaded: existingNode?.data?.childrenLoaded || false,
          },
        };
      });
    },
    [viewportDimensions]
  );

  // Remove custom root node
  const removeCustomRootNode = useCallback(
    (nodeId: string) => {
      if (ROOT_NODES.some((node) => node.id === nodeId)) return;

      setRootNodes((prev) => prev.filter((node) => node.id !== nodeId));

      setNodes((prev) => {
        const nodesToRemove = new Set([nodeId]);

        const findDescendants = (parentId: string) => {
          prev.forEach((node) => {
            const edge = edges.find(
              (e) => e.source === parentId && e.target === node.id
            );
            if (edge) {
              nodesToRemove.add(node.id);
              findDescendants(node.id);
            }
          });
        };

        findDescendants(nodeId);
        return prev.filter((node) => !nodesToRemove.has(node.id));
      });

      setEdges((prev) => {
        const edgesToRemove = new Set<string>();

        const findRelatedEdges = (nodeId: string) => {
          prev.forEach((edge) => {
            if (edge.source === nodeId || edge.target === nodeId) {
              edgesToRemove.add(edge.id);
              if (edge.target !== nodeId) {
                findRelatedEdges(edge.target);
              }
            }
          });
        };

        findRelatedEdges(nodeId);
        return prev.filter((edge) => !edgesToRemove.has(edge.id));
      });

      if (selectedRootId === nodeId) {
        setSelectedRootId(null);
        resetHistory();
      }

      updateHistory((prev) => ({
        states: prev.states.filter((state) => state.nodeId !== nodeId),
        currentIndex: prev.currentIndex,
      }));
    },
    [edges, selectedRootId, setNodes, setEdges, resetHistory, updateHistory]
  );

  // Add new root node
  const addNewRootNode = useCallback(() => {
    if (!newRootNodeName.trim()) return;

    const newNodeId = `custom-${Date.now()}`;
    const colorIndex = rootNodes.length % COLORS.length;
    const color = COLORS[colorIndex];

    const newRootNode = {
      id: newNodeId,
      name: newRootNodeName.trim(),
      color,
    };

    const updatedRootNodes = [...rootNodes, newRootNode];
    setRootNodes(updatedRootNodes);

    const updatedNodes = recalculateNodePositions(updatedRootNodes, nodes);

    const existingNonRootNodes = nodes.filter(
      (node) => !rootNodes.some((rootNode) => rootNode.id === node.id)
    );

    setNodes([...updatedNodes, ...existingNonRootNodes]);
    setNewRootNodeName("");

    // Pan to show the new node
    setTimeout(() => {
      const newNodePosition = calculateGridPosition(
        updatedRootNodes.length - 1
      );
      panToPosition(newNodePosition.x, newNodePosition.y, 1, 800);
    }, 100);
  }, [
    newRootNodeName,
    rootNodes,
    nodes,
    recalculateNodePositions,
    setNodes,
    panToPosition,
  ]);

  // Filter visible nodes
  const visibleNodes = nodes.filter((node) => {
    if (!selectedRootId) return true;
    if (node.id === selectedRootId) return true;
    if (explorationHistory.states.some((state) => state.nodeId === node.id))
      return true;

    if (explorationHistory.currentIndex >= 0) {
      const mostRecentState =
        explorationHistory.states[explorationHistory.currentIndex];
      if (mostRecentState) {
        const isChild = edges.some(
          (edge) =>
            edge.source === mostRecentState.nodeId && edge.target === node.id
        );
        if (isChild) return true;
      }
    }

    return false;
  });

  // Context value (memoized to prevent unnecessary re-renders)
  const nodeContextValue = useMemo(
    () => ({
      loadingNodeId,
      rootNodes,
      nodeInfo,
      question,
      questionAnswer,
      isLoadingInfo,
      isLoadingQuestion,
      onSetQuestion: setQuestion,
      onRemoveNode: removeCustomRootNode,
      onOpenDialog: handleNodeDialog,
      onAskQuestion: askQuestion,
      onDialogInteraction: () => setLastDialogInteraction(Date.now()),
    }),
    [
      loadingNodeId,
      rootNodes,
      nodeInfo,
      question,
      questionAnswer,
      isLoadingInfo,
      isLoadingQuestion,
      setQuestion,
      removeCustomRootNode,
      handleNodeDialog,
      askQuestion,
    ]
  );

  return (
    <div className="w-screen h-screen relative">
      <DotCameraPanningIndicator isVisible={isPanning} />
      <KeyboardShortcutsButton onClick={toggleHelp} />
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={closeHelp} />

      <NavigationControls
        explorationHistoryLength={explorationHistory.states.length}
        currentIndex={explorationHistory.currentIndex}
        selectedRootId={selectedRootId}
        newRootNodeName={newRootNodeName}
        onSetNewRootNodeName={setNewRootNodeName}
        onNavigateBack={navigateBack}
        onReset={resetToRoot}
        onAddNewRootNode={addNewRootNode}
      />

      <NodeContext.Provider value={nodeContextValue}>
        <ReactFlow
          nodes={visibleNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={true}
          panOnScroll={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          preventScrolling={false}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={4}
          attributionPosition="bottom-left"
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          onlyRenderVisibleElements={true}
          elevateNodesOnSelect={false}
          snapToGrid={false}
          snapGrid={[15, 15]}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--muted-foreground)"
            className="opacity-30"
          />
          <MiniMap
            nodeColor="var(--muted-foreground)"
            zoomable
            pannable
            className="border rounded-md"
          />
          <Controls className="bg-background/80 backdrop-blur border" />
        </ReactFlow>
      </NodeContext.Provider>
    </div>
  );
});

FlowWithControls.displayName = "FlowWithControls";

export default function Home() {
  return (
    <ReactFlowProvider>
      <FlowWithControls />
    </ReactFlowProvider>
  );
}
