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


export default function Home() {
  // Load custom nodes from localStorage on mount
  const [rootNodes, setRootNodes] = useState(() => [...ROOT_NODES, ...loadCustomNodes()]);
  
  // Initialize nodes with custom nodes from localStorage
  const getInitialNodes = useCallback(() => {
    const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
    
    // Grid layout for root nodes
    const nodesPerRow = 4; // 6 nodes per row
    const nodeWidth = 120;
    const nodeHeight = 60;
    const horizontalSpacing = 40;
    const verticalSpacing = 40;
    const startX = 100;
    const startY = 100;
    
    // Original nodes in grid layout
    const originalNodes = ROOT_NODES.map((node, i) => {
      const row = Math.floor(i / nodesPerRow);
      const col = i % nodesPerRow;
      
      return {
        id: node.id,
        position: { 
          x: startX + col * (nodeWidth + horizontalSpacing),
          y: startY + row * (nodeHeight + verticalSpacing)
        },
        data: { 
          label: node.name, 
          color: node.color,
          path: [node.name],
          childrenLoaded: false
        },
      };
    });
    
    // Custom nodes in grid layout (continue from where original nodes end)
    const customNodeInstances = loadCustomNodes().map((customNode: { id: string; name: string; color: string }, i: number) => {
      const totalOriginalNodes = ROOT_NODES.length;
      const globalIndex = totalOriginalNodes + i;
      const row = Math.floor(globalIndex / nodesPerRow);
      const col = globalIndex % nodesPerRow;
      
      return {
        id: customNode.id,
        position: {
          x: startX + col * (nodeWidth + horizontalSpacing),
          y: startY + row * (nodeHeight + verticalSpacing)
        },
        data: {
          label: customNode.name,
          color: customNode.color,
          path: [customNode.name],
          childrenLoaded: false
        }
      };
    });
    
    return [...originalNodes, ...customNodeInstances];
  }, []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newRootNodeName, setNewRootNodeName] = useState('');
  const [isShowingAll, setIsShowingAll] = useState(false);

  // Add this state to track the exploration history with full state data
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
  const [selectedNodeForDialog, setSelectedNodeForDialog] = useState<any>(null);
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
    setSelectedNodeForDialog(node);
    setNodeInfo('');
    setQuestion('');
    setQuestionAnswer('');
    getNodeInfo(node);
  }, [getNodeInfo]);

  const onNodeClick = useCallback((_: any, clickedNode: any) => {
    // If this is a root node (original or custom), toggle selection and optionally load children
    if (rootNodes.some(node => node.id === clickedNode.id)) {
      const wasSelected = selectedRootId === clickedNode.id;
      
      // Reset showing all state when clicking a root node
      setIsShowingAll(false);
      
      setSelectedRootId(wasSelected ? null : clickedNode.id);
      
      // Update exploration history
      if (!wasSelected) {
        setExplorationHistory({
          states: [{
            nodeId: clickedNode.id,
            selectedRootId: clickedNode.id,
            isShowingAll: false
          }],
          currentIndex: 0
        });
      } else {
        setExplorationHistory({
          states: [],
          currentIndex: -1
        });
      }
      
      // If this is a new selection and children aren't loaded, load them
      if (!wasSelected && !clickedNode.data.childrenLoaded && !loadingNodeId) {
        startTransition(async () => {
          try {
            setLoadingNodeId(clickedNode.id);
            
            const children = await getChildConcepts(
              clickedNode.data.label,
              clickedNode.data.path
            );

            const newNodes = children.map((child: string, i: number) => {
              const nodesPerRow = 4;
              const nodeWidth = 120; // Increased to match actual node width
              const nodeHeight = 60;  // Approximate node height
              const spacing = 20;     // Proper spacing between nodes
              const row = Math.floor(i / nodesPerRow);
              const col = i % nodesPerRow;
              
              // Calculate starting position to center the grid
              const gridWidth = nodesPerRow * (nodeWidth + spacing) - spacing;
              const startX = clickedNode.position.x - gridWidth / 2;
              const startY = clickedNode.position.y + 150;
              
              return {
                id: `${clickedNode.id}-${i}`,
                position: {
                  x: startX + col * (nodeWidth + spacing),
                  y: startY + row * (nodeHeight + spacing),
                },
                data: { 
                  label: child,
                  color: clickedNode.data.color,
                  path: [...clickedNode.data.path, child],
                  childrenLoaded: false
                },
              };
            });

            const newEdges = children.map((_: string, i: number) => ({
              id: `e-${clickedNode.id}-${i}`,
              source: clickedNode.id,
              target: `${clickedNode.id}-${i}`,
              animated: true,
              style: { stroke: clickedNode.data.color, strokeWidth: 2 },
              // Add handle positioning for better grid connection
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
            console.error("Error loading root node children:", error);
          } finally {
            setLoadingNodeId(null);
          }
        });
      }
      return;
    }

    if (clickedNode.data.childrenLoaded || loadingNodeId) return;

    // Update exploration history for non-root nodes
    setExplorationHistory(prev => {
      const newStates = [...prev.states];
      // Add current node as a new state if it's not already the current state
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

  startTransition(async () => {
    try {
      setLoadingNodeId(clickedNode.id);
      
      const children = await getChildConcepts(
        clickedNode.data.label,
        clickedNode.data.path
      );

      const newNodes = children.map((child: string, i: number) => {
        const nodesPerRow = 4;
        const nodeWidth = 120; // Increased to match actual node width
        const nodeHeight = 60;  // Approximate node height
        const spacing = 20;     // Proper spacing between nodes
        const row = Math.floor(i / nodesPerRow);
        const col = i % nodesPerRow;
        
        // Calculate starting position to center the grid
        const gridWidth = nodesPerRow * (nodeWidth + spacing) - spacing;
        const startX = clickedNode.position.x - gridWidth / 2;
        const startY = clickedNode.position.y + 150;
        
        return {
          id: `${clickedNode.id}-${i}`,
          position: {
            x: startX + col * (nodeWidth + spacing),
            y: startY + row * (nodeHeight + spacing),
          },
          data: { 
            label: child,
            color: clickedNode.data.color,
            path: [...clickedNode.data.path, child],
            childrenLoaded: false
          },
        };
      });

      const newEdges = children.map((_: string, i: number) => ({
        id: `e-${clickedNode.id}-${i}`,
        source: clickedNode.id,
        target: `${clickedNode.id}-${i}`,
        animated: true,
        style: { stroke: clickedNode.data.color, strokeWidth: 2 },
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
      console.error("Error in onNodeClick:", error);
    } finally {
      setLoadingNodeId(null);
    }
  });
}, [loadingNodeId, setNodes, setEdges, startTransition]);

const resetToRoot = useCallback(() => {
    setSelectedRootId(null);
    setExplorationHistory({
      states: [],
      currentIndex: -1
    });
    setIsShowingAll(false);
  
  // Reset to all root nodes (original + custom) with grid layout
  const allRootNodes = [...ROOT_NODES, ...loadCustomNodes()];
  setRootNodes(allRootNodes);
  
  // Grid layout parameters
  const nodesPerRow = 6;
  const nodeWidth = 120;
  const nodeHeight = 60;
  const horizontalSpacing = 40;
  const verticalSpacing = 40;
  const startX = 100;
  const startY = 100;
  
  // Recreate all nodes with grid positions
  const resetNodes = allRootNodes.map((rootNode, i) => {
    const row = Math.floor(i / nodesPerRow);
    const col = i % nodesPerRow;
    
    return {
      id: rootNode.id,
      position: {
        x: startX + col * (nodeWidth + horizontalSpacing),
        y: startY + row * (nodeHeight + verticalSpacing)
      },
      data: {
        label: rootNode.name,
        color: rootNode.color,
        path: [rootNode.name],
        childrenLoaded: false
      }
    };
  });
  
  setNodes(resetNodes);
  setEdges([]);
}, []);

// Function to navigate back in exploration history
const navigateBack = useCallback(() => {
  setExplorationHistory(prev => {
    if (prev.currentIndex > 0) {
      // Go to the previous state
      const previousState = prev.states[prev.currentIndex - 1];
      setSelectedRootId(previousState.selectedRootId);
      setIsShowingAll(previousState.isShowingAll);
      return {
        ...prev,
        currentIndex: prev.currentIndex - 1
      };
    } else if (prev.currentIndex === 0) {
      // If we're at the first state, trigger full reset to clear all expanded nodes
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
    // Currently showing all → Hide all (return to focused view)
    setIsShowingAll(false);
    if (explorationHistory.states.length > 0 && explorationHistory.currentIndex >= 0) {
      const currentState = explorationHistory.states[explorationHistory.currentIndex];
      setSelectedRootId(currentState.selectedRootId);
    }
  } else {
    // Currently focused → Show all
    setIsShowingAll(true);
    setSelectedRootId(null);
    // Keep explorationHistory so we can return to it
  }
}, [isShowingAll, explorationHistory]);

const recalculateNodePositions = useCallback((allRootNodes: any[], currentNodes: CustomNode[]) => {
  // Grid layout parameters
  const nodesPerRow = 6;
  const nodeWidth = 120;
  const nodeHeight = 60;
  const horizontalSpacing = 40;
  const verticalSpacing = 40;
  const startX = 100;
  const startY = 100;
  
  return allRootNodes.map((rootNode, i) => {
    // Find the existing node to preserve its data
    const existingNode = currentNodes.find(node => node.id === rootNode.id);
    const row = Math.floor(i / nodesPerRow);
    const col = i % nodesPerRow;
    
    return {
      id: rootNode.id,
      position: {
        x: startX + col * (nodeWidth + horizontalSpacing),
        y: startY + row * (nodeHeight + verticalSpacing)
      },
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
  // Only allow removing custom nodes (not original ROOT_NODES)
  if (ROOT_NODES.some(node => node.id === nodeId)) return;
  
  // Remove from rootNodes state
  setRootNodes(prev => prev.filter(node => node.id !== nodeId));
  
  // Remove from nodes state and all its children
  setNodes(prev => {
    const nodesToRemove = new Set([nodeId]);
    
    // Find all children and grandchildren recursively
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
  
  // Remove related edges
  setEdges(prev => {
    const edgesToRemove = new Set();
    
    // Find all edges connected to this node and its descendants
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
  
  // Clear selection if this node was selected
  if (selectedRootId === nodeId) {
    setSelectedRootId(null);
    setExplorationHistory({
      states: [],
      currentIndex: -1
    });
  }
  
  // Remove from exploration history
  setExplorationHistory(prev => ({
    states: prev.states.filter(state => state.nodeId !== nodeId),
    currentIndex: prev.currentIndex
  }));
}, [edges, selectedRootId]);

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
  
  // Add the new root node
  const updatedRootNodes = [...rootNodes, newRootNode];
  setRootNodes(updatedRootNodes);
  
  // Recalculate positions for all nodes, preserving existing data
  const updatedNodes = recalculateNodePositions(updatedRootNodes, nodes);
  
  // Preserve existing non-root nodes and their positions
  const existingNonRootNodes = nodes.filter(node => 
    !rootNodes.some(rootNode => rootNode.id === node.id)
  );
  
  setNodes([...updatedNodes, ...existingNonRootNodes]);
  setNewRootNodeName('');
}, [newRootNodeName, rootNodes, nodes, recalculateNodePositions]);

return (
  <div className="w-screen h-screen bg-background text-foreground relative">
    <div className="absolute top-6 left-6 z-50">
      <div className="flex items-center gap-4 mb-3">
        <h1 className="text-4xl font-bold tracking-tight">Aether</h1>
        {/* Show back button when there's exploration history */}
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
        {/* {more than 1 node show} */}
        { explorationHistory.currentIndex > 0  &&
        <Button
          size="sm"
          variant="destructive"
          onClick={resetToRoot}
          className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
        >
          Reset
        </Button>
}
        {/* Show toggle button when at least one level deep or in show all mode */}
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
          // If no root is selected, show all nodes
          if (!selectedRootId) return true;
          
          // Always show the selected root node itself
          if (node.id === selectedRootId) return true;
          
          // Always show nodes in exploration history (recent nodes)
          if (explorationHistory.states.some(state => state.nodeId === node.id)) return true;
          
          // Show children of the most recent node in history
          if (explorationHistory.currentIndex >= 0) {
            const mostRecentState = explorationHistory.states[explorationHistory.currentIndex];
            if (mostRecentState) {
              // Check if this node is a child of the most recent node
              const isChild = edges.some(edge => edge.source === mostRecentState.nodeId && edge.target === node.id);
              if (isChild) return true;
            }
          }
          
          // Hide all other nodes (including other root nodes)
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
                    {/* Show trash icon only for custom root nodes */}
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