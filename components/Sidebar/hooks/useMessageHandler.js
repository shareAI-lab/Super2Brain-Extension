import { useState } from "react";
import { getResponse } from "../components/networkPage/utils/index.js";
import { createWebContent } from "../components/networkPage/utils/thingAgent.js";
import { config } from "../../config/index";

const fetchRelatedQuestions = async (query, answer, userInput) => {
  const response = await fetch(`${config.baseUrl}/text/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userInput}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "你是一个帮助生成相关问题的AI助手。请基于用户的上一个问题和回答，生成3个后续问题。",
        },
        {
          role: "user",
          content: `基于以下问题和回答，生成3个用户可能会继续追问的后续问题：
          
        原问题：${query}
        回答：${answer}

        要求：
        1. 问题要对原问题进行深入探讨
        2. 寻求更多相关细节
        3. 探索相关但不同的方面

        请直接返回3个问题，每个问题占一行。`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("获取相关问题失败");
  }

  const data = await response.json();
  return (data?.choices?.[0]?.message?.content || "")
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);
};

export const useMessageHandler = (thinkingAgent, model, userInput) => {
  const [message, setMessage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState(0);
  const filterUrls = (content) => {
    try {
      if (typeof window === "undefined") return [];

      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");

      const searchResults = Array.from(doc.querySelectorAll(".b_algo")).map(
        (result) => {
          const linkElement = result.querySelector("h2 a");
          const descElement = result.querySelector(".b_caption p");

          return {
            url: linkElement?.href || "",
            title: linkElement?.textContent?.trim() || "无标题",
            description: descElement?.textContent?.trim() || "",
          };
        }
      );

      return searchResults
        .filter((item) => {
          const url = item.url || "";
          const title = item.title || "";
          const description = item.description || "";

          const excludePatterns = [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})(\/ad|\/ads|\/advertisement)/,
            /sponsored/i,
            /广告/,
            /推广/,
            /chrome-extension:\/\//,
            /chrome\.google\.com\/webstore/,
            /addons\.mozilla\.org/,
            /microsoftedge\.microsoft\.com\/addons/,
            /zhihu\.com/,
            /xiaohongshu\.com/,
            /xhs\.com/,
            /doubleclick\.net/,
            /googleadservices\.com/,
            /adnxs\.com/,
            /adsystem\.com/,
          ];

          return !excludePatterns.some(
            (pattern) =>
              pattern.test(url) ||
              pattern.test(title) ||
              pattern.test(description)
          );
        })
        .filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.url === item.url)
        )
        .filter(
          (item) =>
            item.url &&
            item.url !== "javascript:void(0)" &&
            !item.url.startsWith("chrome-extension://")
        )
        .slice(0, 10);
    } catch (error) {
      console.error("解析搜索结果时出错:", error);
      return [];
    }
  };

  const updateUrlStatus = (url, status) => {
    const updateList = (list) =>
      list.map((item) =>
        item.url === url
          ? {
              ...item,
              status,
              iconBackground: status === 2 ? "bg-green-500" : "bg-blue-500",
            }
          : item
      );

    setMessage((prevMessages) => {
      const messages = [...prevMessages];
      const lastAssistantIndex = messages.findLastIndex(
        (msg) => msg.role === "assistant"
      );

      if (
        lastAssistantIndex !== -1 &&
        messages[lastAssistantIndex].urlListData
      ) {
        messages[lastAssistantIndex] = {
          ...messages[lastAssistantIndex],
          urlListData: updateList(messages[lastAssistantIndex].urlListData),
        };
      }

      return messages;
    });
  };

  const handleSubmit = async (query) => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);

    try {
      setMessage((prev) => [
        ...prev,
        { role: "user", content: query, isComplete: true },
        {
          role: "assistant",
          content: "",
          urlListData: [],
          model: model,
          status: "thinking",
          statusMessage: "正在思考问题",
          relatedQuestions: [],
          questionsLoading: true,
        },
      ]);

      await getResponse(
        query,
        async (progress) => {
          if (progress.state === 2) {
            setMessage((prev) => {
              const messages = [...prev];
              const lastIndex = messages.findLastIndex(
                (msg) => msg.role === "assistant"
              );
              if (lastIndex !== -1) {
                messages[lastIndex] = {
                  ...messages[lastIndex],
                  content: progress.response,
                  isComplete: true,
                  isEasySearch: true,
                  status: "complete",
                  statusMessage: "",
                };
              }
              return messages;
            });

            try {
              const relatedQuestions = await fetchRelatedQuestions(
                query,
                progress.response,
                userInput
              );
              setMessage((prev) =>
                updateLastAssistantMessage(prev, {
                  relatedQuestions,
                  questionsLoading: false,
                })
              );
            } catch (error) {
              console.error("获取相关问题失败:", error);
              setMessage((prev) =>
                updateLastAssistantMessage(prev, {
                  relatedQuestions: [],
                  questionsLoading: false,
                })
              );
            }

            setIsLoading(false);
          } else if (progress.state === 1 && progress.searchUrl) {
            setMessage((prev) =>
              updateLastAssistantMessage(prev, {
                status: "searching",
                statusMessage: "正在搜索相关信息...",
              })
            );

            try {
              const searchResponse = await fetch(progress.searchUrl);
              if (!searchResponse.ok) {
                throw new Error(`HTTP error! status: ${searchResponse.status}`);
              }
              const content = await searchResponse.text();
              const filteredUrls = filterUrls(content);
              const processUrls = filteredUrls.slice(0, 5);

              setMessage((prev) =>
                updateLastAssistantMessage(prev, {
                  status: "fetching",
                  statusMessage: "正在获取网页内容",
                })
              );

              const extractResponse = await chrome.runtime.sendMessage({
                action: "extractMultipleContents",
                urls: processUrls.map((result) => result.url),
              });

              setMessage((prev) =>
                updateLastAssistantMessage(prev, {
                  status: "analyzing",
                  statusMessage: "正在获取网页内容",
                })
              );

              if (extractResponse.success) {
                const webContents = extractResponse.contents.map(
                  ({ url, content, title }) =>
                    createWebContent(url, content, query, title)
                );
                const urlToTitleMap = processUrls.reduce(
                  (acc, item) => ({
                    ...acc,
                    [item.url]: item.title,
                  }),
                  {}
                );

                const enrichedWebContents = webContents.map((webContent) => ({
                  ...webContent,
                  title: urlToTitleMap[webContent.url] || webContent.title,
                }));

                setMessage((prev) =>
                  updateLastAssistantMessage(prev, {
                    status: "generating",
                    statusMessage: "正在理解网页内容",
                    urlListData: enrichedWebContents.map((url) => ({
                      ...url,
                      status: 1,
                      iconBackground: "bg-blue-500",
                    })),
                  })
                );

                const response = await thinkingAgent.chat(
                  query,
                  enrichedWebContents,
                  message,
                  (url, status) => {
                    updateUrlStatus(url, status);
                    const allUrlsProcessed = (prev) => {
                      const lastMessage = prev[prev.length - 1];
                      return lastMessage.urlListData?.every(
                        (url) => url.status === 2
                      );
                    };

                    setMessage((prev) => {
                      if (allUrlsProcessed(prev)) {
                        return updateLastAssistantMessage(prev, {
                          status: "merging",
                          statusMessage: "正在整合所有信息...",
                        });
                      }
                      return prev;
                    });
                  }
                );
                setMessage((prev) =>
                  updateLastAssistantMessage(prev, {
                    content: response,
                    isComplete: true,
                    status: "processing",
                    statusMessage: "",
                  })
                );
                const relatedQuestions = await fetchRelatedQuestions(
                  query,
                  response,
                  userInput
                );
                setMessage((prev) =>
                  updateLastAssistantMessage(prev, {
                    content: response,
                    isComplete: true,
                    status: "complete",
                    statusMessage: "",
                    relatedQuestions: relatedQuestions,
                    questionsLoading: false,
                  })
                );
              }
            } catch (error) {
              console.error("内容分析出错:", error);
              setMessage((prev) =>
                updateLastAssistantMessage(prev, {
                  status: "error",
                  statusMessage: "内容分析出错，请重试",
                })
              );
            }
          }
        },
        message
      );
    } catch (error) {
      console.error("处理响应时出错:", error);
      setMessage((prev) =>
        updateLastAssistantMessage(prev, {
          status: "error",
          statusMessage: "处理响应时出错，请重试",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastAssistantMessage = (prevMessages, updates) => {
    const messages = [...prevMessages];
    const lastIndex = messages.findLastIndex((msg) => msg.role === "assistant");
    if (lastIndex !== -1) {
      messages[lastIndex] = {
        ...messages[lastIndex],
        ...updates,
      };
    }
    return messages;
  };

  return {
    message,
    isLoading,
    handleSubmit,
    setMessage,
  };
};
