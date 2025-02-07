import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Send, Plus } from "lucide-react";
import { AI_MODELS } from "../../../config/models";
import { Tooltip } from "react-tooltip";
import { createTags } from "../../../contants/activateBar";
import { useScreenshotHandler } from "../../../hooks/useScreenshotHandler";
import { ModelSelector } from "../../common/modelSelect";

export const TextareaRef = ({
  onSubmit,
  onReset,
  currentUrl,
  selectedModel,
  setSelectedModel,
  isAiThinking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const tagsContainerRef = useRef(null);

  const { screenshotData, setScreenshotData, handleScreenshot } =
    useScreenshotHandler();

  const currentModelSupportsImage = useMemo(() => {
    return AI_MODELS[selectedModel]?.supportsImage ?? false;
  }, [selectedModel]);

  const tags = useMemo(() => {
    return createTags({ currentModelSupportsImage });
  }, [currentModelSupportsImage]);

  const handleWheel = useCallback((e) => {
    if (!tagsContainerRef.current) return;

    e.preventDefault();
    tagsContainerRef.current.scrollLeft += e.deltaY;
  }, []);

  useEffect(() => {
    const container = tagsContainerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    setInputValue("");
  }, [currentUrl]);

  // 4. 优化消息创建逻辑
  const createMessage = useCallback(
    (text, imageData = null) => [
      {
        role: "user",
        content: text,
        ...(imageData && { imageData }),
      },
    ],
    []
  );

  // 5. 优化提交处理
  const handleSubmit = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    onSubmit(createMessage(trimmedValue, screenshotData));
    setInputValue("");
    setScreenshotData(null);
  }, [inputValue, screenshotData, onSubmit, createMessage]);

  // 6. 优化标签点击处理
  const handleTagClick = useCallback(
    async (prompt, type) => {
      if (isAiThinking || (type === "screenshot" && !currentModelSupportsImage))
        return;

      const actionMap = {
        bookmark: async () => {
          const result = await handleBookmarkSave(currentUrl, document.title);
          if (result?.success) console.log("收藏成功");
        },
        mindmap: () =>
          chrome.runtime.sendMessage({
            type: "OPEN_MINDMAP",
            payload: { prompt, url: currentUrl, title: document.title },
          }),
        screenshot: handleScreenshot,
        default: () => onSubmit(createMessage(prompt, screenshotData)),
      };

      try {
        await (actionMap[type] || actionMap.default)();
      } catch (error) {
        console.error(`处理${type}操作失败:`, error);
      }
    },
    [
      onSubmit,
      handleScreenshot,
      currentUrl,
      currentModelSupportsImage,
      isAiThinking,
      screenshotData,
      createMessage,
    ]
  );

  const handleBookmarkSave = async (url, title) => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "SAVE_CONTENT",
      });

      if (response?.received) {
        console.log("收藏请求已发送");
        return { success: true };
      }

      throw new Error("保存失败");
    } catch (error) {
      console.error("收藏失败:", error);
      throw error;
    }
  };

  const getTagButtonClassName = useCallback(
    (tag, isFirstTag = false) => {
      const baseClass = `tags-button-${tag.type}`;
      if (isFirstTag) {
        return `${baseClass} p-2 rounded-xl
          flex items-center justify-center
          transition-all duration-200
          ${
            tag.disabled || isAiThinking
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          }
          shadow-sm hover:shadow-md`;
      }
      return `${baseClass} p-2 rounded-xl
        flex items-center justify-center
        transition-all duration-200
        ${
          tag.disabled || isAiThinking
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200"
        }
        shadow-sm hover:shadow-md`;
    },
    [isAiThinking]
  );

  return (
    <>
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {tags.map((tag, index) => (
            <button
              key={tag.type}
              onClick={() => handleTagClick(tag.prompt, tag.type)}
              disabled={tag.disabled || isAiThinking}
              className={getTagButtonClassName(tag, index === 0)}
            >
              <tag.icon
                className={`w-4 h-4 ${
                  tag.type === "screenshot" ? "-rotate-90" : ""
                }`}
              />
              <Tooltip
                style={{
                  borderRadius: "8px",
                }}
                anchorSelect={`.tags-button-${tag.type}`}
                place="top"
              >
                {tag.text}
              </Tooltip>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            disabled={isAiThinking}
            className={`p-2 rounded-xl
              flex items-center justify-center
              transition-all duration-200
              ${
                isAiThinking
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              }
              shadow-sm hover:shadow-md active:scale-[0.98] button-tag-newChat`}
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
            disabled={!inputValue.trim() || isAiThinking}
            className={`p-2 rounded-xl
              flex items-center justify-center
              transition-all duration-200
              ${
                !inputValue.trim() || isAiThinking
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200"
              }
              shadow-sm hover:shadow-md button-tag-submit`}
          >
            <Send className="w-4 h-4" />
          </button>
          <Tooltip
            style={{
              borderRadius: "8px",
            }}
            anchorSelect=".button-tag-submit"
            place="top"
          >
            发送消息
          </Tooltip>
        </div>
      </div>
      <div>
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        <div
          className="relative mt-2 border border-gray-200 rounded-md 
          focus-within:border-indigo-500 hover:border-indigo-500 
          transition-colors duration-200"
        >
          <div className="relative">
            <ModelSelector
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              setScreenshotData={setScreenshotData}
            />
          </div>
          {screenshotData && (
            <>
              <div className="h-[80px] px-2 pt-2 pb-2">
                <div className="relative inline-block">
                  <img
                    src={screenshotData}
                    alt="截图预览"
                    className="h-[70px] rounded-md shadow-sm object-cover"
                  />
                  <button
                    onClick={() => setScreenshotData(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800/80 
                      hover:bg-gray-900 flex items-center justify-center transition-colors duration-200"
                  >
                    <span className="text-white text-xs leading-none">
                      &times;
                    </span>
                  </button>
                </div>
              </div>
              <div className="mx-2 my-2 border-t border-gray-200" />
            </>
          )}

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="请输入您的问题..."
            rows={4}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
              text-gray-900 outline-none resize-none min-h-[100px] max-h-[300px]
              placeholder:text-gray-400 sm:text-sm/6"
          />
        </div>
      </div>
    </>
  );
};
