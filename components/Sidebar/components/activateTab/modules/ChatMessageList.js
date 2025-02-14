import React, { useState, useEffect } from "react";
import { marked } from "marked";
import {
  Bot,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  MessageSquare,
  Globe,
} from "lucide-react";
import { Loading } from "../../common/loading";

const MessageContent = ({ content }) => {
  const commonClassNames = `text-sm break-words leading-relaxed prose prose-sm max-w-none 
    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-gray-200
    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6
    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4
    [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-4
    [&_h5]:text-base [&_h5]:font-semibold [&_h5]:mb-2 [&_h5]:mt-3
    [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:mb-2 [&_h6]:mt-3
    dark:[&_h1]:border-gray-700`;

  const renderContent = Array.isArray(content) ? (
    <div className={commonClassNames}>
      {content.map((item, idx) => (
        <div key={idx}>
          {item.type === "text" && (
            <div
              dangerouslySetInnerHTML={{
                __html: marked.parse(item.text, { breaks: true, gfm: true }),
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
  );

  return renderContent;
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

  const renderRelatedQuestions = () => {
    return (
      <div className="absolute bottom-[40px] left-4 z-10">
        <div className="text-base font-medium text-gray-700 mb-3 flex items-center">
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
              className="flex items-center gap-2 text-sm text-gray-600 mb-2 
                px-4 py-2 rounded-lg bg-gray-50 border border-gray-100
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
              {truncateTitle(pageTitle)}
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

  return (
    <div className="flex-1 overflow-y-auto p-4 relative bg-white rounded-xl flex flex-col h-full">
      {renderPageTitle()}
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`relative rounded-xl shadow-sm
                  ${
                    msg.role === "assistant"
                      ? "w-full bg-white border border-gray-100"
                      : "max-w-[80%] bg-blue-100 inline-block"
                  }`}
              >
                {msg.role === "assistant" && (
                  <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-indigo-600">
                        {msg.model}
                      </span>
                    </div>
                  </div>
                )}

                <div className={msg.role === "assistant" ? "p-4" : "px-2"}>
                  <MessageContent content={msg.content} />

                  {msg.role === "assistant" && (
                    <div className="flex justify-between items-start mt-2">
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
                        <button
                          onClick={() => onRetry(index)}
                          className="p-1 hover:bg-gray-100 rounded-md"
                          title="重新生成"
                          disabled={isAiThinking}
                        >
                          <RefreshCw className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isAiThinking && (
            <div className="flex justify-start">
              <div className="relative w-full rounded-xl shadow-sm bg-white border border-gray-100">
                <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-indigo-600">
                      super2brain
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">正在思考中...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
