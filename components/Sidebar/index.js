import React, { useEffect, useState, useCallback, useRef } from "react";
import { SettingPage } from "./components/settingPage";
import { ActivateBar } from "./components/common/activateBar";
import {
  getUserInput,
  getDeepSeekApiKey,
  getOpenaiApiKey,
  getClaudeApiKey,
  getOllamaConfig,
  getCustomConfig,
  getLmstudioConfig,
  getWebSummary,
  getWebAnalysis,
  setWebSummary,
  setWebAnalysis,
} from "../../public/storage";
import { TaskList } from "./components/taskList";
import { callAI, MessageRole } from "./services/ai";
import { WelcomePage } from "./components/welcomePage";
import { fetchUrlContent, fetchCriticalAnalysis } from "./utils/chat";
import { ActivateTabChatPanel } from "./components/activateTab";
import { NetworkSearch } from "./components/networkPage";
import { processContent } from "./utils/contentProcessor";
import { config } from "../config/index.js";
import { getWebPreview } from "../../public/storage";
import { DeepSearch } from "./components/deepSearch";
import { useDeepSearch } from "./hooks/useDeepSearch";
import { AnimatePresence, motion } from "framer-motion";
import { pipe } from "lodash/fp";
import { useRelatedQuestions } from "./hooks/useRelatedQuestions";
import { pageVariants, pageTransition } from "./contants/pageTransltions";

export default function Sidebar() {
  const [activatePage, setActivatePage] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageCriticalAnalysis, setPageCriticalAnalysis] = useState("");
  const [userInput, setUserInput] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageSummary, setPageSummary] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
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
  const [currentUrlTab, setCurrentUrlTab] = useState("welcome");
  const [urlTabCache, setUrlTabCache] = useState(new Map());

  const deepSearchState = useDeepSearch(userInput);
  const [isDeepThingActive, setIsDeepThingActive] = useState(false);

  const {
    fetchRelatedQuestions,
    currentUrlRelatedQuestions,
    currentUrlLoading,
  } = useRelatedQuestions({
    content: pageContent,
    currentUrl,
  });

  useEffect(() => {
    fetchRelatedQuestions();
  }, [pageContent, currentUrl]);

  useEffect(() => {
    const fetchUserInput = async () => {
      const input = await getUserInput();
      setUserInput(input);
    };

    fetchUserInput();
  }, []);

  useEffect(() => {
    const updateUrlTab = () => {
      if (currentUrl) {
        const cachedTab = urlTabCache.get(currentUrl);
        if (cachedTab) {
          setCurrentUrlTab(cachedTab);
        } else {
          setCurrentUrlTab("welcome");
          setUrlTabCache((prevCache) =>
            new Map(prevCache).set(currentUrl, "welcome")
          );
        }
      }
    };

    updateUrlTab();
  }, [currentUrl]);

  useEffect(() => {
    if (currentUrl && currentUrlTab) {
      setUrlTabCache((prevCache) =>
        new Map(prevCache).set(currentUrl, currentUrlTab)
      );
    }
  }, [currentUrl, currentUrlTab]);

  useEffect(() => {
    const fetchWebPreview = async () => {
      const webPreview = await getWebPreview();
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
      if (summary) {
        setPageLoading(false);
        setPageSummary(summary);
        return true;
      }
      return false;
    };

    const shouldFetchSummary = pipe(
      (url, content) => ({
        shouldSkip: shouldSkipFetch(url, content),
        hasExisting: handleExistingSummary(url),
      }),
      ({ shouldSkip, hasExisting }) => !shouldSkip && !hasExisting
    );

    const fetchSummary = async (url, content) => {
      try {
        setPageLoading(true);
        setLoadingUrls((prev) => new Map(prev).set(url, true));
        const cachedSummary = await getWebSummary(url);
        console.log("cachedSummary", cachedSummary);
        if (cachedSummary) {
          setPageLoading(false);
          setLoadingUrls((prev) => new Map(prev).set(url, false));
          setSummaryCache((prev) => new Map(prev).set(url, cachedSummary));
          setPageSummary(cachedSummary);
          return;
        }
        setLoadingUrls((prev) => new Map(prev).set(url, true));
        const summary = await fetchUrlContent(content, userInput);
        setWebSummary(url, summary);
        setLoadingUrls((prev) => new Map(prev).set(url, true));
        setSummaryCache((prev) => new Map(prev).set(url, summary));
        setPageSummary(summary);
      } catch (error) {
        console.error("获取摘要失败:", error);
      } finally {
        if (url === currentUrl) {
          setPageLoading(false);
        }
        setLoadingUrls((prev) => new Map(prev).set(url, false));
      }
    };

    if (shouldFetchSummary(currentUrl, pageContent)) {
      fetchSummary(currentUrl, pageContent);
    } else {
      setPageLoading(loadingUrls.get(currentUrl) ?? false);
      setPageSummary(summaryCache.get(currentUrl) ?? "");
    }
  }, [
    currentUrl,
    pageContent,
    userInput,
    webPreview,
    setWebPreview,
    pageLoading,
    summaryCache,
    loadingUrls,
  ]);

  useEffect(() => {
    if (
      !webPreview ||
      !userInput?.trim() ||
      !currentUrl ||
      currentUrlTab !== "analysis"
    ) {
      return;
    }

    const shouldFetchAnalysis = (url) => {
      const isLoading = loadingUrls.get(url);
      const hasAnalysis = criticalAnalysisCache.get(url);
      return !isLoading && !hasAnalysis;
    };

    const handleExistingAnalysis = (url) => {
      const analysis = criticalAnalysisCache.get(url);
      if (analysis) {
        setPageCriticalAnalysis(analysis);
        return true;
      }
      return false;
    };

    const fetchAnalysis = async (url, content) => {
      try {
        setPageLoading(true);
        setLoadingUrls((prev) => new Map(prev).set(url, true));
        const cachedAnalysis = await getWebAnalysis(url);
        if (cachedAnalysis) {
          setPageCriticalAnalysis(cachedAnalysis);
          setLoadingUrls((prev) => new Map(prev).set(url, false));
          setPageLoading(false);
          setCriticalAnalysisCache((prev) =>
            new Map(prev).set(url, cachedAnalysis)
          );
          return;
        }
        const analysis = await fetchCriticalAnalysis(content, userInput);
        setWebAnalysis(url, analysis);
        setCriticalAnalysisCache((prev) => new Map(prev).set(url, analysis));
        setPageCriticalAnalysis(analysis);
      } catch (error) {
        console.error("获取批判分析失败:", error);
      } finally {
        if (url === currentUrl) {
          setPageLoading(false);
        }
        setLoadingUrls((prev) => new Map(prev).set(url, false));
      }
    };

    if (shouldFetchAnalysis(currentUrl)) {
      if (!handleExistingAnalysis(currentUrl)) {
        fetchAnalysis(currentUrl, pageContent);
      }
    }
  }, [currentUrl, currentUrlTab, webPreview, userInput, pageContent]);

  const [settings, setSettings] = useState({
    super2brain: {
      baseUrl: config.baseUrl || "",
      apiKey: userInput || "",
    },
    deepseek: {
      baseUrl: "https://api.deepseek.com",
      apiKey: "",
    },
    openai: {
      baseUrl: "https://api.openai.com",
      apiKey: "",
    },
    claude: {
      baseUrl: "https://api.anthropic.com",
      apiKey: "",
    },
    ollama: {
      baseUrl: "http://localhost:11434",
      apiKey: "",
    },
    lmstudio: {
      baseUrl: "http://localhost:1234",
      apiKey: "",
    },
    custom: {
      baseUrl: "",
      apiKey: "",
    },
  });

  const [selectedModel, setSelectedModel] = useState("Deepseek-R1");
  const [selectedModelProvider, setSelectedModelProvider] =
    useState("super2brain");
  const [selectedModelIsSupportsImage, setSelectedModelIsSupportsImage] =
    useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const fetchDeepSeekConfig = async () => {
    try {
      const configs = await Promise.all([
        getDeepSeekApiKey(),
        getOpenaiApiKey(),
        getClaudeApiKey(),
      ]);
      const currentUserInput = await getUserInput();
      const lmstudioConfig = await getLmstudioConfig();
      const ollamaConfig = await getOllamaConfig();
      const customConfig = await getCustomConfig();

      setSettings((prev) => ({
        super2brain: {
          baseUrl: `${config.baseUrl}/v1` || "",
          apiKey: currentUserInput || "",
        },
        deepseek: {
          baseUrl: "https://api.deepseek.com" || "",
          apiKey: configs[0] || "",
        },
        openai: {
          baseUrl: "https://api.openai.com" || "",
          apiKey: configs[1] || "",
        },
        claude: {
          baseUrl: "https://api.anthropic.com" || "",
          apiKey: configs[2] || "",
        },
        ollama: {
          baseUrl: ollamaConfig.url || "",
          apiKey: ollamaConfig.apiKey || "",
        },
        lmstudio: {
          baseUrl: lmstudioConfig.url || "",
          apiKey: lmstudioConfig.apiKey || "",
        },
        custom: {
          baseUrl: customConfig.url || "",
          apiKey: customConfig.apiKey || "",
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
      if (message.type === "MARKDOWN_CONTENT") {
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
        console.log("selectedModel", selectedModelProvider);

        const currentMessages = [
          {
            role: MessageRole.SYSTEM,
            content: pageSystemMessage,
          },
          ...getCurrentUrlMessages(),
          ...processedMessages,
        ];
        console.log("currentMessages", settings[selectedModelProvider].apiKey);
        const response = await callAI({
          provider: selectedModelProvider,
          baseUrl: settings[selectedModelProvider].baseUrl,
          apiKey: settings[selectedModelProvider].apiKey,
          model: selectedModel.toLowerCase(),
          messages: currentMessages,
          options: {
            temperature: 0.7,
            maxTokens: 2000,
          },
          onProgress: (progress) => {
            if (progress.state === 1) {
              const response = progress.response;
              addMessage(
                currentUrl,
                MessageRole.ASSISTANT,
                response.content,
                selectedModel
              );
            }
            if (progress.state === 2) {
              const relatedQuestions = progress.relatedQuestions;
              console.log("relatedQuestions", relatedQuestions);
            }
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
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className="flex-1 flex flex-col min-w-0 m-1 rounded-xl bg-white">
        <AnimatePresence mode="wait">
          {activatePage === 0 ? (
            <motion.div
              key="welcome"
              className="flex-1 w-full"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <WelcomePage
                currentUrlTab={currentUrlTab}
                setCurrentUrlTab={setCurrentUrlTab}
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
            </motion.div>
          ) : activatePage === 1 ? (
            <motion.div
              key="chat"
              initial="initial"
              className="flex-1"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ActivateTabChatPanel
                currentUrlRelatedQuestions={currentUrlRelatedQuestions}
                currentUrlLoading={currentUrlLoading}
                pageContent={pageContent}
                useInput={userInput}
                isContentReady={isContentReady}
                selectedModelProvider={selectedModelProvider}
                selectedModelIsSupportsImage={selectedModelIsSupportsImage}
                setSelectedModelProvider={setSelectedModelProvider}
                setSelectedModelIsSupportsImage={
                  setSelectedModelIsSupportsImage
                }
                setActivatePage={setActivatePage}
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
            </motion.div>
          ) : activatePage === 2 ? (
            <motion.div
              key="network"
              className="flex-1"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <NetworkSearch
                userInput={userInput}
                setActivatePage={setActivatePage}
                selectedModelProvider={selectedModelProvider}
                selectedModelIsSupportsImage={selectedModelIsSupportsImage}
                setSelectedModelProvider={setSelectedModelProvider}
                setSelectedModelIsSupportsImage={
                  setSelectedModelIsSupportsImage
                }
              />
            </motion.div>
          ) : activatePage === 3 ? (
            <motion.div
              key="deepSearch"
              className="flex-1"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <DeepSearch
                query={deepSearchState.query}
                setQuery={deepSearchState.setQuery}
                messages={deepSearchState.messages}
                isLoading={deepSearchState.isLoading}
                currentStatus={deepSearchState.currentStatus}
                onSendMessage={deepSearchState.handleSendMessage}
                isDeepThingActive={isDeepThingActive}
                setIsDeepThingActive={setIsDeepThingActive}
              />
            </motion.div>
          ) : activatePage === 5 ? (
            <motion.div
              key="settings"
              className="flex-1"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <SettingPage
                settings={settings}
                setSettings={setSettings}
                webPreview={webPreview}
                setWebPreview={setWebPreview}
                setUserInput={setUserInput}
                userInput={userInput}
              />
            </motion.div>
          ) : activatePage === 4 ? (
            <motion.div
              key="taskList"
              className="flex-1 h-full overflow-hidden"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <TaskList />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <ActivateBar
          activatePage={activatePage}
          setActivatePage={setActivatePage}
        />
      </div>
    </div>
  );
}
