import { Bot, Loader2, CheckCircle2, Search, XCircle } from "lucide-react";
import { marked } from "marked";
import { ResponseLoading } from "./responseLoading";
import { PlaceHolder } from "./placeHolder";
import { RelatedQuestions } from "./RelatedQuestions";

export const MessageRenderer = ({ messages, setQuery }) => {
  if (!messages || messages.length === 0) {
    return (
      <PlaceHolder
        Icon={Search}
        title="AI 联网助手"
        description="通过您的浏览器为您提供更全面、准确的回答"
      />
    );
  }

  const renderUserMessage = (msg, index) => (
    <div key={`user-${index}`} className="space-y-2">
      <div className="text-blue-600 flex justify-end">
        <div className="text-sm whitespace-pre-wrap bg-blue-100 rounded-lg p-2 max-w-[80%]">
          {msg.content}
        </div>
      </div>
    </div>
  );

  const renderAssistantMessage = (msg, index) => {
    const renderStatus = () => {
      if (!msg.status || msg.status === "complete") return null;

      const getStatusColor = (status) => {
        switch (status) {
          case "merging":
            return "text-purple-600";
          case "analyzing":
            return "text-indigo-600";
          case "error":
            return "text-red-600";
          default:
            return "text-indigo-600";
        }
      };

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
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">
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
              <Loader2
                className={`w-4 h-4 animate-spin ${getStatusColor(msg.status)}`}
              />
            )}
            <span className={`text-sm ${getStatusColor(msg.status)}`}>
              {msg.statusMessage}
            </span>
          </div>
        </div>
      );
    };

    const renderUrlList = () => {
      if (!msg.urlListData || msg.urlListData.length === 0) return null;
      if (msg.status === "error") return null;
      return (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="text-sm text-gray-600 mb-2">参考资料：</div>
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

    return (
      <div key={`assistant-${index}`} className="space-y-2">
        <div className="text-gray-800">
          <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-indigo-600">{msg.model}</span>
              </div>
            </div>

            {renderStatus()}

            {msg.content && (
              <div
                className="text-sm break-words leading-relaxed prose prose-sm max-w-none p-4 prose-ul:pl-4 prose-ol:pl-4 prose-ul:my-2 prose-ol:my-2"
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

        {msg.isComplete && (
          <RelatedQuestions setQuery={setQuery} message={msg} />
        )}
      </div>
    );
  };

  return messages.map((msg, index) =>
    msg.role === "user"
      ? renderUserMessage(msg, index)
      : renderAssistantMessage(msg, index)
  );
};
