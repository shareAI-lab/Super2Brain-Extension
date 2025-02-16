import { Send, Brain } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { ModelSelector2 } from "../../common/modelSelect2";
import { useState } from "react";

const InputArea = ({
  query,
  setQuery,
  maxDepth,
  setMaxDepth,
  isLoading,
  handleSendMessage,
  selectedModel,
  setSelectedModel,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
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
        <div className="flex items-center justify-between px-2 py-1">
          <ModelSelector2
            useInput={true}
            isOpen={dropdownOpen}
            setIsOpen={setDropdownOpen}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedModelProvider="shareAI"
            setSelectedModelProvider={() => {}}
            setSelectedModelIsSupportsImage={() => {}}
          />
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
    </>
  );
};

export { InputArea };
