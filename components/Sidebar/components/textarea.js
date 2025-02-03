import React from "react";
import {
  Send,
  RotateCcw,
  FileText,
  FileDigit,
  GitFork,
  FileSearch,
} from "lucide-react";
import SelectModel from "./selectModel";

export const TextareaRef = ({ onSubmit, onReset, currentUrl }) => {
  const [inputValue, setInputValue] = React.useState("");
  const [screenshotData, setScreenshotData] = React.useState(null);
  const tagsContainerRef = React.useRef(null);

  const handleWheel = React.useCallback((e) => {
    if (!tagsContainerRef.current) return;

    e.preventDefault();
    tagsContainerRef.current.scrollLeft += e.deltaY;
  }, []);

  React.useEffect(() => {
    const container = tagsContainerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  React.useEffect(() => {
    const handleScreenshotMessage = (message) => {
      if (message.type === "SCREENSHOT_CAPTURED") {
        setScreenshotData(message.payload.dataUrl);
      }
    };

    chrome.runtime.onMessage.addListener(handleScreenshotMessage);
    return () =>
      chrome.runtime.onMessage.removeListener(handleScreenshotMessage);
  }, []);

  React.useEffect(() => {
    setInputValue("");
  }, [currentUrl]);

  const handleScreenshot = React.useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await chrome.tabs.sendMessage(tab.id, { type: "START_SCREENSHOT" });
    } catch (error) {
      console.error("截图失败:", error);
    }
  }, []);

  const handleTagClick = React.useCallback(
    async (prompt, type) => {
      console.log("标签点击:", {
        prompt,
        type,
        currentUrl,
      });

      if (type === "mindmap") {
        chrome.runtime.sendMessage({
          type: "OPEN_MINDMAP",
          payload: {
            prompt,
            url: currentUrl,
            title: document.title,
          },
        });
        return;
      }

      if (type === "screenshot") {
        await handleScreenshot();
        return;
      }

      onSubmit(prompt);
    },
    [onSubmit, handleScreenshot, currentUrl]
  );

  const tags = [
    {
      text: "总结",
      prompt: "请帮我总结这篇文章的主要内容",
      icon: FileText,
    },
    {
      text: "摘要",
      prompt: "请生成这篇文章的简短摘要，包含关键信息",
      icon: FileDigit,
    },
    {
      text: "网页截图",
      prompt: "请帮我分析并描述这个网页截图的内容",
      type: "screenshot",
      icon: FileSearch,
    },
  ];

  const createMessage = (text, imageData = null) => {
    const content = [
      {
        type: "text",
        text,
      },
    ];

    if (imageData) {
      const base64Image = imageData.split(",")[1];
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
        },
      });
    }

    return [
      {
        role: "user",
        content,
      },
    ];
  };

  const handleSubmit = React.useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    const messages = createMessage(trimmedValue, screenshotData);
    onSubmit(messages);
    setInputValue("");
    setScreenshotData(null);
  }, [inputValue, screenshotData, onSubmit]);

  return (
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

      <div className="relative mt-2">
        {screenshotData && (
          <div className="mb-2">
            <img
              src={screenshotData}
              alt="截图预览"
              className="w-full rounded-md shadow-sm max-h-[50px] object-contain"
            />
          </div>
        )}
        <div
          className="relative rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600"
        >
          <div className="relative mb-2">
            <div className="flex items-center justify-between px-2 pt-2">
              <div
                ref={tagsContainerRef}
                className="flex-1 flex overflow-x-auto no-scrollbar gap-2"
              >
                {tags.map((tag) => (
                  <span
                    key={tag.text}
                    onClick={() => handleTagClick(tag.prompt, tag.type)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium 
                      bg-white text-gray-600 hover:text-indigo-600
                      border border-gray-200 hover:border-indigo-200
                      shadow-sm hover:shadow-md
                      cursor-pointer transform transition-all duration-200 ease-in-out
                      hover:scale-102 active:scale-98
                      hover:bg-gradient-to-r hover:from-indigo-50 hover:to-white
                      select-none backdrop-blur-sm
                      whitespace-nowrap flex-shrink-0"
                  >
                    {React.createElement(tag.icon, { size: 14 })}
                    {tag.text}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 ml-2 flex-shrink-0">
                <SelectModel />
                <button
                  onClick={onReset}
                  className="p-2 rounded-md 
                  flex items-center justify-center
                  transition-all duration-200 ease-in-out
                  text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className={`p-2 rounded-md 
                  flex items-center justify-center
                  transition-all duration-200 ease-in-out
                  ${
                    inputValue.trim()
                      ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="请输入您的问题..."
            rows={4}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
            text-gray-900 outline-none
            placeholder:text-gray-400 sm:text-sm/6"
          />
        </div>
      </div>
    </div>
  );
};
