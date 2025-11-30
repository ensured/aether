// src/app/page.tsx
"use client";

import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import { useCallback, useState, useTransition, useEffect, useMemo } from 'react';
import '@xyflow/react/dist/style.css';

// Server actions
import { getChildConcepts } from '@/actions/groqActions';

// Components
import { ConceptNode } from '@/components/ConceptNode';
import { NavigationControls } from '@/components/NavigationControls';
import { NodeContext } from '@/components/NodeContext';

// Hooks
import { useNodeInfo } from '@/hooks/useNodeInfo';
import { useExplorationHistory } from '@/hooks/useExplorationHistory';

// Utils & Types
import { Edge } from '@xyflow/react';
import { CustomNode, RootNodeConfig } from '@/lib/types';
import { ROOT_NODES, COLORS } from '@/lib/constants';
import { calculateGridPosition, calculateChildPosition } from '@/lib/utils/node-utils';
import { loadCustomNodes, saveCustomNodes } from '@/lib/utils/storage';

export default function Home() {
  // State management
  const [rootNodes, setRootNodes] = useState<RootNodeConfig[]>(() => [...ROOT_NODES, ...loadCustomNodes()]);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newRootNodeName, setNewRootNodeName] = useState('');
  const [isShowingAll, setIsShowingAll] = useState(false);

  // Custom hooks
  const { explorationHistory, addToHistory, navigateBack: navigateBackHistory, resetHistory, updateHistory } = useExplorationHistory();
  const { nodeInfo, question, questionAnswer, isLoadingInfo, isLoadingQuestion, setQuestion, getNodeInfo, askQuestion, resetInfo } = useNodeInfo();

  // Define node types
  const nodeTypes = useMemo(() => ({
    concept: ConceptNode,
  }), []);

  // Initialize nodes
  const getInitialNodes = useCallback(() => {
    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
    return allRootNodes.map((node, i) => ({
      id: node.id,
      type: 'concept',
      position: calculateGridPosition(i),
      data: {
        label: node.name,
        color: node.color,
        path: [node.name],
        childrenLoaded: false
      },
    }));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Save custom nodes to localStorage
  useEffect(() => {
    const customOnly = rootNodes.filter(node =>
      !ROOT_NODES.some(originalNode => originalNode.id === node.id)
    );
    saveCustomNodes(customOnly);
  }, [rootNodes]);

  // Handle opening dialog for a node
  const handleNodeDialog = useCallback((node: CustomNode) => {
    resetInfo();
    getNodeInfo(node);
  }, [getNodeInfo, resetInfo]);

  // Fetch cache statuses for nodes
  const fetchCacheStatuses = useCallback(async (nodesToFetch: CustomNode[]) => {
    if (nodesToFetch.length === 0) return;

    try {
      const response = await fetch('/api/cache-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodesToFetch.map(n => ({
          topic: n.data.label,
          path: n.data.path
        })))
      });

      const results = await response.json();

      setNodes(nds => nds.map(node => {
        const result = results.find((r: any) => r.topic === node.data.label);
        if (result && !node.data.cacheStatus) {
          return {
            ...node,
            data: { ...node.data, cacheStatus: result }
          };
        }
        return node;
      }));
    } catch (error) {
      console.error("Error fetching cache statuses:", error);
    }
  }, [setNodes]);

  // Initial cache fetch
  useEffect(() => {
    const nodesWithoutCache = nodes.filter(n => !n.data.cacheStatus);
    if (nodesWithoutCache.length > 0) {
      // Debounce or just run it once on mount/change
      const timer = setTimeout(() => {
        fetchCacheStatuses(nodesWithoutCache);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fetchCacheStatuses]);

  // Load children for any node
  const loadChildrenForNode = useCallback(async (clickedNode: CustomNode) => {
    try {
      setLoadingNodeId(clickedNode.id);

      const children = await getChildConcepts(
        clickedNode.data.label as string,
        clickedNode.data.path
      );

      const newNodes = children.map((child: string, i: number) => ({
        id: `${clickedNode.id}-${i}`,
        type: 'concept',
        position: calculateChildPosition(clickedNode.position, i, children.length),
        data: {
          label: child,
          color: clickedNode.data.color,
          path: [...clickedNode.data.path, child],
          childrenLoaded: false
        },
      }));

      const newEdges = children.map((_: string, i: number) => ({
        id: `e-${clickedNode.id}-${i}`,
        source: clickedNode.id,
        target: `${clickedNode.id}-${i}`,
        animated: true,
        style: { stroke: clickedNode.data.color, strokeWidth: 2 },
        sourceHandle: 'bottom',
        targetHandle: 'top',
      }));

      setNodes((nds) => [
        ...nds.map(n =>
          n.id === clickedNode.id
            ? { ...n, data: { ...n.data, childrenLoaded: true } }
            : n
        ),
        ...newNodes
      ]);
      setEdges((eds) => [...eds, ...newEdges]);

      // Fetch cache for new nodes
      fetchCacheStatuses(newNodes);

    } catch (error) {
      console.error("Error loading children:", error);
    } finally {
      setLoadingNodeId(null);
    }
  }, [setNodes, setEdges, fetchCacheStatuses]);

  // Handle node click
  const onNodeClick = useCallback((_: any, clickedNode: CustomNode) => {
    // If this is a root node, toggle selection
    if (rootNodes.some(node => node.id === clickedNode.id)) {
      const wasSelected = selectedRootId === clickedNode.id;
      setIsShowingAll(false);
      setSelectedRootId(wasSelected ? null : clickedNode.id);

      if (!wasSelected) {
        updateHistory(() => ({
          states: [{
            nodeId: clickedNode.id,
            selectedRootId: clickedNode.id,
            isShowingAll: false
          }],
          currentIndex: 0
        }));

        // Load children if not already loaded
        if (!clickedNode.data.childrenLoaded && !loadingNodeId) {
          startTransition(() => loadChildrenForNode(clickedNode));
        }
      } else {
        resetHistory();
      }
      return;
    }

    // For non-root nodes
    if (clickedNode.data.childrenLoaded || loadingNodeId) return;

    // Update exploration history
    addToHistory({
      nodeId: clickedNode.id,
      selectedRootId: clickedNode.id,
      isShowingAll: false
    });

    startTransition(() => loadChildrenForNode(clickedNode));
  }, [loadingNodeId, rootNodes, selectedRootId, startTransition, loadChildrenForNode, addToHistory, updateHistory, resetHistory]);

  // Reset to root view
  const resetToRoot = useCallback(() => {
    setSelectedRootId(null);
    resetHistory();
    setIsShowingAll(false);

    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
    setRootNodes(allRootNodes);

    const resetNodes = allRootNodes.map((rootNode, i) => ({
      id: rootNode.id,
      type: 'concept',
      position: calculateGridPosition(i),
      data: {
        label: rootNode.name,
        color: rootNode.color,
        path: [rootNode.name],
        childrenLoaded: false
      }
    }));

    setNodes(resetNodes);
    setEdges([]);
  }, [setNodes, setEdges, resetHistory]);

  // Navigate back in history
  const navigateBack = useCallback(() => {
    navigateBackHistory(() => {
      resetToRoot();
    });

    // Update selected root based on new current index
    if (explorationHistory.currentIndex > 0) {
      const previousState = explorationHistory.states[explorationHistory.currentIndex - 1];
      setSelectedRootId(previousState.selectedRootId);
      setIsShowingAll(previousState.isShowingAll);
    }
  }, [navigateBackHistory, resetToRoot, explorationHistory]);

  // Toggle show all nodes
  const toggleShowAll = useCallback(() => {
    if (isShowingAll) {
      setIsShowingAll(false);
      if (explorationHistory.states.length > 0 && explorationHistory.currentIndex >= 0) {
        const currentState = explorationHistory.states[explorationHistory.currentIndex];
        setSelectedRootId(currentState.selectedRootId);
      }
    } else {
      setIsShowingAll(true);
      setSelectedRootId(null);
    }
  }, [isShowingAll, explorationHistory]);

  // Recalculate node positions
  const recalculateNodePositions = useCallback((allRootNodes: RootNodeConfig[], currentNodes: CustomNode[]) => {
    return allRootNodes.map((rootNode, i) => {
      const existingNode = currentNodes.find(node => node.id === rootNode.id);

      return {
        id: rootNode.id,
        type: 'concept',
        position: calculateGridPosition(i),
        data: {
          label: rootNode.name,
          color: rootNode.color,
          path: [rootNode.name],
          childrenLoaded: existingNode?.data?.childrenLoaded || false
        }
      };
    });
  }, []);

  // Remove custom root node
  const removeCustomRootNode = useCallback((nodeId: string) => {
    if (ROOT_NODES.some(node => node.id === nodeId)) return;

    setRootNodes(prev => prev.filter(node => node.id !== nodeId));

    setNodes(prev => {
      const nodesToRemove = new Set([nodeId]);

      const findDescendants = (parentId: string) => {
        prev.forEach(node => {
          const edge = edges.find(e => e.source === parentId && e.target === node.id);
          if (edge) {
            nodesToRemove.add(node.id);
            findDescendants(node.id);
          }
        });
      };

      findDescendants(nodeId);
      return prev.filter(node => !nodesToRemove.has(node.id));
    });

    setEdges(prev => {
      const edgesToRemove = new Set<string>();

      const findRelatedEdges = (nodeId: string) => {
        prev.forEach(edge => {
          if (edge.source === nodeId || edge.target === nodeId) {
            edgesToRemove.add(edge.id);
            if (edge.target !== nodeId) {
              findRelatedEdges(edge.target);
            }
          }
        });
      };

      findRelatedEdges(nodeId);
      return prev.filter(edge => !edgesToRemove.has(edge.id));
    });

    if (selectedRootId === nodeId) {
      setSelectedRootId(null);
      resetHistory();
    }

    updateHistory(prev => ({
      states: prev.states.filter(state => state.nodeId !== nodeId),
      currentIndex: prev.currentIndex
    }));
  }, [edges, selectedRootId, setNodes, setEdges, resetHistory, updateHistory]);

  // Add new root node
  const addNewRootNode = useCallback(() => {
    if (!newRootNodeName.trim()) return;

    const newNodeId = `custom-${Date.now()}`;
    const colorIndex = rootNodes.length % COLORS.length;
    const color = COLORS[colorIndex];

    const newRootNode = {
      id: newNodeId,
      name: newRootNodeName.trim(),
      color
    };

    const updatedRootNodes = [...rootNodes, newRootNode];
    setRootNodes(updatedRootNodes);

    const updatedNodes = recalculateNodePositions(updatedRootNodes, nodes);

    const existingNonRootNodes = nodes.filter(node =>
      !rootNodes.some(rootNode => rootNode.id === node.id)
    );

    setNodes([...updatedNodes, ...existingNonRootNodes]);
    setNewRootNodeName('');
  }, [newRootNodeName, rootNodes, nodes, recalculateNodePositions, setNodes]);

  // Filter visible nodes
  const visibleNodes = nodes.filter(node => {
    if (!selectedRootId) return true;
    if (node.id === selectedRootId) return true;
    if (explorationHistory.states.some(state => state.nodeId === node.id)) return true;

    if (explorationHistory.currentIndex >= 0) {
      const mostRecentState = explorationHistory.states[explorationHistory.currentIndex];
      if (mostRecentState) {
        const isChild = edges.some(edge => edge.source === mostRecentState.nodeId && edge.target === node.id);
        if (isChild) return true;
      }
    }

    return false;
  });

  // Context value
  const nodeContextValue = {
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
  };

  return (
    <div className="w-screen h-screen bg-background text-foreground relative">
      <NavigationControls
        explorationHistoryLength={explorationHistory.states.length}
        currentIndex={explorationHistory.currentIndex}
        selectedRootId={selectedRootId}
        isShowingAll={isShowingAll}
        newRootNodeName={newRootNodeName}
        onSetNewRootNodeName={setNewRootNodeName}
        onNavigateBack={navigateBack}
        onReset={resetToRoot}
        onToggleShowAll={toggleShowAll}
        onAddNewRootNode={addNewRootNode}
      />

      <NodeContext.Provider value={nodeContextValue}>
        <ReactFlow
          nodes={visibleNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.01 }}
        >
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
}