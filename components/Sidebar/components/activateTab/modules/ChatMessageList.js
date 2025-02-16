import React, { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import {
  Bot,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  MessageSquare,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Loading } from "../../common/loading";

const MessageContent = ({ content, reason_content, messageId }) => {
  const [expandedStates, setExpandedStates] = useState(new Map());

  const isExpanded = expandedStates.get(messageId) || false;

  const toggleExpand = (id) => {
    setExpandedStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, !prev.get(id));
      return newMap;
    });
  };

  const commonClassNames = `text-sm break-words leading-relaxed prose prose-sm max-w-none 
    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-gray-200
    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6
    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4
    [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-4
    [&_h5]:text-base [&_h5]:font-semibold [&_h5]:mb-2 [&_h5]:mt-3
    [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:mb-2 [&_h6]:mt-3
    dark:[&_h1]:border-gray-700`;

  return (
    <div className="space-y-3">
      {reason_content && reason_content.trim() && (
        <div>
          <button
            onClick={() => toggleExpand(messageId)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2 transition-colors duration-200"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 
                ${isExpanded ? "rotate-90" : ""}`}
            />
            <span className="text-sm">思考过程</span>
          </button>

          {isExpanded && (
            <div
              className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500
                border border-gray-100 transition-all duration-200"
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: marked.parse(reason_content, {
                    breaks: true,
                    gfm: true,
                  }),
                }}
              />
            </div>
          )}
        </div>
      )}

      {Array.isArray(content) ? (
        <div className={commonClassNames}>
          {content.map((item, idx) => (
            <div key={idx}>
              {item.type === "text" && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(item.text, {
                      breaks: true,
                      gfm: true,
                    }),
                  }}
                />
              )}
              {item.type === "image_url" && (
                <img
                  src={item.image_url.url}
                  alt="uploaded"
                  className="max-w-full h-auto"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className={commonClassNames}
          dangerouslySetInnerHTML={{
            __html: marked.parse(content, { breaks: true, gfm: true }),
          }}
        />
      )}
    </div>
  );
};

export const ChatMessageList = ({
  messages,
  isAiThinking,
  copiedMessageId,
  onCopy,
  onRetry,
  currentUrl,
  currentUrlRelatedQuestions,
  currentUrlLoading,
  onQuestionClick,
}) => {
  const [pageTitle, setPageTitle] = useState("");
  const [thinkingTime, setThinkingTime] = useState(0);
  const timerRef = useRef(null);
  const timerMapRef = useRef(new Map());
  const messageRefs = useRef({});
  const [prevMessageHeight, setPrevMessageHeight] = useState(0);
  const messagesEndRef = useRef(null);
  const [messagesContainerHeight, setMessagesContainerHeight] = useState(0);

  const getPageTitle = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      setPageTitle(tab.title);
    } catch (error) {
      console.error("获取页面标题失败:", error);
    }
  };

  useEffect(() => {
    getPageTitle();

    const handleTabUpdate = (tabId, changeInfo) => {
      if (changeInfo.title) {
        getPageTitle();
      }
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, [currentUrl]);

  useEffect(() => {
    // 清理其他URL的计时器
    const cleanupTimers = () => {
      timerMapRef.current.forEach((timer, url) => {
        if (url !== currentUrl) {
          clearInterval(timer);
          timerMapRef.current.delete(url);
        }
      });
    };

    // 处理当前URL的计时器
    if (isAiThinking) {
      setThinkingTime(0);
      const timer = setInterval(() => {
        setThinkingTime((prev) => prev + 1);
      }, 1000);
      timerMapRef.current.set(currentUrl, timer);
      timerRef.current = timer;
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        timerMapRef.current.delete(currentUrl);
      }
    }

    cleanupTimers();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAiThinking, currentUrl]);

  useEffect(() => {
    if (messages.length > 1) {
      const prevMessageEl = messageRefs.current[messages.length - 2];
      if (prevMessageEl) {
        const height = prevMessageEl.getBoundingClientRect().height;
        setPrevMessageHeight(height);
        console.log("Previous message height:", height);
      }
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 0);
      }
    }
  }, []);

  useEffect(() => {
    if (isAiThinking) {
      const rafId = requestAnimationFrame(() => {
        scrollToBottom();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [messages, isAiThinking, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 1) {
      const prevMessageEl = messageRefs.current[messages.length - 1];
      if (prevMessageEl) {
        const height = prevMessageEl.getBoundingClientRect().height;
        setMessagesContainerHeight(height);
      }
    }
  }, [messages]);

  const renderRelatedQuestions = () => {
    return (
      <div className="absolute bottom-[10px] left-4 z-10">
        <div className="text-base font-medium text-gray-700 mb-2 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2" />
          猜你想问
        </div>
        {currentUrlLoading ? (
          <div className="flex items-center gap-2">
            <Loading />
          </div>
        ) : (
          currentUrlRelatedQuestions.map((question, index) => (
            <div
              key={index}
              onClick={() => onQuestionClick(question.replace(/^\d+\.\s*/, ""))}
              className="flex items-center gap-2 text-sm text-gray-600 mb-1.5
                px-4 py-1.5 rounded-lg bg-gray-50 border border-gray-100
                hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 
                hover:shadow-sm transform hover:-translate-y-0.5
                cursor-pointer transition-all duration-200"
            >
              <span>
                {index + 1}. {question}
              </span>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderPageTitle = () => {
    const truncateTitle = (title) => {
      return title.length > 30 ? `${title.slice(0, 30)}...` : title;
    };

    return (
      pageTitle && (
        <div className="w-full mb-4">
          <div
            className="flex items-center gap-2 text-sm text-gray-600 font-medium 
            bg-gradient-to-r from-white via-gray-50 to-indigo-50/30
            backdrop-blur-md px-3 py-1.5 rounded-lg 
            shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] 
            border border-gray-200
            hover:border-indigo-200 hover:from-white hover:to-indigo-100/50 
            hover:shadow-md
            transition-all duration-200
            w-full"
          >
            <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent truncate">
              当前页面：{truncateTitle(pageTitle)}
            </span>
          </div>
        </div>
      )
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="p-8 text-center">
            <div className="hover:scale-105 transition-all duration-300">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 bg-white shadow-lg rounded-xl flex items-center justify-center">
                  <Bot className="w-14 h-14 text-indigo-600" />
                </div>
                <div className="space-y-3">
                  <div className="font-medium text-gray-700 text-lg">
                    Web助手
                  </div>
                  <div className="text-sm text-gray-500 max-w-xs">
                    对页面内容感兴趣？直接询问我吧 ！
                  </div>
                </div>
              </div>
            </div>
          </div>
          {renderRelatedQuestions()}
        </div>
      </div>
    );
  };

  const renderThinkingState = () => (
    <div
      style={{
        height:
          messages.length === 1
            ? "auto"
            : `calc(100vh - ${messagesContainerHeight + 300}px)`,
      }}
    >
      <div className="flex justify-start bg-transparent">
        <div className="relative w-full rounded-xl shadow-sm bg-white border border-gray-100 flex-0">
          <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-indigo-600">super2brain</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">
                正在思考中 ({thinkingTime}s)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex-1 overflow-y-auto p-4 relative bg-white rounded-xl flex flex-col h-full scroll-smooth"
      style={{ 
        maxHeight: messages.length <= 2 ? "100%" : "calc(100vh - 200px)" 
      }}
    >
      {renderPageTitle()}
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-6">
          {messages.map((msg, index) => {
            const isLastMessage = index === messages.length - 1;
            const isAssistant = msg.role === "assistant";

            return (
              <div
                key={index}
                ref={(el) => (messageRefs.current[index] = el)}
                className={`${
                  isLastMessage && isAssistant ? "min-h-[300px]" : ""
                } transition-all duration-200`}
                style={
                  isLastMessage && isAssistant && messages.length > 2
                    ? {
                        height: `calc(100vh - ${prevMessageHeight + 306}px)`,
                      }
                    : {}
                }
              >
                <div
                  className={`flex ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`relative rounded-xl shadow-sm
                    ${
                      isAssistant
                        ? "w-full bg-white border border-gray-100"
                        : "max-w-[80%] bg-blue-100 inline-block"
                    }`}
                  >
                    {isAssistant && (
                      <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
                        <div className="flex items-center gap-2">
                          <Bot className="w-5 h-5 text-indigo-600" />
                          <span className="font-medium text-indigo-600">
                            {msg.model}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className={isAssistant ? "p-4" : "px-2"}>
                      <MessageContent
                        content={msg.content}
                        reason_content={msg.reason_content}
                        messageId={index}
                      />

                      {isAssistant && (
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onCopy(msg.content, index)}
                              className="p-1 hover:bg-gray-100 rounded-md"
                              title="复制内容"
                            >
                              {copiedMessageId === index ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isAiThinking && renderThinkingState()}
        </div>
      )}
      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </div>
  );
};
