import {
  Bot,
  Copy,
  RotateCw,
  Check,
  Loader2,
  MessageSquare,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RelatedDocs } from "./RelatedDocs.js";
import { RelatedQuestions } from "./RelatedQuestions.js";
import { marked } from "marked";
import { ResponseLoading } from "../../networkPage/modules/responseLoading.js";
import { PlaceHolder } from "../../networkPage/modules/placeHolder.js";
import { useState, useRef, useEffect } from "react";

const MessageList = ({
  messages,
  model,
  copiedMessageId,
  expandedDocs,
  handleCopy,
  handleRegenerate,
  setExpandedDocs,
  setQuery,
  elapsedTime,
  setMessages,
  handleReasoningExpand,
}) => {
  const createMarkdownContent = (content) => ({
    __html: marked(content || "", {
      breaks: true,
      gfm: true,
    }),
  });

  const renderReasoningContent = (message) => {
    if (!message.reasoning_content || message.reasoning_content === "") {
      return null;
    }

    return (
      <div className="bg-gray-50 mx-4 mt-2 py-2">
        <button
          onClick={() =>
            handleReasoningExpand(message.id, !message.isReasoningExpanded)
          }
          className="w-full flex items-center justify-between hover:bg-gray-100 transition-colors px-4  border-t border-gray-100"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-indigo-600">
              推理过程
            </span>
          </div>
          {message.isReasoningExpanded ? (
            <ChevronUp className="w-4 h-4 text-indigo-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-indigo-500" />
          )}
        </button>
        {message.isReasoningExpanded && (
          <div className="px-4 py-2">
            <div
              className="text-sm text-gray-700 break-words leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200"
              dangerouslySetInnerHTML={createMarkdownContent(
                message.reasoning_content
              )}
            />
          </div>
        )}
      </div>
    );
  };

  const renderMessageContent = (message, isStreaming = false) => (
    <div className="flex flex-col mt-2">
      {message.reasoning_content && renderReasoningContent(message)}
      {(message.content || isStreaming) && (
        <div
          className="text-sm break-words leading-relaxed prose prose-sm max-w-none px-4  prose-ul:pl-4 prose-ol:pl-4 prose-ul:my-2 prose-ol:my-2"
          dangerouslySetInnerHTML={createMarkdownContent(message.content || "")}
        />
      )}
      {!isStreaming && (
        <div className="flex justify-between items-start px-4 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(message.content, message.id)}
              className="p-1 hover:bg-gray-100 rounded-md"
              title="复制内容"
            >
              {copiedMessageId === message.id ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => handleRegenerate(message.id)}
              className="p-1 hover:bg-gray-100 rounded-md"
              title="重新生成"
            >
              <RotateCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const lastMessageRef = useRef(null);
  const [lastMessageHeight, setLastMessageHeight] = useState(0);
  useEffect(() => {
    if (lastMessageRef.current) {
      const height = lastMessageRef.current.getBoundingClientRect().height;
      setLastMessageHeight(height);
    }
  }, [messages]);

  const getMessageStyle = (index) => {
    if (index === messages.length - 1 && messages.length > 2) {
      return {
        minHeight: `calc(100vh - 13rem - ${lastMessageHeight}px - 180px)`,
        overflowY: "auto",
      };
    }
  };
  const containerRef = useRef(null);
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

  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2"
      ref={containerRef}
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <PlaceHolder
            Icon={BookOpen}
            title="知识库助手"
            description="管理您的知识库，随时收藏或者查看数据库内容"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`${
                  message.isUser
                    ? "text-blue-600 flex justify-end"
                    : "text-gray-800"
                }`}
              >
                {message.isUser ? (
                  <div
                    className="text-sm whitespace-pre-wrap bg-blue-100 rounded-lg max-w-[80%] p-4"
                    ref={index === messages.length - 2 ? lastMessageRef : null}
                  >
                    {message.content}
                  </div>
                ) : (
                  <div
                    className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                    style={getMessageStyle(index)}
                  >
                    <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium text-indigo-600">
                          {message.model}
                        </span>
                      </div>
                    </div>

                    {message.isComplete ? (
                      renderMessageContent(message)
                    ) : (
                      <>
                        {renderMessageContent(message, true)}
                        {!message.reasoning_content && (
                          <div className="p-3 border-t border-gray-100">
                            {message.status === 6 ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm p-1">
                                  服务器繁忙，请切换其他模型试一试
                                </span>
                              </div>
                            ) : message.status === -1 ? (
                              <ResponseLoading />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                <span className="text-sm text-indigo-600">
                                  {message.statusMsg || "正在思考..."}
                                  {elapsedTime > 0 && `(${elapsedTime}s)`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              {!message.isUser && message.isComplete && (
                <div className="flex items-center gap-2">
                  <RelatedQuestions message={message} setQuery={setQuery} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { MessageList };
