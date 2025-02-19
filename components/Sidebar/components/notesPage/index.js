import { Bot, ChevronDown, Plus, Send } from "lucide-react";
import { useState, useCallback } from "react";
import { getResponse } from "../../utils/index.js";
import { marked } from "marked";
import { Tooltip } from "react-tooltip";
import { super2brainModel } from "../../config/models.js";
import { PlaceHolder } from "./modules/placeHolder.js";
import { MessageList } from "./modules/MessageList.js";

const NotesSearch = ({ useInput, setActivatePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [model, setModel] = useState("gpt-4");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [expandedDocs, setExpandedDocs] = useState({});
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const handleSubmit = async () => {
    if (!useInput) return;
    if (!query.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: query,
      isUser: true,
      isComplete: true,
      isClosed: false,
    };

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      content: "",
      isUser: false,
      isComplete: false,
      isClosed: false,
      related: [],
      aboutQuestion: [],
      questionsLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setQuery("");
    setLoading(true);

    try {
      await getResponse(
        query,
        messages.map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        })),
        (progress) => {
          // 处理搜索相关文档阶段
          if (progress.stage === 2 && progress.results) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? { ...msg, related: progress.results }
                  : msg
              )
            );
          }
          // 处理生成回答阶段
          else if (progress.stage === 3 && progress.response) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      content: progress.response,
                      isClosed: true,
                      isComplete: true,
                      questionsLoading: true,
                    }
                  : msg
              )
            );
          } else if (progress.stage === 5 && progress.questions) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                      ...msg,
                      aboutQuestion: progress.questions,
                      questionsLoading: false,
                    }
                  : msg
              )
            );
          }
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? {
                ...msg,
                questionsLoading: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("对话请求失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // 1.5秒后重置复制状态
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 1500);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleRegenerate = async (messageId) => {
    const currentIndex = messages.findIndex((msg) => msg.id === messageId);
    if (currentIndex < 1) return;

    const userQuestion = messages[currentIndex - 1].content;
    setLoading(true);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: "",
              questionsLoading: false,
              isComplete: false,
            }
          : msg
      )
    );

    try {
      await getResponse(
        userQuestion,
        messages.slice(0, currentIndex - 1).map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        })),
        (progress) => {
          if (progress.stage === 2 && progress.results) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, related: progress.results }
                  : msg
              )
            );
          } else if (progress.stage === 3 && progress.response) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      content: progress.response,
                      isClosed: true,
                    }
                  : msg
              )
            );
          }
          // 处理相关问题阶段
          else if (progress.stage === 5 && progress.questions) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, aboutQuestion: progress.questions }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      console.error("重新生成失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setMessages([]);
    setQuery("");
  }, []);

  return (
    <div
      className="w-full h-[calc(100vh-8px)] rounded-xl flex flex-col bg-white !bg-white"
      style={{ backgroundColor: "white" }}
    >
      {!useInput ? (
        <PlaceHolder setActivatePage={setActivatePage} />
      ) : (
        <MessageList
          messages={messages}
          model={model}
          copiedMessageId={copiedMessageId}
          expandedDocs={expandedDocs}
          handleCopy={handleCopy}
          handleRegenerate={handleRegenerate}
          setExpandedDocs={setExpandedDocs}
          setQuery={setQuery}
        />
      )}

      <div className="flex-shrink-0 bg-white p-2">
        <div className="relative">
          <div className="flex items-center gap-2 justify-between">
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center px-3 py-2
                cursor-pointer w-[200px] rounded-xl 
                bg-gradient-to-r from-indigo-500 to-purple-500
                hover:from-indigo-600 hover:to-purple-600
                active:scale-[0.98] transition-all duration-200
                shadow-sm hover:shadow-md"
            >
              <Bot className="w-4 h-4 text-white" />
              <span className="text-sm text-white ml-2 font-medium">
                {model}
              </span>
              <ChevronDown className="w-4 h-4 ml-auto text-white/80" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={loading}
                className={`button-tag-newChat p-2 rounded-xl
                  flex items-center justify-center
                  transition-all duration-200
                  ${
                    loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  }
                  shadow-sm hover:shadow-md active:scale-[0.98]`}
              >
                <Plus className="w-4 h-4" />
              </button>
              <Tooltip
                style={{
                  borderRadius: "8px",
                }}
                anchorSelect=".button-tag-newChat"
                place="top"
              >
                新对话
              </Tooltip>
              <button
                onClick={handleSubmit}
                disabled={!query.trim() || loading}
                className={`button-tag-send p-2 rounded-xl
                  flex items-center justify-center
                  transition-all duration-200
                  ${
                    !query.trim() || loading || !useInput
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200"
                  }
                  shadow-sm hover:shadow-md`}
              >
                <Send className="w-4 h-4" />
              </button>
              <Tooltip
                style={{
                  borderRadius: "8px",
                }}
                anchorSelect=".button-tag-send"
                place="top"
              >
                {!useInput ? "请先登录" : "发送"}
              </Tooltip>
            </div>
          </div>

          {isOpen && (
            <div className="absolute bg-white border border-gray-200 rounded-xl shadow-lg z-10 bottom-full w-[160px] overflow-hidden">
              <div className="py-1.5">
                {Object.values(super2brainModel).map((modelOption) => (
                  <div
                    key={modelOption.id}
                    className={`px-4 py-2.5 cursor-pointer text-sm transition-all duration-200
                      hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent
                      flex items-center justify-between group
                      ${
                        model === modelOption.id
                          ? "text-indigo-600 bg-indigo-50/50"
                          : "text-gray-600"
                      }`}
                    onClick={() => {
                      setModel(modelOption.id);
                      setIsOpen(false);
                    }}
                  >
                    <span className="group-hover:text-indigo-600">
                      {modelOption.id}
                    </span>
                    {model === modelOption.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="relative rounded-xl bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600 mt-2"
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-xl bg-white px-3 py-1.5 text-base 
              text-gray-900 outline-none resize-none h-24
              placeholder:text-gray-400 sm:text-sm/6"
              placeholder="请输入您的问题..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export { NotesSearch };
