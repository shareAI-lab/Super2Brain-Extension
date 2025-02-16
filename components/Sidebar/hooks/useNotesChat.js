import { useState, useCallback } from "react";
import { getResponse } from "../utils/index.js";

export const useNotesChat = (userInput = "", selectedModel, searchEnabled) => {
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
      reasoning_content: "",
      isUser: false,
      isComplete: false,
      isClosed: false,
      related: [],
      aboutQuestion: [],
      questionsLoading: true,
      model: selectedModel,
      isReasoningExpanded: true,
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
        selectedModel.toLowerCase(),
        searchEnabled,
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
          } else if (progress.stage === 3) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      reasoning_content:
                        progress.reasoning_content || msg.reasoning_content,
                      content: progress.response || msg.content,
                      ...(progress.response && {
                        isClosed: true,
                        isComplete: true,
                        questionsLoading: true,
                        statusMsg: null,
                        status: 0,
                      }),
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
                      isReasoningExpanded: false,
                      aboutQuestion: progress.questions,
                      questionsLoading: false,
                    }
                  : msg
              )
            );
          } else if (progress.stage === 4) {
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
          } else if (progress.stage === 6) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      statusMsg: progress.response,
                      status: 6,
                      isComplete: true,
                      questionsLoading: false,
                    }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      console.error("对话请求失败:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? {
                ...msg,
                isComplete: true,
                questionsLoading: false,
                statusMsg: "请求失败，请重试",
                status: 6,
              }
            : msg
        )
      );
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
              questionsLoading: true,
              isComplete: false,
              statusMsg: "正在思考",
              status: 0,
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
        userInput,
        selectedModel.toLowerCase(),
        searchEnabled,
        (progress) => {
          if (progress.stage === 2 && progress.results) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, related: progress.results }
                  : msg
              )
            );
          } else if (progress.stage === 3) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      reasoning_content:
                        progress.reasoning_content || msg.reasoning_content,
                      content: progress.response || msg.content,
                      ...(progress.response && {
                        isClosed: true,
                        isComplete: true,
                        questionsLoading: true,
                      }),
                    }
                  : msg
              )
            );
          } else if (progress.stage === 5 && progress.questions) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      isReasoningExpanded: false,
                      aboutQuestion: progress.questions,
                      questionsLoading: false,
                    }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      console.error("重新生成失败:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                isComplete: true,
                questionsLoading: false,
                statusMsg: "重新生成失败，请重试",
                status: 6,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setMessages([]);
  }, []);

  const handleReasoningExpand = useCallback((messageId, isExpanded) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              isReasoningExpanded: isExpanded,
            }
          : msg
      )
    );
  }, []);

  return {
    setMessages,
    messages,
    loading,
    expandedDocs,
    copiedMessageId,
    setExpandedDocs,
    handleSubmit,
    handleCopy,
    handleRegenerate,
    handleReset,
    handleReasoningExpand,
  };
};
