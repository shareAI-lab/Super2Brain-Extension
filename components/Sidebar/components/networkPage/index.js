import { Plus, Send } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useState, useMemo } from "react";
import { super2brainModel } from "../../config/models.js";
import { createThingAgent } from "./utils/thingAgent.js";
import { useMessageHandler } from "../../hooks/useMessageHandler";
import { MessageRenderer } from "./modules/MessageRenderer";
import { config } from "../../../config";
import { MessageList } from "../notesPage/modules/MessageList";
import { useNotesChat } from "../../hooks/useNotesChat";
import { ModelSelector } from "../common/modelSelect.js";

const NetworkSearch = ({
  userInput,
  setActivatePage,
  selectedModelProvider,
  selectedModelIsSupportsImage,
  setSelectedModelProvider,
  setSelectedModelIsSupportsImage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("Deepseek-R1");
  const [chatMode, setChatMode] = useState("network");

  const thinkingAgent = useMemo(
    () =>
      createThingAgent({
        apiKey: userInput,
        baseURL: `${config.baseUrl}/text/v1`,
        model: selectedModel,
      }),
    [selectedModel, userInput]
  );

  const {
    message,
    isLoading,
    handleSubmit: handleNetworkSubmit,
    setMessage,
  } = useMessageHandler(thinkingAgent, selectedModel, userInput);

  const {
    messages: notesMessages,
    loading: notesLoading,
    expandedDocs,
    copiedMessageId,
    setExpandedDocs,
    handleSubmit: handleNotesSubmit,
    handleCopy,
    handleRegenerate,
    handleReset: handleNotesReset,
  } = useNotesChat(userInput, selectedModel);

  const model = super2brainModel[selectedModel]?.id || "选择模型";

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    setIsOpen(false);
  };

  const handleReset = () => {
    if (chatMode === "network") {
      setQuery("");
      setMessage([]);
    } else {
      handleNotesReset();
    }
  };

  const handleMessageSubmit = async () => {
    if (!query.trim() || (chatMode === "network" ? isLoading : notesLoading))
      return;
    const message = query;
    setQuery("");
    try {
      if (chatMode === "network") {
        await handleNetworkSubmit(message);
      } else {
        await handleNotesSubmit(message);
      }
    } catch (error) {
      console.error("发送消息时出错:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.isComposing || e.keyCode === 229) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMessageSubmit();
    }
  };

  return (
    <div className="w-full h-[calc(100vh-8px)] rounded-xl flex flex-col bg-white">
      <div className="flex-shrink-0 py-4">
        <div className="flex justify-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mx-auto">
          <button
            onClick={() => setChatMode("network")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                chatMode === "network"
                  ? "bg-blue-50 text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Web对话
          </button>
          <button
            onClick={() => setChatMode("notes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                chatMode === "notes"
                  ? "bg-blue-50 text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
          >
            知识库对话
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2 space-y-4">
        {chatMode === "network" ? (
          <MessageRenderer messages={message} setQuery={setQuery} />
        ) : (
          <MessageList
            messages={notesMessages}
            model={selectedModel}
            copiedMessageId={copiedMessageId}
            expandedDocs={expandedDocs}
            handleCopy={handleCopy}
            handleRegenerate={handleRegenerate}
            setExpandedDocs={setExpandedDocs}
            setQuery={setQuery}
          />
        )}
      </div>

      <div className="flex-shrink-0 bg-white p-2">
        {((chatMode === "network" && message.length > 0) ||
          (chatMode === "notes" && notesMessages.length > 0)) && (
          <div className="relative flex justify-center mb-2">
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm text-gray-600 bg-white border 
                border-gray-200 rounded-full hover:text-red-600 hover:border-red-200 
                hover:bg-red-50 transition-all duration-200 shadow-sm"
            >
              清空对话
            </button>
          </div>
        )}
        <div
          className="relative rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600"
        >
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
              text-gray-900 outline-none resize-none h-24
              placeholder:text-gray-400 sm:text-sm/6"
            placeholder="请输入您的问题..."
          />
          <div className="p-2">
            <div className="flex items-center gap-2 justify-between">
              <ModelSelector
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                model={model}
                selectedModel={selectedModel}
                handleModelSelect={handleModelSelect}
                super2brainModel={super2brainModel}
                setActivatePage={setActivatePage}
                useInput={userInput}
                selectedModelProvider={selectedModelProvider}
                selectedModelIsSupportsImage={selectedModelIsSupportsImage}
                setSelectedModelProvider={setSelectedModelProvider}
                setSelectedModelIsSupportsImage={
                  setSelectedModelIsSupportsImage
                }
                setSelectedModel={setSelectedModel}
              />

              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={chatMode === "network" ? isLoading : notesLoading}
                  className={`button-tag-newChat p-2 rounded-xl
                flex items-center justify-center
                transition-all duration-200
                ${
                  (chatMode === "network" ? isLoading : notesLoading)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                }
               shadow-sm hover:shadow-md active:scale-[0.98]`}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <Tooltip
                  style={{ borderRadius: "8px" }}
                  anchorSelect=".button-tag-newChat"
                  place="top"
                >
                  新对话
                </Tooltip>
                <button
                  onClick={handleMessageSubmit}
                  disabled={
                    !query.trim() ||
                    (chatMode === "network" ? isLoading : notesLoading)
                  }
                  className={`button-tag-send p-2 rounded-xl
                flex items-center justify-center
                transition-all duration-200
                ${
                  !query.trim() ||
                  (chatMode === "network" ? isLoading : notesLoading)
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

export { NetworkSearch };
