// src/app/page.tsx
"use client";

import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import { useCallback, useState, useTransition, useEffect } from 'react';
import { getChildConcepts } from '@/actions/groqActions';
import { Loader2 } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import '@xyflow/react/dist/style.css';

// Define custom node type with JSX label
type CustomNode = Node<{
  label: string | React.ReactNode;
  color: string;
  path: string[];
  childrenLoaded: boolean;
}>;

// Grid layout constants - centralized for consistency
const GRID_CONFIG = {
  nodesPerRow: 4,
  nodeWidth: 120,
  nodeHeight: 60,
  horizontalSpacing: 40,
  verticalSpacing: 40,
  startX: 100,
  startY: 100,
  childSpacing: 20,
  childOffsetY: 150,
};

// Load custom nodes from localStorage on initial load
const loadCustomNodes = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('custom-root-nodes');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

// Save custom nodes to localStorage
const saveCustomNodes = (customNodes: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('custom-root-nodes', JSON.stringify(customNodes));
  }
};

const ROOT_NODES = [
  { id: "1", name: "Life", color: "bg-emerald-500" },
  { id: "2", name: "Consciousness", color: "bg-violet-500" },
  { id: "3", name: "Matter", color: "bg-blue-500" },
  { id: "4", name: "Energy", color: "bg-amber-500" },
  { id: "5", name: "Space", color: "bg-slate-800" },
  { id: "6", name: "Time", color: "bg-slate-500" },
  { id: "7", name: "Emotion", color: "bg-pink-500" },
  { id: "8", name: "Mathematics", color: "bg-cyan-500" },
  { id: "9", name: "Language", color: "bg-rose-500" },
  { id: "10", name: "Evolution", color: "bg-green-600" },
  { id: "11", name: "Technology", color: "bg-gray-600" },
  { id: "12", name: "Art", color: "bg-pink-600" },
  { id: "13", name: "Logic", color: "bg-blue-600" },
  { id: "14", name: "Culture", color: "bg-red-500" },
  { id: "15", name: "Gravity", color: "bg-purple-600" },
  { id: "16", name: "Light", color: "bg-yellow-400" },
  { id: "17", name: "Sound", color: "bg-indigo-500" },
  { id: "18", name: "DNA", color: "bg-teal-500" },
  { id: "19", name: "Ecosystems", color: "bg-lime-500" },
  { id: "20", name: "Money", color: "bg-green-700" },
  { id: "21", name: "Crypto", color: "bg-orange-600" },
  { id: "22", name: "Decentralization", color: "bg-purple-700" },
  { id: "23", name: "Information", color: "bg-sky-500" },
  { id: "24", name: "Networks", color: "bg-emerald-600" },
  { id: "25", name: "AI", color: "bg-violet-700" },
  { id: "26", name: "Quantum", color: "bg-indigo-600" },
  { id: "27", name: "Ethics", color: "bg-amber-700" },
];

const COLORS = [
  "bg-emerald-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-slate-800",
  "bg-slate-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-teal-500",
];

// Helper function to calculate grid position
const calculateGridPosition = (index: number, isChild = false) => {
  const { nodesPerRow, nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing, startX, startY, childSpacing } = GRID_CONFIG;

  const row = Math.floor(index / nodesPerRow);
  const col = index % nodesPerRow;

  const spacing = isChild ? childSpacing : horizontalSpacing;

  return {
    x: startX + col * (nodeWidth + spacing),
    y: startY + row * (nodeHeight + (isChild ? childSpacing : verticalSpacing))
  };
};

// Helper function to calculate child node positions centered under parent
const calculateChildPosition = (parentPosition: { x: number; y: number }, childIndex: number, totalChildren: number) => {
  const { nodesPerRow, nodeWidth, childSpacing, childOffsetY, nodeHeight } = GRID_CONFIG;

  const row = Math.floor(childIndex / nodesPerRow);
  const col = childIndex % nodesPerRow;

  // Calculate grid width for centering
  const nodesInRow = Math.min(nodesPerRow, totalChildren - row * nodesPerRow);
  const gridWidth = nodesInRow * (nodeWidth + childSpacing) - childSpacing;
  const startX = parentPosition.x - gridWidth / 2;
  const startY = parentPosition.y + childOffsetY;

  return {
    x: startX + col * (nodeWidth + childSpacing),
    y: startY + row * (nodeHeight + childSpacing),
  };
};

export default function Home() {
  // Load custom nodes from localStorage on mount
  const [rootNodes, setRootNodes] = useState(() => [...ROOT_NODES, ...loadCustomNodes()]);

  // Initialize nodes with custom nodes from localStorage
  const getInitialNodes = useCallback(() => {
    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];

    return allRootNodes.map((node, i) => ({
      id: node.id,
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
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newRootNodeName, setNewRootNodeName] = useState('');
  const [isShowingAll, setIsShowingAll] = useState(false);

  const [explorationHistory, setExplorationHistory] = useState<{
    states: Array<{
      nodeId: string;
      selectedRootId: string | null;
      isShowingAll: boolean;
    }>;
    currentIndex: number;
  }>({
    states: [],
    currentIndex: -1
  });

  const [nodeInfo, setNodeInfo] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [questionAnswer, setQuestionAnswer] = useState<string>('');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  // Save custom nodes to localStorage whenever they change
  useEffect(() => {
    const customOnly = rootNodes.filter(node =>
      !ROOT_NODES.some(originalNode => originalNode.id === node.id)
    );
    saveCustomNodes(customOnly);
  }, [rootNodes]);

  // Function to get node information
  const getNodeInfo = useCallback(async (node: any) => {
    setIsLoadingInfo(true);
    try {
      const response = await fetch('/api/node-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: node.data.label,
          path: node.data.path
        })
      });
      const data = await response.json();
      setNodeInfo(data.info || 'No information available');
    } catch (error) {
      console.error('Error getting node info:', error);
      setNodeInfo('Error loading information');
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  // Function to ask a question about a node
  const askQuestion = useCallback(async (node: any, questionText: string) => {
    if (!questionText.trim()) return;

    setIsLoadingQuestion(true);
    try {
      const response = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: node.data.label,
          path: node.data.path,
          question: questionText
        })
      });
      const data = await response.json();
      setQuestionAnswer(data.answer || 'No answer available');
    } catch (error) {
      console.error('Error asking question:', error);
      setQuestionAnswer('Error getting answer');
    } finally {
      setIsLoadingQuestion(false);
    }
  }, []);

  // Handle opening dialog for a node
  const handleNodeDialog = useCallback((node: any) => {
    setNodeInfo('');
    setQuestion('');
    setQuestionAnswer('');
    getNodeInfo(node);
  }, [getNodeInfo]);

  // Helper function to load children for any node
  const loadChildrenForNode = useCallback(async (clickedNode: any) => {
    try {
      setLoadingNodeId(clickedNode.id);

      const children = await getChildConcepts(
        clickedNode.data.label,
        clickedNode.data.path
      );

      const newNodes = children.map((child: string, i: number) => ({
        id: `${clickedNode.id}-${i}`,
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

      setNodes((nds: Node[]) => [
        ...nds.map(n =>
          n.id === clickedNode.id
            ? { ...n, data: { ...n.data, childrenLoaded: true } }
            : n
        ),
        ...newNodes
      ]);
      setEdges((eds: Edge[]) => [...eds, ...newEdges]);
    } catch (error) {
      console.error("Error loading children:", error);
    } finally {
      setLoadingNodeId(null);
    }
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, clickedNode: any) => {
    // If this is a root node, toggle selection
    if (rootNodes.some(node => node.id === clickedNode.id)) {
      const wasSelected = selectedRootId === clickedNode.id;
      setIsShowingAll(false);
      setSelectedRootId(wasSelected ? null : clickedNode.id);

      if (!wasSelected) {
        setExplorationHistory({
          states: [{
            nodeId: clickedNode.id,
            selectedRootId: clickedNode.id,
            isShowingAll: false
          }],
          currentIndex: 0
        });

        // Load children if not already loaded
        if (!clickedNode.data.childrenLoaded && !loadingNodeId) {
          startTransition(() => loadChildrenForNode(clickedNode));
        }
      } else {
        setExplorationHistory({
          states: [],
          currentIndex: -1
        });
      }
      return;
    }

    // For non-root nodes
    if (clickedNode.data.childrenLoaded || loadingNodeId) return;

    // Update exploration history
    setExplorationHistory(prev => {
      const newStates = [...prev.states];
      if (newStates.length === 0 || newStates[newStates.length - 1].nodeId !== clickedNode.id) {
        newStates.push({
          nodeId: clickedNode.id,
          selectedRootId: clickedNode.id,
          isShowingAll: false
        });
      }
      return {
        states: newStates,
        currentIndex: newStates.length - 1
      };
    });

    startTransition(() => loadChildrenForNode(clickedNode));
  }, [loadingNodeId, rootNodes, selectedRootId, startTransition, loadChildrenForNode]);

  const resetToRoot = useCallback(() => {
    setSelectedRootId(null);
    setExplorationHistory({
      states: [],
      currentIndex: -1
    });
    setIsShowingAll(false);

    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
    setRootNodes(allRootNodes);

    const resetNodes = allRootNodes.map((rootNode, i) => ({
      id: rootNode.id,
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
  }, [setNodes, setEdges]);

  const navigateBack = useCallback(() => {
    setExplorationHistory(prev => {
      if (prev.currentIndex > 0) {
        const previousState = prev.states[prev.currentIndex - 1];
        setSelectedRootId(previousState.selectedRootId);
        setIsShowingAll(previousState.isShowingAll);
        return {
          ...prev,
          currentIndex: prev.currentIndex - 1
        };
      } else if (prev.currentIndex === 0) {
        resetToRoot();
        return {
          ...prev,
          currentIndex: -1
        };
      }
      return prev;
    });
  }, [resetToRoot]);

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

  const recalculateNodePositions = useCallback((allRootNodes: any[], currentNodes: CustomNode[]) => {
    return allRootNodes.map((rootNode, i) => {
      const existingNode = currentNodes.find(node => node.id === rootNode.id);

      return {
        id: rootNode.id,
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
      const edgesToRemove = new Set();

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
      setExplorationHistory({
        states: [],
        currentIndex: -1
      });
    }

    setExplorationHistory(prev => ({
      states: prev.states.filter(state => state.nodeId !== nodeId),
      currentIndex: prev.currentIndex
    }));
  }, [edges, selectedRootId, setNodes, setEdges]);

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

  return (
    <div className="w-screen h-screen bg-background text-foreground relative">
      <div className="absolute top-6 left-6 z-50">
        <div className="flex items-center gap-4 mb-3">
          <h1 className="text-4xl font-bold tracking-tight">Aether</h1>
          {explorationHistory.states.length > 0 && explorationHistory.currentIndex >= 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={navigateBack}
              className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            >
              ← Back
            </Button>
          )}
          {explorationHistory.currentIndex > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={resetToRoot}
              className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
            >
              Reset
            </Button>
          )}
          {(selectedRootId || (explorationHistory.states.length > 0 && explorationHistory.currentIndex >= 0) || isShowingAll) && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleShowAll}
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
            onChange={(e) => setNewRootNodeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addNewRootNode();
              }
            }}
          />
          <Button
            size="sm"
            onClick={addNewRootNode}
            className="px-3 py-1 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-md transition-colors"
          >
            Add
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Click any node to explore ∞
        </p>
      </div>

      <ReactFlow
        nodes={nodes.filter(node => {
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
        }).map(node => ({
          ...node,
          data: {
            ...node.data,
            label: (
              <div className="flex flex-col gap-2">
                <div className={`px-4 py-2 rounded-md font-medium ${node.data.color} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {loadingNodeId === node.id && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <span>{node.data.label}</span>
                    </div>
                    {rootNodes.some(rootNode => rootNode.id === node.id) &&
                      !ROOT_NODES.some(originalNode => originalNode.id === node.id) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-white/20 text-white"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            removeCustomRootNode(node.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleNodeDialog(node);
                        }}
                      >
                        Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>{node.data.label}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">About this concept:</h4>
                          {isLoadingInfo ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading information...</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">{nodeInfo}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="question">Ask a question:</Label>
                          <div className="flex gap-2">
                            <Input
                              id="question"
                              placeholder="What would you like to know?"
                              value={question}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  askQuestion(node, question);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => askQuestion(node, question)}
                              disabled={isLoadingQuestion || !question.trim()}
                            >
                              {isLoadingQuestion ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Ask'
                              )}
                            </Button>
                          </div>

                          {questionAnswer && (
                            <div className="mt-2">
                              <Label className="text-sm font-medium">Answer:</Label>
                              <p className="text-sm text-muted-foreground mt-1">{questionAnswer}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )
          }
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
      >
        <MiniMap
          nodeColor="var(--muted-foreground)"
          zoomable
          pannable
          className="border rounded-md"
        />
        <Controls className="bg-background/80 backdrop-blur border" />
        <Background color="hsl(var(--muted))" gap={40} />
      </ReactFlow>
    </div>
  );
}