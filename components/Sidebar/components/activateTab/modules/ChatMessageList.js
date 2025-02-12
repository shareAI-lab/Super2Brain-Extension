import React, { useState } from "react";
import { marked } from "marked";
import { Bot, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import {
  setUrlLoading,
  getUrlLoading,
  removeUrlLoading,
} from "../../../../../public/storage";

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
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleBookmarkSave = async () => {
    const isLoading = await getUrlLoading(currentUrl);

    if (isLoading) {
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 500);
      return;
    }

    await setUrlLoading(currentUrl);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "SAVE_CONTENT",
      });

      if (!response?.received) {
        throw new Error("保存失败");
      }
      return { success: true };
    } catch (error) {
      console.error("收藏失败:", error);
      throw error;
    } finally {
      await removeUrlLoading(currentUrl);
    }
  };

  const renderRelatedQuestions = () => {
    if (currentUrlLoading) return null;

    return (
      <div className="mt-8 text-left">
        <h3 className="text-lg font-semibold mb-2 pl-2">相关问题</h3>
        <ul className="space-y-2 pl-2">
          {currentUrlRelatedQuestions.map((question, index) => (
            <li key={index} className="text-sm text-gray-600">
              {question}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex-1 h-full flex items-center justify-center">
      <div className="p-8 text-center hover:scale-105 transition-all duration-300">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 bg-white shadow-lg rounded-xl flex items-center justify-center">
            <Bot className="w-14 h-14 text-indigo-600" />
          </div>
          <div className="space-y-3">
            <div className="font-medium text-gray-700 text-lg">Web助手</div>
            <div className="text-sm text-gray-500 max-w-xs">
              对页面内容感兴趣？直接询问我吧 ！
            </div>
            <button
              onClick={() => handleBookmarkSave()}
              disabled={isSaving}
              className={`mt-8 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
                ${isSaving ? "animate-shake" : ""}`}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在保存...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 hover:underline">
                  <span>觉得该网页不错？收藏该网页</span>
                </div>
              )}
            </button>
          </div>
        </div>
        {renderRelatedQuestions()}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 relative bg-white rounded-xl flex flex-col h-full">
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

                <div className={msg.role === "assistant" ? "p-4" : "p-1"}>
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
