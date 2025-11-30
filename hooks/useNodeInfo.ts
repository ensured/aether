import { useState, useCallback } from "react";

interface UseNodeInfoReturn {
  nodeInfo: string;
  question: string;
  questionAnswer: string;
  isLoadingInfo: boolean;
  isLoadingQuestion: boolean;
  setQuestion: (question: string) => void;
  getNodeInfo: (node: any) => Promise<void>;
  askQuestion: (node: any, questionText: string) => Promise<void>;
  resetInfo: () => void;
}

/**
 * Custom hook to manage node information and questions
 */
export const useNodeInfo = (): UseNodeInfoReturn => {
  const [nodeInfo, setNodeInfo] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [questionAnswer, setQuestionAnswer] = useState<string>("");
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  const getNodeInfo = useCallback(async (node: any) => {
    setIsLoadingInfo(true);
    try {
      const response = await fetch("/api/node-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: node.data.label,
          path: node.data.path,
        }),
      });
      const data = await response.json();
      setNodeInfo(data.info || "No information available");
    } catch (error) {
      console.error("Error getting node info:", error);
      setNodeInfo("Error loading information");
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  const askQuestion = useCallback(async (node: any, questionText: string) => {
    if (!questionText.trim()) return;

    setIsLoadingQuestion(true);
    try {
      const response = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: node.data.label,
          path: node.data.path,
          question: questionText,
        }),
      });
      const data = await response.json();
      setQuestionAnswer(data.answer || "No answer available");
    } catch (error) {
      console.error("Error asking question:", error);
      setQuestionAnswer("Error getting answer");
    } finally {
      setIsLoadingQuestion(false);
    }
  }, []);

  const resetInfo = useCallback(() => {
    setNodeInfo("");
    setQuestion("");
    setQuestionAnswer("");
  }, []);

  return {
    nodeInfo,
    question,
    questionAnswer,
    isLoadingInfo,
    isLoadingQuestion,
    setQuestion,
    getNodeInfo,
    askQuestion,
    resetInfo,
  };
};
