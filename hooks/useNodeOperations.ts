import { useCallback, useState, useTransition, useEffect } from "react";
import { Edge } from "@xyflow/react";
import { CustomNode } from "@/lib/types";
import { getChildConcepts } from "@/actions/groqActions";
import {
  calculateChildPosition,
  getOptimalChildrenPerRow,
} from "@/lib/utils/node-utils";
import { getChildColor } from "@/lib/utils/color-utils";

interface UseNodeOperationsProps {
  nodes: CustomNode[];
  setNodes: React.Dispatch<React.SetStateAction<CustomNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  panToNewNodes: (parentNode: CustomNode, newNodes: CustomNode[]) => void;
}

export function useNodeOperations({
  nodes,
  setNodes,
  setEdges,
  panToNewNodes,
}: UseNodeOperationsProps) {
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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
                if (result) {
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
  }, [fetchCacheStatuses, nodes]);

  // Load children for any node
  const loadChildrenForNode = useCallback(
    async (clickedNode: CustomNode) => {
      try {
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

          // Fetch cache for clicked node and new nodes after a delay
          setTimeout(() => {
            fetchCacheStatuses([clickedNode, ...newNodes]);
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

  return {
    loadingNodeId,
    setLoadingNodeId,
    loadChildrenForNode,
    fetchCacheStatuses,
  };
}
