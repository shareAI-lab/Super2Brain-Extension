import { useState } from "react";

export const useDeepSearch = (userInput, maxDepth = 3, getNeedTime) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

  const handleSendMessage = async (question, getResponse) => {
    if (currentStatus.length > 0) setCurrentStatus("");
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    const userMessage = { role: "user", content: question, isComplete: true };
    setMessages([userMessage]);
    try {
      const aiMessage = {
        role: "assistant",
        status: "thinking",
        content: currentStatus,
        isComplete: false,
      };

      setMessages([userMessage, aiMessage]);
      const needTime = getNeedTime(maxDepth);
      const response = await getResponse(question, 0, maxDepth, userInput, (status) => {
        setCurrentStatus(status);
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === "assistant" && !lastMessage.isComplete) {
            lastMessage.content = status;
          }
          return newMessages;
        });
      });
      setMessages([
        userMessage,
        {
          role: "assistant",
          content: response,
          isComplete: true,
        },
      ]);
      console.log("response", response);
    } catch (error) {
      console.error("发送消息失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    query,
    setQuery,
    messages,
    setMessages,
    isLoading,
    currentStatus,
    handleSendMessage,
  };
};
