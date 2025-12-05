import { useState, useCallback, useEffect } from "react";
import { CustomNode, RootNodeConfig } from "@/lib/types";
import { ROOT_NODES, COLORS } from "@/lib/constants";
import { loadCustomNodes, saveCustomNodes } from "@/lib/utils/storage";
import { calculateGridPosition } from "@/lib/utils/node-utils";
import { Edge } from "@xyflow/react";

interface UseRootNodesProps {
  nodes: CustomNode[];
  setNodes: React.Dispatch<React.SetStateAction<CustomNode[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  viewportDimensions: { width: number; height: number };
  fitAllNodes: (duration?: number, padding?: number) => void;
  panToPosition: (x: number, y: number, zoom: number, duration: number) => void;
  resetHistory: () => void;
  updateHistory: (updater: any) => void;
  selectedRootId: string | null;
  setSelectedRootId: (id: string | null) => void;
}

export function useRootNodes({
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
}: UseRootNodesProps) {
  const [rootNodes, setRootNodes] = useState<RootNodeConfig[]>(() => [
    ...ROOT_NODES,
    ...loadCustomNodes(),
  ]);
  const [newRootNodeName, setNewRootNodeName] = useState("");

  // Save custom nodes to localStorage
  useEffect(() => {
    const customOnly = rootNodes.filter(
      (node) => !ROOT_NODES.some((originalNode) => originalNode.id === node.id)
    );
    saveCustomNodes(customOnly);
  }, [rootNodes]);

  // Recalculate node positions
  const recalculateNodePositions = useCallback(
    (allRootNodes: RootNodeConfig[], currentNodes: CustomNode[]) => {
      // Create a map of existing cache statuses
      const existingCacheStatus = new Map();
      currentNodes.forEach((node) => {
        if (node.data.cacheStatus) {
          existingCacheStatus.set(node.id, node.data.cacheStatus);
        }
      });

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
            // Preserve existing cache status if available
            cacheStatus: existingCacheStatus.get(rootNode.id) || existingNode?.data?.cacheStatus,
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

      updateHistory((prev: any) => ({
        states: prev.states.filter((state: any) => state.nodeId !== nodeId),
        currentIndex: prev.currentIndex,
      }));
    },
    [
      edges,
      selectedRootId,
      setNodes,
      setEdges,
      resetHistory,
      updateHistory,
      setSelectedRootId,
    ]
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

  // Reset to root view
  const resetToRoot = useCallback(() => {
    setSelectedRootId(null);
    resetHistory();

    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
    setRootNodes(allRootNodes);

    // Create a map of existing cache statuses to preserve them
    const existingCacheStatus = new Map();
    nodes.forEach((node) => {
      if (node.data.cacheStatus) {
        existingCacheStatus.set(node.id, node.data.cacheStatus);
      }
    });

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
        children: [],
        // Preserve existing cache status if available
        cacheStatus: existingCacheStatus.get(rootNode.id) || undefined,
      },
    }));

    setNodes(resetNodes as any);
    setEdges([]);

    // Fit view to show all root nodes
    setTimeout(() => {
      fitAllNodes(800, 0.1);
    }, 100);
  }, [
    nodes, // Add nodes to dependencies to access existing cache status
    setNodes,
    setEdges,
    resetHistory,
    fitAllNodes,
    viewportDimensions,
    setSelectedRootId,
  ]);

  return {
    rootNodes,
    setRootNodes,
    newRootNodeName,
    setNewRootNodeName,
    addNewRootNode,
    removeCustomRootNode,
    resetToRoot,
  };
}
