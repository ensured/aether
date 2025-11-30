import { createContext, useContext } from 'react';
import { CustomNode, RootNodeConfig } from '@/lib/types';

interface NodeContextType {
    loadingNodeId: string | null;
    rootNodes: RootNodeConfig[];
    nodeInfo: string;
    question: string;
    questionAnswer: string;
    isLoadingInfo: boolean;
    isLoadingQuestion: boolean;
    onSetQuestion: (question: string) => void;
    onRemoveNode: (nodeId: string) => void;
    onOpenDialog: (node: CustomNode) => void;
    onAskQuestion: (node: CustomNode, question: string) => void;
}

export const NodeContext = createContext<NodeContextType | null>(null);

export const useNodeContext = () => {
    const context = useContext(NodeContext);
    if (!context) {
        throw new Error('useNodeContext must be used within a NodeProvider');
    }
    return context;
};
