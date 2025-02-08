import { Plus, Send } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useState, useMemo } from "react";
import { super2brainModel } from "../config/models.js";
import { createThingAgent } from "../utils/demo/thingAgent.js";
import { useMessageHandler } from "../hooks/useMessageHandler";
import { MessageRenderer } from "../components/MessageRenderer";
import { ModelSelector } from "../components/ModelSelector";

const Demo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  const thinkingAgent = useMemo(
    () =>
      createThingAgent({
        apiKey: "sk-OSqhqCm1DoE24Kf0E2796eAeE75b484d9f08CbD779E7870a",
        baseURL: "https://openai.super2brain.com/v1",
        model: selectedModel,
      }),
    [selectedModel]
  );

  const { message, isLoading, handleSubmit, setMessage } = useMessageHandler(
    thinkingAgent,
    selectedModel
  );
  const model = super2brainModel[selectedModel]?.id || "选择模型";

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    setIsOpen(false);
  };

  const handleReset = () => {
    setQuery("");
    setMessage([]);
  };

  const handleMessageSubmit = async () => {
    if (!query.trim() || isLoading) return;

    try {
      await handleSubmit(query);
      setQuery("");
    } catch (error) {
      console.error("发送消息时出错:", error);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-24px)] rounded-xl flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2 space-y-4">
        <MessageRenderer messages={message} />
      </div>

      <div className="flex-shrink-0 bg-white p-2">
        <div className="relative">
          <div className="flex items-center gap-2 justify-between">
            <ModelSelector
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              model={model}
              selectedModel={selectedModel}
              handleModelSelect={handleModelSelect}
              super2brainModel={super2brainModel}
            />

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className={`button-tag-newChat p-2 rounded-xl
                flex items-center justify-center
                transition-all duration-200
                ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
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
                onClick={() => handleMessageSubmit()}
                disabled={!query.trim() || isLoading}
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

          <div
            className="relative rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600 mt-2"
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
                text-gray-900 outline-none resize-none h-24
                placeholder:text-gray-400 sm:text-sm/6"
              placeholder="请输入您的问题..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Demo };
