import { useState } from "react";
import { getResponse } from "../components/networkPage/utils/index.js";
import { createWebContent } from "../components/networkPage/utils/thingAgent.js";

export const useMessageHandler = (thinkingAgent, model) => {
  const [message, setMessage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
        { role: "assistant", content: "", urlListData: [], model: model },
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
                };
              }
              return messages;
            });
            setIsLoading(false);
          } else if (progress.state === 1 && progress.searchUrl) {
            try {
              const searchResponse = await fetch(progress.searchUrl);
              if (!searchResponse.ok) {
                throw new Error(`HTTP error! status: ${searchResponse.status}`);
              }
              const content = await searchResponse.text();
              const filteredUrls = filterUrls(content);

              const processUrls = filteredUrls
                .slice(0, 5)
                .filter(
                  (result) =>
                    !result.url.startsWith("chrome://") &&
                    !result.url.startsWith("chrome-extension://")
                );

              const urlListData = processUrls.map((result, index) => ({
                id: index,
                content: result.title,
                description: result.description,
                url: result.url,
                status: 0,
              }));

              setMessage((prev) => {
                const messages = [...prev];
                const lastIndex = messages.findLastIndex(
                  (msg) => msg.role === "assistant"
                );
                if (lastIndex !== -1) {
                  messages[lastIndex] = {
                    ...messages[lastIndex],
                    urlListData,
                    isComplete: false,
                  };
                }
                return messages;
              });

              setMessage((prev) => {
                const messages = [...prev];
                const lastIndex = messages.findLastIndex(
                  (msg) => msg.role === "assistant"
                );
                if (lastIndex !== -1) {
                  messages[lastIndex] = {
                    ...messages[lastIndex],
                    urlListData: messages[lastIndex].urlListData.map(
                      (item) => ({
                        ...item,
                        status: 3,
                      })
                    ),
                  };
                }
                return messages;
              });

              const extractResponse = await chrome.runtime.sendMessage({
                action: "extractMultipleContents",
                urls: processUrls.map((result) => result.url),
              });

              setMessage((prev) => {
                const messages = [...prev];
                const lastIndex = messages.findLastIndex(
                  (msg) => msg.role === "assistant"
                );
                if (lastIndex !== -1) {
                  messages[lastIndex] = {
                    ...messages[lastIndex],
                    urlListData: messages[lastIndex].urlListData.map(
                      (item) => ({
                        ...item,
                        status: 0,
                      })
                    ),
                  };
                }
                return messages;
              });

              if (extractResponse.success) {
                const webContents = extractResponse.contents.map(
                  ({ url, content }) => createWebContent(url, content, query)
                );

                const response = await thinkingAgent.chat(
                  query,
                  webContents,
                  message,
                  updateUrlStatus
                );

                setMessage((prev) => {
                  const messages = [...prev];
                  const lastIndex = messages.findLastIndex(
                    (msg) => msg.role === "assistant"
                  );
                  if (lastIndex !== -1) {
                    messages[lastIndex] = {
                      ...messages[lastIndex],
                      content: response,
                      isComplete: true,
                    };
                  }
                  return messages;
                });
              }
            } catch (error) {
              console.error("内容分析出错:", error);
            }
          }
        },
        message
      );
    } catch (error) {
      console.error("处理响应时出错:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    message,
    isLoading,
    handleSubmit,
    setMessage,
  };
};
