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
import { useNodeOperations } from "@/hooks/useNodeOperations";
import { useRootNodes } from "@/hooks/useRootNodes";

// Utils & Types
import { Edge } from "@xyflow/react";
import { CustomNode, RootNodeConfig } from "@/lib/types";
import { ROOT_NODES, COLORS } from "@/lib/constants";
import {
  calculateGridPosition,
} from "@/lib/utils/node-utils";
import { loadCustomNodes } from "@/lib/utils/storage";

const FlowWithControls = memo(() => {
  // State management
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
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

  // Node Operations Hook
  const {
    loadingNodeId,
    setLoadingNodeId,
    loadChildrenForNode,
    fetchCacheStatuses,
  } = useNodeOperations({
    nodes,
    setNodes,
    setEdges,
    panToNewNodes,
  });

  // Root Nodes Hook
  const {
    rootNodes,
    setRootNodes,
    newRootNodeName,
    setNewRootNodeName,
    addNewRootNode,
    removeCustomRootNode,
    resetToRoot,
  } = useRootNodes({
    nodes,
    setNodes,
    edges,
    setEdges,
    viewportDimensions,
    fitAllNodes,
    panToPosition,
    resetHistory,
    updateHistory,
    selectedRootId,
    setSelectedRootId,
  });

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

  // Fit view to all nodes on initial mount
  useEffect(() => {
    // Only run on initial mount when no root is selected and no exploration history
    if (!selectedRootId && explorationHistory.states.length === 0) {
      // Small delay to ensure ReactFlow is fully initialized
      setTimeout(() => {
        // Responsive padding based on screen size
        const screenWidth = window.innerWidth;
        let padding = 0.05;

        if (screenWidth < 640) {
          // Mobile - more padding to show everything
          padding = 0.15;
        } else if (screenWidth < 1024) {
          // Tablet - moderate padding
          padding = 0.1;
        }
        // Desktop - keep original padding

        fitAllNodes(800, padding);
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

      // Clean up nodes and edges that were explored after the current point
      const validHistoryNodeIds = new Set(
        explorationHistory.states
          .slice(0, explorationHistory.currentIndex)
          .map(state => state.nodeId)
      );

      const rootNodeIds = new Set([...ROOT_NODES, ...loadCustomNodes()].map(node => node.id));

      setNodes(prevNodes => prevNodes.filter(node =>
        rootNodeIds.has(node.id) || validHistoryNodeIds.has(node.id)
      ));

      // Clean up edges that connect to removed nodes
      const validNodeIds = new Set([
        ...rootNodeIds,
        ...validHistoryNodeIds
      ]);

      setEdges(prevEdges => prevEdges.filter(edge =>
        validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
      ));
    } else {
      // If we're going back to the root, clear any nodes that aren't root nodes
      const rootNodeIds = new Set([...ROOT_NODES, ...loadCustomNodes()].map(node => node.id));
      setNodes(prevNodes => prevNodes.filter(node => rootNodeIds.has(node.id)));
      setEdges([]);
    }
  }, [navigateBackHistory, resetToRoot, explorationHistory, setNodes, setEdges]);



  // Filter visible nodes
  const visibleNodes = nodes.filter((node) => {
    if (!selectedRootId) return true;
    if (node.id === selectedRootId) return true;

    // Only show nodes from current history point and earlier, not all explored topics
    if (explorationHistory.currentIndex >= 0) {
      // Check if this node is in the current or previous history states
      const isInHistory = explorationHistory.states
        .slice(0, explorationHistory.currentIndex + 1)
        .some((state) => state.nodeId === node.id);

      if (isInHistory) return true;

      // Show children of the current state
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

  // Filter edges to only show connections between visible nodes
  const visibleNodeIds = new Set(visibleNodes.map(node => node.id));
  const visibleEdges = edges.filter(edge =>
    visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );

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
          edges={visibleEdges}
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
          {/* <MiniMap
            nodeColor="var(--muted-foreground)"
            zoomable
            pannable
            className="border rounded-md"
          /> */}
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
