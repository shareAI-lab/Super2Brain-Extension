import React from "react";
import { marked } from "marked";
import { Bot, Copy, Check, RefreshCw, Loader2 } from "lucide-react";

const MessageContent = ({ content }) => {
  const commonClassNames = `text-sm break-words leading-relaxed prose prose-sm max-w-none 
    [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words [&_a]:break-words
    [&_pre]:bg-slate-50 [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:my-2 [&_pre]:block [&_pre]:border [&_pre]:border-slate-200
    [&_code]:bg-slate-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-slate-200
    [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0
    dark:[&_pre]:bg-slate-800 dark:[&_pre]:border-slate-700
    dark:[&_code]:bg-slate-800 dark:[&_code]:border-slate-700
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
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 relative bg-white rounded-xl">
      <div className="space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "assistant" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`relative max-w-[80%] rounded-xl shadow-sm
                ${
                  msg.role === "assistant"
                    ? "bg-white border border-gray-100"
                    : "bg-blue-100"
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

              <div className={msg.role === "assistant" ? "p-4" : "p-3"}>
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
            <div className="relative max-w-[80%] p-4 rounded-2xl shadow-sm bg-gray-100">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-500">AI 正在思考中...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
