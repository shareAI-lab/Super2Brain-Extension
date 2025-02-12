import { Send, Loader2, Copy, Check } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { getResponse } from "../../core/agent.js";
import { marked } from "marked";
import { PlaceHolder } from "./modules/placeHolder";
import { TypeWriter } from "./modules/TypeWriter";
import { useState } from "react";

const DeepSearch = ({
  query,
  setQuery,
  messages,
  isLoading,
  currentStatus,
  onSendMessage,
  isDeepThingActive,
  setIsDeepThingActive,
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const handleCopy = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleSendMessage = async () => {
    setIsDeepThingActive(true);
    if (!query.trim() || isLoading) return;
    const question = query;
    setQuery("");
    await onSendMessage(question, getResponse);
  };

  const renderMessages = () =>
    messages?.map((msg, index) => (
      <div key={`message-${index}`} className="animate-fadeIn px-8 pt-4 pb-2">
        {msg.role === "user" ? (
          <div>
            <p className="text-lg text-gray-900 font-medium leading-relaxed">
              {msg.content}
            </p>
          </div>
        ) : (
          <div>
            {!msg.isComplete && Array.isArray(currentStatus) && (
              <div className="mb-6 animate-fadeIn">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                  思考过程
                </div>
                <div className="font-mono text-sm border border-gray-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {currentStatus.map((status, idx) => (
                      <li
                        key={idx}
                        className="flex items-start space-x-2 text-gray-900 animate-fadeIn"
                      >
                        <span className="text-blue-600 flex-shrink-0 select-none">
                          {idx === currentStatus.length - 1 ? ">" : "$"}
                        </span>
                        <div className="flex items-center space-x-2">
                          <TypeWriter
                            text={status}
                            onComplete={() => {
                              // 可以在这里添加打字完成后的回调
                            }}
                            className={
                              idx === currentStatus.length - 1
                                ? "animate-pulse"
                                : ""
                            }
                          />
                          {idx === currentStatus.length - 1 && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0 ml-1" />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {msg.isComplete && (
              <div className="px-1 relative group">
                <button
                  onClick={() => handleCopy(msg.content, index)}
                  className="fixed bottom-24 right-6 p-2.5 rounded-xl
                    bg-indigo-500 hover:bg-indigo-600
                    transition-all duration-200 shadow-lg
                    flex items-center justify-center"
                >
                  {copiedMessageId === index ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
                <div
                  className="
                    prose prose-gray max-w-none
                    prose-h1:text-xl prose-h1:font-semibold prose-h1:mt-2 prose-h4:mb-2
                    prose-h1:text-gray-900
                    prose-h2:text-lg prose-h2:font-medium
                    prose-h2:text-gray-900
                    prose-h3:text-base prose-h3:font-medium
                    prose-h3:text-gray-900
                    prose-h4:text-sm prose-h4:font-medium 
                    prose-h4:text-gray-900
                    prose-p:text-gray-900 prose-p:leading-relaxed prose-p:my-4 
                    prose-p:text-sm tracking-wide
                    prose-strong:font-semibold prose-strong:text-gray-900
                    prose-em:text-gray-900 prose-em:italic
                    prose-a:text-blue-600 prose-a:no-underline prose-a:font-medium
                    hover:prose-a:text-blue-700 hover:prose-a:underline 
                    hover:prose-a:decoration-blue-500/30 hover:prose-a:decoration-2  
                    prose-code:px-1.5 prose-code:py-0.5 prose-code:bg-gray-100
                    prose-code:rounded prose-code:text-xs prose-code:font-mono 
                    prose-code:text-gray-900 prose-code:before:content-none 
                    prose-code:after:content-none
                    prose-pre:p-4 prose-pre:my-6 prose-pre:bg-gray-50
                    prose-pre:rounded-lg prose-pre:shadow-sm prose-pre:border
                    prose-pre:border-gray-200
                    prose-ul:my-4 prose-ul:ml-2 prose-ul:list-disc 
                    prose-ol:my-4 prose-ol:ml-2 prose-ol:list-decimal
                    prose-li:my-2 prose-li:text-gray-900
                    prose-li:marker:text-gray-600 prose-li:pl-1.5
                    prose-blockquote:border-l-2 prose-blockquote:border-gray-300
                    prose-blockquote:pl-2 prose-blockquote:my-4 
                    prose-blockquote:italic prose-blockquote:text-gray-900"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(msg.content, {
                      breaks: true,
                      gfm: true,
                      headerIds: true,
                      mangle: false,
                      sanitize: false,
                    }),
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    ));

  return (
    <div className="w-full h-[calc(100vh-8px)] flex flex-col bg-white rounded-sm">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {!isDeepThingActive ? <PlaceHolder /> : renderMessages()}
      </div>
      <div className="flex-shrink-0 p-2">
        <div className="relative">
          <div
            className="relative rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600 mt-2"
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
                text-gray-900 outline-none resize-none h-24
                placeholder:text-gray-400 sm:text-sm/6"
              placeholder="请输入您的问题"
            />
            <div className="flex items-center justify-end px-2 py-1">
              <div className="flex gap-2">
                <button
                  disabled={!query.trim() || isLoading}
                  onClick={handleSendMessage}
                  className={`button-tag-send p-2 rounded-xl
                  flex items-center justify-center
                  transition-all duration-200
                  ${
                    !query.trim() || isLoading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200"
                  }
                  shadow-sm hover:shadow-md`}
                >
                  <Send className="w-4 h-4" />
                </button>
                <Tooltip
                  style={{ borderRadius: "8px" }}
                  anchorSelect=".button-tag-send"
                  place="top"
                >
                  发送
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DeepSearch };
