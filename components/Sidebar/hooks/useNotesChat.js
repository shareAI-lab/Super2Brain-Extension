import { useState, useCallback } from "react";
import { getResponse } from "../utils/index.js";

export const useNotesChat = (userInput = "", selectedModel) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState({});
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const handleSubmit = async (query) => {
    if (!userInput || !query.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: query,
      isUser: true,
      isComplete: true,
      isClosed: false,
    };

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      content: "",
      isUser: false,
      isComplete: false,
      isClosed: false,
      related: [],
      aboutQuestion: [],
      questionsLoading: true,
      model: selectedModel,
      statusMsg: `正在思考`,
      status: 0,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setLoading(true);

    try {
      await getResponse(
        query,
        messages.map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        })),
        userInput,
        selectedModel,
        (progress) => {
          if (progress.stage === 2) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      related: progress.results,
                      statusMsg: `正在搜索相关文档`,
                      status: 1,
                    }
                  : msg
              )
            );
          } else if (progress.stage === 3 && progress.response) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      content: progress.response,
                      isClosed: true,
                      isComplete: true,
                      questionsLoading: true,
                    }
                  : msg
              )
            );
          } else if (progress.stage === 5 && progress.questions) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      aboutQuestion: progress.questions,
                      questionsLoading: false,
                      statusMsg: `正在分析相关问题`,
                      status: 2,
                    }
                  : msg
              )
            );
          } else if (progress.stage === 4) {
            console.log("progress", progress);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      statusMsg: `正在生成回答`,
                      status: -1,
                    }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      console.error("对话请求失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleRegenerate = async (messageId) => {
    const currentIndex = messages.findIndex((msg) => msg.id === messageId);
    if (currentIndex < 1) return;

    const userQuestion = messages[currentIndex - 1].content;
    setLoading(true);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: "",
              questionsLoading: false,
              isComplete: false,
            }
          : msg
      )
    );

    try {
      await getResponse(
        userQuestion,
        messages.slice(0, currentIndex - 1).map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        })),
        (progress) => {
          if (progress.stage === 2 && progress.results) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, related: progress.results }
                  : msg
              )
            );
          } else if (progress.stage === 3 && progress.response) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      content: progress.response,
                      isClosed: true,
                    }
                  : msg
              )
            );
          } else if (progress.stage === 5 && progress.questions) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, aboutQuestion: progress.questions }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      console.error("重新生成失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    expandedDocs,
    copiedMessageId,
    setExpandedDocs,
    handleSubmit,
    handleCopy,
    handleRegenerate,
    handleReset,
  };
};
