import {
  Bot,
  Loader2,
  CheckCircle2,
  Search,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { marked } from "marked";
import { ResponseLoading } from "./responseLoading";
import { PlaceHolder } from "./placeHolder";
import { RelatedQuestions } from "./RelatedQuestions";
import React, { useRef, useEffect, useState } from "react";

export const MessageRenderer = ({
  messages,
  setQuery,
  setMessage,
  elapsedTime,
}) => {
  const containerRef = useRef(null);


  const lastMessageRef = useRef(null);
  const [lastMessageHeight, setLastMessageHeight] = useState(0);
  useEffect(() => {
    if (lastMessageRef.current) {
      const height = lastMessageRef.current.getBoundingClientRect().height;
      setLastMessageHeight(height);
    }
  }, [messages]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  useEffect(() => {
    if (messages.isComplete) {
      setIsScrolled(false);
      return;
    }

    if (messages.length > prevMessageCount) {
      setIsScrolled(false);
      
      const scrollToBottom = () => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
        setIsScrolled(true);
      };

      scrollToBottom();
    }
    
    setPrevMessageCount(messages.length);
  }, [messages, prevMessageCount]);

  if (!messages || messages.length === 0) {
    return (
      <PlaceHolder
        Icon={Search}
        title="AI 联网助手"
        description="操作你的浏览器，获取更多信息，并进行分析"
      />
    );
  }

  const renderUserMessage = (msg, index) => {
    const isLastMessage = index === messages.length - 1;
    return (
      <div
        ref={isLastMessage ? lastMessageRef : null}
        key={`user-${index}`}
        className="space-y-2 mr-2"
      >
        <div className="text-blue-600 flex justify-end">
          <div className="text-sm whitespace-pre-wrap bg-blue-100 rounded-lg p-2 max-w-[80%]">
            {msg.content}
          </div>
        </div>
      </div>
    );
  };

  const renderAssistantMessage = (msg, index) => {
    const isLastMessage =
      index === messages.length - 1 &&
      messages.length > 2 &&
      msg.role === "assistant";

    const messageStyle = isLastMessage
      ? {
          minHeight: `calc(100vh - 13rem - ${lastMessageHeight}px - 180px)`,
          overflowY: "auto",
        }
      : {};

    const setIsReasoningExpanded = (expanded) => {
      setMessage((prev) => {
        const messages = [...prev];
        const msgIndex = messages.findIndex(
          (m, i) => m.role === "assistant" && i === index
        );
        if (msgIndex !== -1) {
          messages[msgIndex] = {
            ...messages[msgIndex],
            isReasoningExpanded: expanded,
          };
        }
        return messages;
      });
    };

    const getStatusColor = (status) => {
      switch (status) {
        case "merging":
          return "text-purple-600";
        case "analyzing":
          return "text-indigo-600";
        case "error":
          return "text-indigo-600";
        default:
          return "text-indigo-600";
      }
    };

    const renderStatus = () => {
      if (!msg.status || msg.status === "complete") return null;

      if (msg.status === "merging") {
        return (
          <div className="p-4">
            <ResponseLoading />
          </div>
        );
      }

      if (msg.status === "error") {
        return (
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4" />
              <span className="text-sm text-indigo-600">
                {msg.statusMessage || "发生错误，请稍后重试"}
              </span>
            </div>
          </div>
        );
      }

      return (
        <div className="p-4 space-y-2">
          <div className="flex items-center space-x-2">
            {msg.status !== "processing" && msg.status !== "complete" && (
              <>
                <Loader2
                  className={`w-4 h-4 animate-spin ${getStatusColor(
                    msg.status
                  )}`}
                />
                <span className={`text-sm ${getStatusColor(msg.status)}`}>
                  {msg.statusMessage} {elapsedTime > 0 && `(${elapsedTime}秒)`}
                </span>
              </>
            )}
          </div>
        </div>
      );
    };

    const renderUrlList = () => {
      if (!msg.urlListData || msg.urlListData.length === 0) return null;
      if (msg.status === "error") return null;
      return (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="text-sm text-gray-600 mb-2">阅读页面：</div>
          <div className="space-y-2">
            {msg.urlListData.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {url.status === 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {url.title || url.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderReasoningContent = () => {
      if (!msg.reasoning_content) return null;

      return (
        <div className="bg-gray-50 mx-4 mt-2">
          <button
            onClick={() => setIsReasoningExpanded(!msg.isReasoningExpanded)}
            className="w-full flex items-center justify-between hover:bg-gray-100 transition-colors px-4 py-2 border-t border-gray-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-600">
                推理过程
              </span>
            </div>
            {msg.isReasoningExpanded ? (
              <ChevronUp className="w-4 h-4 text-indigo-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-500" />
            )}
          </button>
          {msg.isReasoningExpanded && (
            <div className="px-4">
              <div
                className="text-sm text-gray-700 break-words leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200"
                dangerouslySetInnerHTML={{
                  __html: marked(msg.reasoning_content || "", {
                    breaks: true,
                    gfm: true,
                  }),
                }}
              />
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        key={`assistant-${index}`}
        className="space-y-4 mr-2"
        style={messageStyle}
      >
        <div className="text-gray-800">
          <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-indigo-600">{msg.model}</span>
              </div>
            </div>

            {renderStatus()}

            {renderReasoningContent()}

            {msg.content && (
              <div
                className={`text-sm break-words leading-relaxed prose prose-sm max-w-none p-4 prose-ul:pl-4 prose-ol:pl-4 prose-ul:my-2 prose-ol:my-2 ${
                  msg.isStreaming ? "animate-pulse" : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: marked(msg.content || "", {
                    breaks: true,
                    gfm: true,
                  }),
                }}
              />
            )}

            {renderUrlList()}
          </div>
        </div>

        {msg.isComplete && index === messages.length - 1 && (
          <RelatedQuestions setQuery={setQuery} message={msg} />
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto space-y-4">
      {messages.map((msg, index) =>
        msg.role === "user"
          ? renderUserMessage(msg, index)
          : renderAssistantMessage(msg, index)
      )}
    </div>
  );
};
