import {
  Send,
  Loader2,
  ChevronUp,
  ChevronDown,
  Brain,
  Check,
  Menu,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { getResponse } from "../../core/agent.js";
import { marked } from "marked";
import { PlaceHolder } from "./modules/placeHolder";
import { TypeWriter } from "./modules/TypeWriter";
import { useState, useRef, useEffect } from "react";
import { OptionsMenu } from "./modules/OptionsMenu";

const DeepSearch = ({
  query,
  setQuery,
  messages,
  isLoading,
  currentStatus,
  onSendMessage,
  isDeepThingActive,
  setIsDeepThingActive,
  maxDepth,
  setMaxDepth,
  needTime,
}) => {
  const messagesEndRef = useRef(null);
  const statusBoxRef = useRef(null);
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollStatusToBottom = () => {
    if (statusBoxRef.current) {
      statusBoxRef.current.scrollTop = statusBoxRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (
      Array.isArray(currentStatus) &&
      messages.length > 0 &&
      !messages[messages.length - 1].isComplete
    ) {
      scrollToBottom();
    }
  }, [currentStatus, messages]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].isComplete) {
      setIsThinkingCollapsed(true);
    }
  }, [messages]);

  useEffect(() => {
    if (Array.isArray(currentStatus) && !isThinkingCollapsed) {
      scrollStatusToBottom();
    }
  }, [currentStatus, isThinkingCollapsed]);

  const handleModelChange = (event) => {
    setModelType(parseInt(event.target.value));
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
            {Array.isArray(currentStatus) && (
              <div className="mb-6 animate-fadeIn">
                <div
                  className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center cursor-pointer select-none hover:text-gray-700"
                  onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
                >
                  <span>思考过程</span>
                  <div className="ml-2 flex items-center">
                    {isThinkingCollapsed ? (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>收起</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>展开</span>
                      </>
                    )}
                  </div>
                </div>
                {!isThinkingCollapsed && (
                  <>
                    <div
                      ref={statusBoxRef}
                      className="font-mono text-sm border border-gray-200 rounded-lg p-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                    >
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
                                isPulsing={idx === currentStatus.length - 1}
                                onComplete={() => {}}
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
                    <div className="mt-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-3">
                          <svg
                            className="w-5 h-5 text-blue-500 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeDasharray="1 3"
                            />
                          </svg>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-blue-700">
                              预计需要时间：{needTime || "计算中..."} 分钟
                            </span>
                            <span className="text-xs text-blue-600 mt-1">
                              S2B正在操作你的浏览器进度sendup思考，请不要关闭侧边栏
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {msg.isComplete && (
              <div className="px-1 relative group">
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
                    prose-code:px-1.5 prose-code:py-0.5
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
      <div className="px-8 py-4">
        <div className="flex flex-col gap-4">
          {messages.length > 0 && (
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span>DeepSeek 正在思考中...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span>思考完成</span>
                  </>
                )}
              </h1>
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  data-tooltip-id="menu-tooltip"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <Tooltip
                  id="menu-tooltip"
                  place="left"
                  style={{ borderRadius: "8px" }}
                >
                  菜单
                </Tooltip>
                <OptionsMenu isOpen={isOpen} setIsOpen={setIsOpen} content={messages[messages.length - 1].content} />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {!isDeepThingActive ? <PlaceHolder /> : renderMessages()}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 p-2">
        <div className="relative">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-gray-600">思考深度</span>
            </div>
            <div className="w-32 flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="6"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs text-gray-500 min-w-[20px]">
                {maxDepth}
              </span>
            </div>
          </div>

          <div
            className="relative rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600"
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
