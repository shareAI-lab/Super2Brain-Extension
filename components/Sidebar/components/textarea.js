import React from "react";
import {
  Send,
  RotateCcw,
  FileText,
  FileDigit,
  GitFork,
  FileSearch,
} from "lucide-react";

export const TextareaRef = ({ onSubmit, onReset }) => {
  const [inputValue, setInputValue] = React.useState("");
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

  const handleTagClick = React.useCallback(
    (prompt, type) => {
      if (type === "mindmap") {
        chrome.runtime.sendMessage({
          type: "OPEN_MINDMAP",
          payload: {
            prompt,
            url: window.location.href,
            title: document.title,
          },
        });
        return;
      }
      onSubmit(prompt);
    },
    [onSubmit]
  );

  const tags = [
    {
      text: "总结全文",
      prompt: "请帮我总结这篇文章的主要内容",
      icon: FileText,
    },
    {
      text: "生成摘要",
      prompt: "请生成这篇文章的简短摘要，包含关键信息",
      icon: FileDigit,
    },
    {
      text: "思维导图",
      prompt:
        "请根据这篇文章的内容，生成一个详细的思维导图，用 Markdown 格式的列表呈现",
      type: "mindmap",
      icon: GitFork,
    },
  ];

  const handleSubmit = React.useCallback(() => {
    if (!inputValue.trim()) return;
    onSubmit(inputValue);
    setInputValue("");
  }, [inputValue, onSubmit]);

  return (
    <div>
      <div className="relative mb-2">
        <div
          ref={tagsContainerRef}
          className="flex overflow-x-auto no-scrollbar gap-2 pb-2"
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
      </div>

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
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="请输入您的问题..."
          rows={4}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
          text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 
          placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2
          focus:outline-indigo-600 sm:text-sm/6 pr-24"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
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
          <button
            onClick={onReset}
            className="p-2 rounded-md 
            flex items-center justify-center
            transition-all duration-200 ease-in-out
            text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
