import React, { useEffect, useState, useCallback, useRef } from "react";
import { SettingPage } from "./components/settingPage";
import { ActivateBar } from "./components/common/activateBar";
import { NotesSearch } from "./components/notesPage";
import { getItem, getUserInput } from "../../public/storage";
import { callAI, MessageRole } from "./services/ai";
import { AI_MODELS } from "./config/models";
import { WelcomePage } from "./components/welcomePage";
import { fetchUrlContent, fetchCriticalAnalysis } from "./utils/chat";
import { ActivateTabChatPanel } from "./components/activateTab";
import { NetworkSearch } from "./components/networkPage";
import { processContent } from "./utils/contentProcessor";
import { config } from "../config/index.js";
import { getWebPreview } from "../../public/storage";

export default function Sidebar() {
  const [activatePage, setActivatePage] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageCriticalAnalysis, setPageCriticalAnalysis] = useState("");
  const [userInput, setUserInput] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageSummary, setPageSummary] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [messages, setMessages] = useState(new Map());
  const contentCacheRef = useRef(new Map());
  const [pageSystemMessage, setPageSystemMessage] = useState("");
  const thinkingStateRef = useRef(new Map());
  const [summaryCache, setSummaryCache] = useState(new Map());
  const [criticalAnalysisCache, setCriticalAnalysisCache] = useState(new Map());
  const [loadingUrls, setLoadingUrls] = useState(new Map());
  const [isContentReady, setIsContentReady] = useState(true);
  const [webPreview, setWebPreview] = useState(false);

  useEffect(() => {
    const fetchWebPreview = async () => {
      const webPreview = await getWebPreview();
      console.log("🔄 网页速览:", webPreview);
      setWebPreview(webPreview);
    };
    fetchWebPreview();
  }, []);

  useEffect(() => {
    const fetchUserInput = async () => {
      const input = await getUserInput();

      setUserInput(input);
    };

    fetchUserInput();
  }, []);

  useEffect(() => {
    if (!webPreview) {
      return;
    }

    if (!userInput?.trim()) {
      return;
    }

    const shouldSkipFetch = (url, content) => {
      const isLoading = loadingUrls.get(url);
      const hasSummary = summaryCache.get(url);
      const hasNoContent = !content || !url;
      return isLoading || hasSummary || hasNoContent;
    };

    const handleExistingSummary = (url) => {
      const summary = summaryCache.get(url);
      const criticalAnalysis = criticalAnalysisCache.get(url);
      if (summary && criticalAnalysis) {
        setPageLoading(false);
        setPageSummary(summary);
        setPageCriticalAnalysis(criticalAnalysis);
        return true;
      }
      return false;
    };

    const fetchSummary = async (url, content) => {
      try {
        setPageLoading(true);
        setLoadingUrls((prev) => new Map(prev).set(url, true));
        const summary = await fetchUrlContent(content);
        const criticalAnalysis = await fetchCriticalAnalysis(content);
        setSummaryCache((prev) => new Map(prev).set(url, summary));
        setCriticalAnalysisCache((prev) =>
          new Map(prev).set(url, criticalAnalysis)
        );
        setPageSummary(summary);
        setPageCriticalAnalysis(criticalAnalysis);
      } catch (error) {
        console.error("获取摘要失败:", error);
      } finally {
        setPageLoading(false);
        setLoadingUrls((prev) => new Map(prev).set(url, false));
      }
    };

    if (
      !shouldSkipFetch(currentUrl, pageContent) &&
      !handleExistingSummary(currentUrl)
    ) {
      fetchSummary(currentUrl, pageContent);
    }
  }, [currentUrl, pageContent, userInput, webPreview, setWebPreview]);

  const [settings, setSettings] = useState({
    super2brain: {
      baseUrl: config.modelUrl || "",
      apiKey: config.apiKey || "",
    },
    deepseek: {
      baseUrl: "",
      apiKey: "",
    },
    openai: {
      baseUrl: "",
      apiKey: "",
    },
    claude: {
      baseUrl: "",
      apiKey: "",
    },
  });

  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [selectedModelProvider, setSelectedModelProvider] =
    useState("super2brain");
  const [selectedModelIsSupportsImage, setSelectedModelIsSupportsImage] =
    useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const fetchDeepSeekConfig = async () => {
    try {
      const configs = await Promise.all([
        getItem("deepseekBaseUrl"),
        getItem("deepseekApiKey"),
        getItem("openaiBaseUrl"),
        getItem("openaiApiKey"),
        getItem("claudeBaseUrl"),
        getItem("claudeApiKey"),
      ]);

      setSettings((prev) => ({
        super2brain: {
          baseUrl: config.modelUrl || "",
          apiKey: config.apiKey || "",
        },
        deepseek: {
          baseUrl: configs[0] || "",
          apiKey: configs[1] || "",
        },
        openai: {
          baseUrl: configs[2] || "",
          apiKey: configs[3] || "",
        },
        claude: {
          baseUrl: configs[4] || "",
          apiKey: configs[5] || "",
        },
      }));
    } catch (error) {
      console.error("获取 DeepSeek 配置失败:", error);
    }
  };

  useEffect(() => {
    fetchDeepSeekConfig();
  }, []);

  const addMessage = useCallback((url, role, content, model = "") => {
    setMessages((prevMessages) => {
      const urlMessages = prevMessages.get(url) || [];
      const newMessages = new Map(prevMessages);
      newMessages.set(url, [
        ...urlMessages,
        { role, content, timestamp: Date.now(), model },
      ]);
      return newMessages;
    });
  }, []);

  const getCurrentUrlMessages = React.useCallback(() => {
    return (messages.get(currentUrl) || []).filter(
      (msg) => msg.role !== "system"
    );
  }, [currentUrl, messages]);

  const clearCurrentUrlMessages = useCallback(() => {
    setMessages((prevMessages) => {
      const newMessages = new Map(prevMessages);
      newMessages.delete(currentUrl);
      return newMessages;
    });
  }, [currentUrl]);

  useEffect(() => {
    const handleMessage = (message) => {
      console.log("📨 收到消息:", {
        type: message.type,
        payloadLength: message.payload?.length,
      });

      if (message.type === "MARKDOWN_CONTENT") {
        console.log("📥 接收到页面内容", {
          url: currentUrl,
          contentLength: message.payload.length,
        });
        contentCacheRef.current.set(currentUrl, message.payload);
        setPageContent(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    const updateUrlAndContent = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        const url = tab?.url ?? "";

        const checkContentScriptReady = async (tabId) => {
          try {
            const response = await new Promise((resolve, reject) => {
              chrome.tabs.sendMessage(tabId, { type: "PING" }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(response);
                }
              });
            });
            return response?.status === "ok";
          } catch (error) {
            console.log("Content script 未就绪:", error);
            return false;
          }
        };

        const isReady = await checkContentScriptReady(tab.id);
        setIsContentReady(isReady);

        if (!isReady) {
          console.log("等待 content script 就绪...");
          setPageContent("页面加载中，请稍后重试...");
          setTimeout(() => updateUrlAndContent(), 1000);
          return;
        }

        if (url !== currentUrl) {
          setCurrentUrl(url);
          setPageSystemMessage("");
          setIsAiThinking(false);
          thinkingStateRef.current.set(url, false);
          setPageContent("");
          const summary = summaryCache.get(url) ?? "";
          const criticalAnalysis = criticalAnalysisCache.get(url) ?? "";
          setPageSummary(summary);
          setPageCriticalAnalysis(criticalAnalysis);
        }

        if (
          url.startsWith("chrome://") ||
          url.startsWith("chrome-extension://")
        ) {
          console.log("⚠️ 不支持的URL类型");
          setPageContent("此页面不支持内容获取");
          return;
        }

        if (url) {
          const cachedContent = contentCacheRef.current.get(url);
          console.log("📦 检查内容缓存:", {
            url,
            hasCachedContent: !!cachedContent,
            cachedContentLength: cachedContent?.length,
          });

          if (cachedContent) {
            console.log("✅ 使用缓存的内容");
            const buildSystemMessage = (cachedContent) => `
              你当前访问的页面是：${url}
              页面内容是：${cachedContent}
            `;

            const newSystemMessage = buildSystemMessage(cachedContent);
            setPageSystemMessage(newSystemMessage);
            setPageContent(cachedContent);
            setMessages((prevMessages) => {
              const newMessages = new Map(prevMessages);
              const urlMessages = newMessages.get(url) || [];
              const messagesWithoutSystem = urlMessages.filter(
                (msg) => msg.role !== "system"
              );
              newMessages.set(url, [
                {
                  role: "system",
                  content: newSystemMessage,
                  timestamp: Date.now(),
                },
                ...messagesWithoutSystem,
              ]);
              return newMessages;
            });
          } else {
            console.log("🔄 没有找到缓存，准备发送消息给content script");
            const sendMessagePromise = () =>
              new Promise((resolve, reject) => {
                console.log("📤 发送GET_MARKDOWN消息到tab:", tab.id);
                chrome.tabs.sendMessage(
                  tab.id,
                  { type: "GET_MARKDOWN", url },
                  (response) => {
                    if (chrome.runtime.lastError) {
                      console.error(
                        "❌ 发送消息失败:",
                        chrome.runtime.lastError
                      );
                      reject(chrome.runtime.lastError);
                    } else {
                      console.log("✅ 消息发送成功，等待响应");
                      resolve(response);
                    }
                  }
                );
              });

            try {
              await sendMessagePromise();
            } catch (error) {
              console.warn("⚠️ content script未准备好:", error);
              setPageContent("页面加载中，请稍后重试...");
              console.log("🔄 1秒后重试获取内容");
              setTimeout(() => updateUrlAndContent(), 1000);
            }
          }
        }
      } catch (error) {
        console.error("❌ 获取页面内容失败:", error);
      }
    };

    const handleTabUpdate = (tabId, changeInfo) =>
      changeInfo.url && updateUrlAndContent();

    updateUrlAndContent();
    chrome.tabs.onActivated.addListener(updateUrlAndContent);
    chrome.tabs.onUpdated.addListener(handleTabUpdate);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.tabs.onActivated.removeListener(updateUrlAndContent);
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, [currentUrl, addMessage]);

  useEffect(() => {
    setPageSystemMessage("");
    setIsAiThinking(false);
  }, [currentUrl]);

  const handleSubmit = React.useCallback(
    async (messages) => {
      try {
        const processedMessages = messages.map((message) => ({
          role: MessageRole.USER,
          content: processContent(
            message.content,
            selectedModel,
            message.imageData
          ),
        }));

        processedMessages.forEach((message) => {
          addMessage(currentUrl, message.role, message.content);
        });

        setIsAiThinking(true);
        thinkingStateRef.current.set(currentUrl, true);

        const selectedModelConfig = AI_MODELS[selectedModel];

        if (!selectedModelConfig) {
          throw new Error(`未找到模型配置: ${selectedModel}`);
        }

        const currentMessages = [
          {
            role: MessageRole.SYSTEM,
            content: pageSystemMessage,
          },
          ...getCurrentUrlMessages(),
          ...processedMessages,
        ];
        console.log("🔄 当前消息:", selectedModelProvider);
        console.log("🔄 当前消息:", settings[selectedModelProvider].baseUrl);
        const response = await callAI({
          provider: selectedModelConfig.provider,
          baseUrl: settings[selectedModelProvider].baseUrl,
          apiKey: settings[selectedModelProvider].apiKey,
          model: selectedModel,
          messages: currentMessages,

          options: {
            temperature: 0.7,
            maxTokens: 2000,
          },
        });

        addMessage(
          currentUrl,
          MessageRole.ASSISTANT,
          response.content,
          selectedModel
        );
      } catch (error) {
        console.error("API 请求失败:", error);
        addMessage(
          currentUrl,
          MessageRole.ASSISTANT,
          `请求失败: 请检查你的 apikey 或者 网络`
        );
      } finally {
        setIsAiThinking(false);
        thinkingStateRef.current.set(currentUrl, false);
      }
    },
    [
      currentUrl,
      addMessage,
      getCurrentUrlMessages,
      pageSystemMessage,
      settings,
      selectedModel,
    ]
  );

  const handleCopy = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleRetry = useCallback(
    async (messageId) => {
      if (isAiThinking) return;

      const messages = getCurrentUrlMessages();

      const getUserMessage = (messages, messageId) =>
        messages[messageId - 1]?.role === "user"
          ? messages[messageId - 1]
          : null;

      const userMessage = getUserMessage(messages, messageId);
      if (!userMessage) return;

      const filterMessagesUpToIndex = (messages, targetIndex) =>
        messages.filter((_, index) => index <= targetIndex - 1);

      setMessages((prevMessages) => {
        const urlMessages = prevMessages.get(currentUrl) || [];
        return new Map(prevMessages).set(
          currentUrl,
          filterMessagesUpToIndex(urlMessages, messageId)
        );
      });

      await handleSubmit([{ content: userMessage.content }]);
    },
    [currentUrl, getCurrentUrlMessages, handleSubmit, isAiThinking]
  );

  useEffect(() => {
    return () => {
      const cleanup = () => {
        document.querySelectorAll('img[src^="blob:"]').forEach((img) => {
          URL.revokeObjectURL(img.src);
        });
      };
      cleanup();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 min-w-[500px]">
      <div className="flex-1 flex flex-col min-w-0 py-1 pl-1">
        {activatePage === 0 ? (
          <div className="flex-1">
            <WelcomePage
              webPreview={webPreview}
              userInput={userInput}
              key={currentUrl}
              currentUrl={currentUrl}
              pageContent={pageContent}
              pageLoading={pageLoading}
              pageSummary={pageSummary}
              pageCriticalAnalysis={pageCriticalAnalysis}
              setActivatePage={setActivatePage}
            />
          </div>
        ) : activatePage === 1 ? (
          <ActivateTabChatPanel
            useInput={userInput}
            isContentReady={isContentReady}
            selectedModelProvider={selectedModelProvider}
            selectedModelIsSupportsImage={selectedModelIsSupportsImage}
            setSelectedModelProvider={setSelectedModelProvider}
            setSelectedModelIsSupportsImage={setSelectedModelIsSupportsImage}
            getCurrentUrlMessages={getCurrentUrlMessages}
            isAiThinking={isAiThinking}
            copiedMessageId={copiedMessageId}
            onCopy={handleCopy}
            onRetry={handleRetry}
            onSubmit={handleSubmit}
            clearCurrentUrlMessages={clearCurrentUrlMessages}
            currentUrl={currentUrl}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        ) : activatePage === 2 ? (
          <div>
            <NetworkSearch />
          </div>
        ) : activatePage === 3 ? (
          <div>
            <NotesSearch
              useInput={userInput}
              setActivatePage={setActivatePage}
            />
          </div>
        ) : activatePage === 4 ? (
          <div>
            <SettingPage
              webPreview={webPreview}
              setWebPreview={setWebPreview}
            />
          </div>
        ) : null}
      </div>

      <div className="w-10 flex-shrink-0 bg-gray-100">
        <ActivateBar
          activatePage={activatePage}
          setActivatePage={setActivatePage}
        />
      </div>
    </div>
  );
}
