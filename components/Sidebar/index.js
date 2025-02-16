import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { SettingPage } from "./components/settingPage";
import { ActivateBar } from "./components/common/activateBar";
import {
  getUserInput,
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
import { getWebPreview } from "../../public/storage";
import { DeepSearch } from "./components/deepSearch";
import { useDeepSearch } from "./hooks/useDeepSearch";
import { AnimatePresence, motion } from "framer-motion";
import { pipe } from "lodash/fp";
import { useRelatedQuestions } from "./hooks/useRelatedQuestions";
import { pageVariants, pageTransition } from "./contants/pageTransltions";
import { useSeetingHandler } from "./hooks/useSeetingHandler";
import { useCheckUpdate } from "./hooks/useCheckUpdate";
import { UpdateNotification } from "./components/updateModel";
import { UnenoughBalance } from "./components/common/unenoughBalance";
import { useCheckBalance } from "./hooks/useCheckBalance";
import { useTimeGussing } from "./hooks/useTimeGussing";
import { createThingAgent } from "./components/networkPage/utils/thingAgent.js";
import { useMessageHandler } from "./hooks/useMessageHandler";
import { useNotesChat } from "./hooks/useNotesChat";
import { config } from "../config/index";
import { useFetchPointCost } from "./hooks/useFetchPointCost";

export default function Sidebar() {
  const [activatePage, setActivatePage] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageCriticalAnalysis, setPageCriticalAnalysis] = useState("");
  const [userInput, setUserInput] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageSummary, setPageSummary] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [pageSystemMessage, setPageSystemMessage] = useState("");

  const [currentUrlChatLoading, setCurrentUrlChatLoading] = useState(new Map());
  const [urlTabCache, setUrlTabCache] = useState(new Map());
  const [messages, setMessages] = useState(new Map());
  const thinkingStateRef = useRef(new Map());
  const contentCacheRef = useRef(new Map());
  const [summaryCache, setSummaryCache] = useState(new Map());
  const [criticalAnalysisCache, setCriticalAnalysisCache] = useState(new Map());
  const [loadingUrls, setLoadingUrls] = useState(new Map());

  const [isContentReady, setIsContentReady] = useState(true);
  const [webPreview, setWebPreview] = useState(false);
  const [currentUrlTab, setCurrentUrlTab] = useState("welcome");
  const [maxDepth, setMaxDepth] = useState(3);
  const { needTime, getNeedTime } = useTimeGussing();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isDeepThingActive, setIsDeepThingActive] = useState(false);
  const updateInfo = useCheckUpdate();
  const { settings, setSettings, fetchDeepSeekConfig } = useSeetingHandler();
  const { checkBalance, isShowModal, setIsShowModal, calculateModelCalls } =
    useCheckBalance();
  const { pointCosts } = useFetchPointCost();
  const deepSearchState = useDeepSearch(
    userInput,
    maxDepth,
    getNeedTime,
    calculateModelCalls,
    checkBalance,
    setIsShowModal
  );

  const [networkSelectedModel, setNetworkSelectedModel] =
    useState("gpt-4o-mini");
    
  const thinkingAgent = useMemo(
    () =>
      createThingAgent({
        apiKey: userInput,
        baseURL: `${config.baseUrl}/text/v1`,
        model: networkSelectedModel.toLowerCase(),
      }),
    [networkSelectedModel, userInput]
  );

  const {
    message,
    isLoading,
    handleSubmit: handleNetworkSubmit,
    setMessage,
  } = useMessageHandler(thinkingAgent, networkSelectedModel, userInput, searchEnabled);

  const {
    messages: notesMessages,
    loading: notesLoading,
    expandedDocs: notesExpandedDocs,
    copiedMessageId: notesCopiedMessageId,
    setExpandedDocs: setNotesExpandedDocs,
    handleSubmit: handleNotesSubmit,
    handleCopy: handleNotesCopy,
    handleRegenerate: handleNotesRegenerate,
    handleReset: handleNotesReset,
    setMessages: setNotesMessages,
  } = useNotesChat(userInput, networkSelectedModel, searchEnabled);

  useEffect(() => {
    fetchDeepSeekConfig();
  }, [activatePage]);

  const {
    fetchRelatedQuestions,
    currentUrlRelatedQuestions,
    currentUrlLoading,
  } = useRelatedQuestions({
    content: pageContent,
    currentUrl,
    activatePage,
  });

  useEffect(() => {
    fetchRelatedQuestions();
  }, [pageContent, currentUrl, activatePage]);

  useEffect(() => {
    const fetchUserInput = async () => {
      const input = await getUserInput();
      setUserInput(input);
    };

    fetchUserInput();
  }, []);

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
    if (!webPreview) {
      return;
    }

    if (!userInput?.trim()) {
      return;
    }

    const shouldSkipFetch = (url, content) => {
      const isLoading = loadingUrls.get(url);
      const hasSummary = summaryCache.get(url);
      const activePage = activatePage === 0;
      const hasNoContent = !content || !url;
      return isLoading || hasSummary || hasNoContent || !activePage;
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
    activatePage,
  ]);

  useEffect(() => {
    if (
      !pageContent ||
      !webPreview ||
      !userInput?.trim() ||
      !currentUrl ||
      currentUrlTab !== "analysis"
    ) {
      return;
    }

    const shouldFetchAnalysis = (url) => {
      const isLoading = loadingUrls.get(url);
      const activePage = activatePage === 0;
      const hasAnalysis = criticalAnalysisCache.get(url);
      return !isLoading && !hasAnalysis && activePage;
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
  }, [
    currentUrl,
    pageContent,
    userInput,
    webPreview,
    setWebPreview,
    pageLoading,
    summaryCache,
    loadingUrls,
    currentUrlTab,
    activatePage,
  ]);

  const [selectedModel, setSelectedModel] = useState("Deepseek-R1");
  const [selectedModelProvider, setSelectedModelProvider] =
    useState("super2brain");

  const [selectedModelIsSupportsImage, setSelectedModelIsSupportsImage] =
    useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const addMessage = useCallback(
    (url, role, content, model = "", reason_content = "") => {
      setMessages((prevMessages) => {
        const urlMessages = prevMessages.get(url) || [];
        const newMessages = new Map(prevMessages);
        newMessages.set(url, [
          ...urlMessages,
          { role, content, timestamp: Date.now(), model, reason_content },
        ]);
        return newMessages;
      });
    },
    []
  );

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
      if (message.type === "CURRENT_CONTENT_MARKDOWN") {
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
            return false;
          }
        };

        const isReady = await checkContentScriptReady(tab.id);
        setIsContentReady(isReady);

        if (!isReady) {
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
          setPageContent("此页面不支持内容获取");
          return;
        }

        if (url) {
          const cachedContent = contentCacheRef.current.get(url);

          if (cachedContent) {
            const buildSystemMessage = (cachedContent) => `
              你是一个网页分析专家，你当前访问的页面是：${url}
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
            const sendMessagePromise = () =>
              new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(
                  tab.id,
                  { type: "GET_CURRENT_CONTENT_MARKDOWN", url },
                  (response) => {
                    if (chrome.runtime.lastError) {
                      console.error(
                        "❌ 发送消息失败:",
                        chrome.runtime.lastError
                      );
                      reject(chrome.runtime.lastError);
                    } else {
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
    async (messages, isRetry = false) => {
      try {
        const processedMessages = messages.map((message) => ({
          role: MessageRole.USER,
          content: processContent(
            message.content,
            selectedModel,
            message.imageData
          ),
        }));

        if (!isRetry) {
          processedMessages.forEach((message) => {
            addMessage(currentUrl, message.role, message.content);
          });
        }

        setIsAiThinking(true);
        thinkingStateRef.current.set(currentUrl, true);
        setCurrentUrlChatLoading((prev) => new Map(prev).set(currentUrl, true));

        const currentMessages = [
          {
            role: MessageRole.SYSTEM,
            content: pageSystemMessage,
          },
          ...getCurrentUrlMessages(),
          ...(isRetry ? [] : processedMessages),
        ];
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
            }
          },
        });
        if (response.reason_content) {
          addMessage(
            currentUrl,
            MessageRole.ASSISTANT,
            response.content,
            selectedModel,
            response.reason_content
          );
        } else {
          addMessage(
            currentUrl,
            MessageRole.ASSISTANT,
            response.content,
            selectedModel
          );
        }
      } catch (error) {
        console.error("API 请求失败:", error);
        if (error.message === "余额不足") {
          setIsShowModal(true);
        }
        addMessage(
          currentUrl,
          MessageRole.ASSISTANT,
          `${error.message}`
        );
      } finally {
        setIsAiThinking(false);
        thinkingStateRef.current.set(currentUrl, false);
        setCurrentUrlChatLoading((prev) =>
          new Map(prev).set(currentUrl, false)
        );
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

  useEffect(() => {
    const isUrlThinking = thinkingStateRef.current.get(currentUrl) || false;
    const isUrlLoading = currentUrlChatLoading.get(currentUrl) || false;
    setIsAiThinking(isUrlThinking || isUrlLoading);
  }, [currentUrl, currentUrlChatLoading]);

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
      const userMessage =
        messages[messageId - 1]?.role === "user"
          ? messages[messageId - 1]
          : null;

      if (!userMessage) return;

      setMessages((prevMessages) => {
        const urlMessages = prevMessages.get(currentUrl) || [];
        return new Map(prevMessages).set(
          currentUrl,
          urlMessages.filter((_, index) => index <= messageId - 1)
        );
      });

      await handleSubmit([{ content: userMessage.content }], true);
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

  const handleSettingsUpdate = useCallback(
    (newSettings) => {
      setSettings(newSettings);
    },
    [setSettings]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className="flex-1 flex flex-col min-w-0 m-1 rounded-l-xl bg-white">
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
                checkBalance={checkBalance}
                userInput={userInput}
                setActivatePage={setActivatePage}
                selectedModelProvider={selectedModelProvider}
                selectedModelIsSupportsImage={selectedModelIsSupportsImage}
                setSelectedModelProvider={setSelectedModelProvider}
                setSelectedModelIsSupportsImage={
                  setSelectedModelIsSupportsImage
                }
                networkSelectedModel={networkSelectedModel}
                setNetworkSelectedModel={setNetworkSelectedModel}
                message={message}
                isLoading={isLoading}
                handleNetworkSubmit={handleNetworkSubmit}
                setMessage={setMessage}
                notesMessages={notesMessages}
                notesLoading={notesLoading}
                notesExpandedDocs={notesExpandedDocs}
                notesCopiedMessageId={notesCopiedMessageId}
                setExpandedDocs={setNotesExpandedDocs}
                handleNotesSubmit={handleNotesSubmit}
                handleNotesCopy={handleNotesCopy}
                handleNotesRegenerate={handleNotesRegenerate}
                handleNotesReset={handleNotesReset}
                setMessages={setNotesMessages}
                searchEnabled={searchEnabled}
                setSearchEnabled={setSearchEnabled}
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
                selectedModel={deepSearchState.selectedModel}
                setSelectedModel={deepSearchState.setSelectedModel}
                maxDepth={maxDepth}
                setMaxDepth={setMaxDepth}
                query={deepSearchState.query}
                setQuery={deepSearchState.setQuery}
                messages={deepSearchState.messages}
                isLoading={deepSearchState.isLoading}
                currentStatus={deepSearchState.currentStatus}
                onSendMessage={deepSearchState.handleSendMessage}
                isDeepThingActive={isDeepThingActive}
                setIsDeepThingActive={setIsDeepThingActive}
                needTime={needTime}
                setMessages={deepSearchState.setMessages}
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
                pointCosts={pointCosts}
                settings={settings}
                setSettings={setSettings}
                onSettingsUpdate={handleSettingsUpdate}
                webPreview={webPreview}
                setWebPreview={setWebPreview}
                setUserInput={setUserInput}
                userInput={userInput}
                setIsShowModal={setIsShowModal}
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

      <div className="w-12 flex-shrink-0 bg-gray-100">
        <ActivateBar
          activatePage={activatePage}
          setActivatePage={setActivatePage}
        />
      </div>
      <UpdateNotification
        isVisible={updateInfo.isUpdate}
        updateInfo={updateInfo}
      />
      <UnenoughBalance
        isShowModal={isShowModal}
        setIsShowModal={setIsShowModal}
      />
    </div>
  );
}
