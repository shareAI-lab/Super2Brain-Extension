import { Loader2, ChevronUp, ChevronDown, Check, XCircle } from "lucide-react";
import { getResponse } from "../../core/agent.js";
import { marked } from "marked";
import { PlaceHolder } from "./modules/placeHolder";
import { TypeWriter } from "./modules/TypeWriter";
import { useState, useRef, useEffect } from "react";
import { ActionButtons } from "./modules/actionButton";
import { InputArea } from "./modules/inputArea";

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
  hasError,
  setMessages,
  selectedModel,
  setSelectedModel,
}) => {
  const [showTextArea, setShowTextArea] = useState(true);
  const messagesEndRef = useRef(null);
  const statusBoxRef = useRef(null);
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const timerRef = useRef(null);

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

  // 计算经过的时间（秒）
  const getElapsedTime = () => {
    if (!startTime) return 0;
    return Math.floor((currentTime - startTime) / 1000);
  };

  const startTimer = () => {
    if (timerRef.current) return;
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setStartTime(null);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isLoading) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => stopTimer();
  }, [isLoading]);

  useEffect(() => {
    if (Array.isArray(currentStatus) && currentStatus.length > 0) {
      const scrollToStatusBottom = () => {
        if (statusBoxRef.current) {
          const { scrollHeight, clientHeight } = statusBoxRef.current;
          statusBoxRef.current.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: "smooth",
          });
        }
      };

      requestAnimationFrame(scrollToStatusBottom);
    }
  }, [currentStatus]);

  const handleSendMessage = async () => {
    setIsDeepThingActive(true);
    if (!query.trim() || isLoading) return;
    const question = query;
    setQuery("");
    setStartTime(null);
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
                        <ChevronUp className="w-4 h-4" />
                        <span>展开</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>收起</span>
                      </>
                    )}
                  </div>
                </div>
                {isThinkingCollapsed ? (
                  <div className="relative">
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    <div className="text-sm text-gray-500 border-l-2 border-gray-200 pl-3 py-1 sticky bottom-0 bg-white/95 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 select-none">$</span>
                        <span className="truncate">{currentStatus[0]}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {currentStatus.length - 1} 条更多思考步骤...
                        {needTime &&
                          !messages[messages.length - 1]?.isComplete && (
                            <span className="ml-2">
                              · 预计需要 {needTime} 分钟
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                ) : (
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

  // 提取提示卡片为独立组件
  const ThinkingCard = () => (
    <div
      className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100/60 
      rounded-xl p-4 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-indigo-700/90">
              预计需要时间：{needTime || "计算中..."} 分钟
              {isLoading && (
                <span className="text-indigo-500/90 ml-2 font-normal">
                  (已用时间: {formatTime(getElapsedTime())})
                </span>
              )}
            </span>
            <span className="text-xs text-indigo-500/80 mt-1.5">
              S2B正在操作你的浏览器进行深度深度思考，请不要关闭侧边栏
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-[calc(100vh-8px)] flex flex-col bg-white rounded-l-xl">
      <div className="px-8 py-4">
        <div className="flex flex-col gap-4">
          {messages.length > 0 && (
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span>S2B正在深度思考中...</span>
                  </>
                ) : hasError ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>思考过程出现错误</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span>深度思考搜索完成</span>
                  </>
                )}
              </h1>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {!isDeepThingActive ? <PlaceHolder /> : renderMessages()}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 p-2">
        {!isLoading && (
          <div className="relative">
            {messages.length === 0 && (
              <InputArea
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                query={query}
                setQuery={setQuery}
                maxDepth={maxDepth}
                setMaxDepth={setMaxDepth}
                isLoading={isLoading}
                handleSendMessage={handleSendMessage}
              />
            )}
            {messages.length > 0 && (
              <ActionButtons
                setShowTextArea={setShowTextArea}
                messages={messages}
                setQuery={setQuery}
                setMessages={setMessages}
                setIsDeepThingActive={setIsDeepThingActive}
              />
            )}
          </div>
        )}
        {isLoading && (
          <div className="px-2">
            <ThinkingCard />
          </div>
        )}
      </div>
    </div>
  );
};

export { DeepSearch };
