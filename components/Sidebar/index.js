import React, { useEffect, useState, useCallback, useRef } from "react";
import { marked } from "marked";
import {
  BookOpen,
  Network,
  FileText,
  Loader2,
  Sun,
  Moon,
  Bookmark,
  ExternalLink,
  Download,
  RotateCcw,
  Send,
  Camera,
  Settings,
} from "lucide-react";
import { Markmap } from "markmap-view";
import { Transformer } from "markmap-lib";
import { getPrompt } from "./utils/getPrompt";
import { options } from "./utils/getPrompt";
import { TextareaRef } from "./components/textarea";
import { getDeepSeekBaseUrl, getDeepSeekApiKey } from "../../public/storage";
import { SettingPage } from "./components/setting";

export default function Sidebar() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [messages, setMessages] = useState(new Map());
  const [userInput, setUserInput] = useState("");
  const contentCacheRef = useRef(new Map());
  const [pageSystemMessage, setPageSystemMessage] = useState("");
  const thinkingStateRef = useRef(new Map());

  const [deepSeekBaseUrl, setDeepSeekBaseUrl] = useState("");
  const [deepSeekApiKey, setDeepSeekApiKey] = useState("");

  const [showSettings, setShowSettings] = useState(false);

  const fetchDeepSeekConfig = async () => {
    try {
      const [baseUrl, apiKey] = await Promise.all([
        getDeepSeekBaseUrl(),
        getDeepSeekApiKey(),
      ]);
      setDeepSeekBaseUrl(baseUrl);
      setDeepSeekApiKey(apiKey);
    } catch (error) {
      console.error("获取 DeepSeek 配置失败:", error);
    }
  };

  useEffect(() => {
    fetchDeepSeekConfig();
  }, []);

  const addMessage = useCallback((url, role, content) => {
    setMessages((prevMessages) => {
      const urlMessages = prevMessages.get(url) || [];
      const newMessages = new Map(prevMessages);
      newMessages.set(url, [
        ...urlMessages,
        { role, content, timestamp: Date.now() },
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
        setIsLoading(false);
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
        setCurrentUrl(url);

        setPageSystemMessage("");

        setIsAiThinking(thinkingStateRef.current.get(url) || false);

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
            setIsLoading(true);
            const sendMessagePromise = () =>
              new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(
                  tab.id,
                  { type: "GET_MARKDOWN", url },
                  (response) => {
                    if (chrome.runtime.lastError) {
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
              console.warn("content script 未准备好:", error);
              setPageContent("页面加载中，请稍后重试...");
              setTimeout(() => updateUrlAndContent(), 1000);
            } finally {
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("获取页面内容失败:", error);
        setIsLoading(false);
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

  const handleFetch = useCallback(
    async (content) => {
      setIsAiThinking(true);
      thinkingStateRef.current.set(currentUrl, true);
      try {
        const messages = [
          { role: "system", content: pageSystemMessage },
          ...getCurrentUrlMessages(),
          { role: "user", content },
        ];

        const response = await fetch(
          `${deepSeekBaseUrl}/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: ``,
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20240620",
              messages,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        if (!data.choices?.[0]?.message?.content) {
          throw new Error("Invalid response format");
        }

        addMessage(currentUrl, "assistant", data.choices[0].message.content);
      } catch (error) {
        console.error("API 请求失败:", error);
        addMessage(currentUrl, "assistant", "抱歉，请求失败，请稍后重试。");
      } finally {
        setIsAiThinking(false);
        thinkingStateRef.current.set(currentUrl, false);
      }
    },
    [currentUrl, addMessage, getCurrentUrlMessages, pageSystemMessage]
  );

  const handleSubmit = React.useCallback(
    (content) => {
      addMessage(currentUrl, "user", content);

      handleFetch(content);
    },
    [currentUrl, addMessage]
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-end pr-4 pt-4">
        <button
          className="hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {showSettings ? (
        <SettingPage 
          onClose={() => setShowSettings(false)} 
          updateDeepSeekConfig={fetchDeepSeekConfig}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 relative">
            {(!deepSeekBaseUrl || !deepSeekApiKey) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <p className="text-gray-500 text-lg">请先配置 DeepSeek 的 Base URL 和 API Key</p>
              </div>
            )}
            
            <div>
              <div className="space-y-6">
                {getCurrentUrlMessages().map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "assistant" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`relative max-w-[80%] p-4 rounded-2xl shadow-sm
                        ${
                          msg.role === "assistant"
                            ? "bg-gray-100 before:absolute before:left-[-8px] before:bottom-[8px] before:border-8 before:border-transparent before:border-r-gray-100"
                            : "bg-blue-500 text-white before:absolute before:right-[-8px] before:bottom-[8px] before:border-8 before:border-transparent before:border-l-blue-500"
                        }`}
                    >
                      <div
                        className="text-sm  break-words leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.content, {
                            breaks: true,
                            gfm: true,
                          }),
                        }}
                      />
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex justify-start">
                    <div className="relative max-w-[80%] p-4 rounded-2xl shadow-sm bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-500">
                          AI 正在思考中...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 p-4 bg-white">
            <TextareaRef
              onSubmit={handleSubmit}
              onReset={clearCurrentUrlMessages}
            />
          </div>
        </>
      )}
    </div>
  );
}
