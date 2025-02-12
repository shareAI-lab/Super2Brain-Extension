import { useState, useCallback } from "react";
import { getResponse } from "../utils/index.js";

export const useChat = (useInput = false) => {
  const [state, setState] = useState({
    isOpen: false,
    model: "gpt-4",
    query: "",
    loading: false,
    messages: [],
    expandedDocs: {},
    copiedMessageId: null,
  });

  // 使用函数式更新state
  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 更新消息列表的工具函数
  const updateMessage = useCallback((messageId, updates) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));
  }, []);

  // 处理提交
  const handleSubmit = useCallback(async () => {
    if (!useInput || !state.query.trim() || state.loading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: state.query,
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
    };

    updateState({
      messages: [...state.messages, userMessage, aiMessage],
      query: "",
      loading: true,
    });

    try {
      await getResponse(
        state.query,
        state.messages.map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        })),
        (progress) => {
          if (progress.stage === 2 && progress.results) {
            updateMessage(aiMessage.id, { related: progress.results });
          } else if (progress.stage === 3 && progress.response) {
            updateMessage(aiMessage.id, {
              content: progress.response,
              isClosed: true,
              isComplete: true,
              questionsLoading: true,
            });
          } else if (progress.stage === 5 && progress.questions) {
            updateMessage(aiMessage.id, {
              aboutQuestion: progress.questions,
              questionsLoading: false,
            });
          }
        }
      );
    } catch (error) {
      console.error("对话请求失败:", error);
    } finally {
      updateState({ loading: false });
    }
  }, [
    useInput,
    state.query,
    state.loading,
    state.messages,
    updateState,
    updateMessage,
  ]);

  // 处理复制
  const handleCopy = useCallback(async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      updateState({ copiedMessageId: messageId });
      setTimeout(() => updateState({ copiedMessageId: null }), 1500);
    } catch (err) {
      console.error("复制失败:", err);
    }
  }, []);

  // 处理重新生成
  const handleRegenerate = useCallback(
    async (messageId) => {
      const currentIndex = state.messages.findIndex(
        (msg) => msg.id === messageId
      );
      if (currentIndex < 1) return;

      const userQuestion = state.messages[currentIndex - 1].content;
      updateState({ loading: true });
      updateMessage(messageId, {
        content: "",
        questionsLoading: false,
        isComplete: false,
      });

      try {
        await getResponse(
          userQuestion,
          state.messages.slice(0, currentIndex - 1).map((msg) => ({
            role: msg.isUser ? "user" : "assistant",
            content: msg.content,
          })),
          (progress) => {
            if (progress.stage === 2 && progress.results) {
              updateMessage(messageId, { related: progress.results });
            } else if (progress.stage === 3 && progress.response) {
              updateMessage(messageId, {
                content: progress.response,
                isClosed: true,
              });
            } else if (progress.stage === 5 && progress.questions) {
              updateMessage(messageId, { aboutQuestion: progress.questions });
            }
          }
        );
      } catch (error) {
        console.error("重新生成失败:", error);
      } finally {
        updateState({ loading: false });
      }
    },
    [state.messages, updateState, updateMessage]
  );

  // 重置对话
  const handleReset = useCallback(() => {
    updateState({
      messages: [],
      query: "",
    });
  }, [updateState]);

  return {
    ...state,
    setModel: (model) => updateState({ model }),
    setQuery: (query) => updateState({ query }),
    setIsOpen: (isOpen) => updateState({ isOpen }),
    setExpandedDocs: (expandedDocs) => updateState({ expandedDocs }),
    handleSubmit,
    handleCopy,
    handleRegenerate,
    handleReset,
  };
};
