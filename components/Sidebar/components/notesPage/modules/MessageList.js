import {
  Bot,
  Copy,
  RotateCw,
  Check,
  Loader2,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { RelatedDocs } from "./RelatedDocs.js";
import { RelatedQuestions } from "./RelatedQuestions.js";
import { marked } from "marked";
import { ResponseLoading } from "../../networkPage/modules/responseLoading.js";
import { PlaceHolder } from "../../networkPage/modules/placeHolder.js";

const MessageList = ({
  messages,
  model,
  copiedMessageId,
  expandedDocs,
  handleCopy,
  handleRegenerate,
  setExpandedDocs,
  setQuery,
}) => {
  const renderMarkdown = (content) => (
    <div
      className="text-sm break-words leading-relaxed prose prose-sm max-w-none p-4 prose-ul:pl-4 prose-ol:pl-4 prose-ul:my-2 prose-ol:my-2"
      dangerouslySetInnerHTML={{
        __html: marked.parse(content, {
          breaks: true,
          gfm: true,
          pedantic: true,
          smartLists: false,
          mangle: false,
          headerIds: false,
        }),
      }}
    />
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <PlaceHolder
            Icon={BookOpen}
            title="知识库助手"
            description="管理您的知识库，随时随地获取所需信息"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`${
                  message.isUser
                    ? "text-blue-600 flex justify-end"
                    : "text-gray-800"
                }`}
              >
                {message.isUser ? (
                  <div className="text-sm whitespace-pre-wrap bg-blue-100 rounded-lg p-2 max-w-[80%]">
                    {message.content}
                  </div>
                ) : (
                  <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium text-indigo-600">
                          {message.model}
                        </span>
                      </div>
                    </div>

                    {message.isComplete ? (
                      <div className="p-4">
                        {renderMarkdown(message.content)}
                        <div className="flex justify-between items-start mt-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleCopy(message.content, message.id)
                              }
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
                      </div>
                    ) : (
                      <div className="p-3">
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
                            </span>
                          </div>
                        )}
                      </div>
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
