import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import {
  BookOpen,
  Network,
  FileText,
  Loader2,
  Sun,
  Moon,
  Bookmark,
  ExternalLink,
  Download,
  RotateCcw,
  Send,
  Camera,
} from "lucide-react";
import { Markmap } from "markmap-view";
import { Transformer } from "markmap-lib";
import { createWorker } from "tesseract.js";
import { getPrompt } from "./utils/getPrompt";
import { options } from "./utils/getPrompt";

export default function Sidebar() {
  const [pageContent, setPageContent] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const [hasConnected, setHasConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkMapLoading, setIsMarkMapLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    // 将 window 相关的操作移到 useEffect 中
    if (typeof window !== 'undefined') {
      const theme = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(theme);
    }
  }, []);

  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === "MARKDOWN_CONTENT") {
        setPageContent(message.payload);
        setMessages((prev) => [
          ...prev,
          { role: "system", content: getPrompt(message.payload) },
        ]);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    checkContentScript();

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const checkContentScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]?.id) return;

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "CHECK_READY" },
        function (response) {
          if (chrome.runtime.lastError) {
            setTimeout(checkContentScript, 1000);
            return;
          }

          if (response?.ready) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "GET_MARKDOWN" });
          } else {
            setTimeout(checkContentScript, 1000);
          }
        }
      );
    });
  };

  const fetchContent = async (userInput) => {
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setCurrentStreamingMessage("");
    let content = "";
    setIsLoading(true);
    setIsResponseLoading(true);

    try {
      const response = await fetch(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer sk-dc054cdbe5ec4bc282dbbf2a73c8a360",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: messages.concat({ role: "user", content: userInput }),
            stream: true,
          }),
        }
      );

      if (!response.body) {
        throw new Error("没有返回数据流");
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr === "[DONE]") continue;

              const json = JSON.parse(jsonStr);
              if (json.choices[0].delta.content) {
                content += json.choices[0].delta.content;
                setCurrentStreamingMessage(content);
                setIsLoading(false);
              }
            } catch (e) {
              console.error("JSON解析错误:", e);
            }
          }
        }
      }
      setIsResponseLoading(false);
      setMessages((prev) => [...prev, { role: "assistant", content: content }]);
      setCurrentStreamingMessage("");
    } catch (error) {
      console.error("API调用错误:", error);
      setIsLoading(false);
      setIsResponseLoading(false);
    }
  };

  const fetchMarkmap = async () => {
    setIsResponseLoading(true);
    setIsMarkMapLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "帮我生成思维导图" },
    ]);
    try {
      const response = await fetch(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer sk-dc054cdbe5ec4bc282dbbf2a73c8a360",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: messages.concat({
              role: "user",
              content: "帮我生成思维导图",
            }),
            stream: false,
          }),
        }
      );

      const data = await response.json();
      const markdown = data.choices[0].message.content;

      const markmapContainer = document.createElement("div");
      markmapContainer.style.width = "100%";
      markmapContainer.style.height = "500px";

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.width = "100%";
      svg.style.height = "100%";
      markmapContainer.appendChild(svg);

      const transformer = new Transformer();
      const { root } = transformer.transform(markdown);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", element: markmapContainer },
      ]);

      setTimeout(() => {
        const markmap = Markmap.create(svg, {
          autoFit: true,
          initialCenter: true,
        });
        markmap.setData(root);
      }, 0);

      setIsMarkMapLoading(false);
      setIsResponseLoading(false);
    } catch (error) {
      console.error("生成思维导图时出错:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "思维导图生成失败: " + error.message,
        },
      ]);
    }
  };

  const handleToSaveWeb = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SAVE_CONTENT" });
    });
  };

  const handleOptionClick = (option) => {
    if (!hasConnected) {
      setHasConnected(true);
    }
    setSelectedOption(option);
    if (option.key == 0) {
      fetchContent(option.useInput);
    } else if (option.key == 1) {
      window.open("https://x.super2brain.com", "_blank");
    } else if (option.key == 2) {
      fetchMarkmap();
    } else if (option.key == 3) {
      fetchContent(option.useInput);
    } else if (option.key == 5) {
      toggleTheme();
    } else if (option.key == 6) {
      handleReset();
    } else if (option.key == 4) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SAVE_CONTENT" });
      });
    }
  };
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleReset = () => {
    setMessages([messages[0]]);
    setCurrentStreamingMessage("");
    setIsLoading(false);
    setIsMarkMapLoading(false);
    setIsResponseLoading(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      if (messages[messages.length - 1].role === "user") {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const heightFlag = container.querySelector(".heightFlag");
          if (heightFlag) {
            const newMessageHeight = heightFlag.clientHeight;
            container.scrollTo({
              top: scrollHeight - clientHeight - newMessageHeight - 10,
              behavior: "smooth",
            });
          }
        }
      }
    }
  }, [messages]);

  const handleDownloadMarkmap = async (content) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.pointerEvents = "none";
    container.style.opacity = "0";
    document.body.appendChild(container);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "1920");
    svg.setAttribute("height", "1080");
    container.appendChild(svg);

    const transformer = new Transformer();
    const { root } = transformer.transform(content);
    const markmap = Markmap.create(svg, {
      autoFit: true,
      initialCenter: true,
    });

    markmap.setData(root);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = svgUrl;
    a.download = "思维导图.svg";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    document.body.removeChild(container);
    URL.revokeObjectURL(svgUrl);
  };

  // 添加新的处理函数
  const handleOpenMarkmap = async (content) => {
    console.log("传入的content:", content); // 调试日志

    const transformer = new Transformer();
    const { root } = transformer.transform(content);
    console.log("转换后的root:", root); // 调试日志

    const newTab = window.open("", "_blank");
    newTab.document.write(`
      <html>
        <head>
          <title>思维导图预览</title>
          <style>
            html, body { 
              margin: 0; 
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden; 
              background: ${isDarkMode ? "#1e293b" : "#f3f4f6"}; 
            }
            #markmap {
              width: 100%;
              height: 100%;
            }
            svg { 
              width: 100%;
              height: 100%;
              display: block;
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/d3@6"></script>
          <script src="https://cdn.jsdelivr.net/npm/markmap-view"></script>
          <script src="https://cdn.jsdelivr.net/npm/markmap-lib"></script>
        </head>
        <body>
          <div id="markmap"></div>
          <script>
            console.log('新标签页初始化'); // 调试日志
            (async () => {
              const { Markmap } = window.markmap;
              const root = ${JSON.stringify(root)};
              console.log('接收到的root数据:', root); // 调试日志
              
              const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
              document.getElementById('markmap').appendChild(svg);
              
              const mm = Markmap.create(svg, {
                autoFit: true,
                initialCenter: true,
              });
              
              mm.setData(root);
            })();
          </script>
        </body>
      </html>
    `);
  };

  const handleScreenshot = async () => {
    try {
      // 向当前标签页注入选择区域的功能
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        css: `
					.screenshot-overlay {
						position: fixed;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						background: rgba(0, 0, 0, 0.3);
						cursor: crosshair;
						z-index: 999999;
					}
					.screenshot-selection {
						position: absolute;
						border: 2px solid #1e90ff;
						background: rgba(30, 144, 255, 0.1);
						pointer-events: none;
					}
				`,
      });

      // 注入截图选择脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const overlay = document.createElement("div");
          overlay.className = "screenshot-overlay";
          document.body.appendChild(overlay);

          let startX, startY, selection;
          let isDrawing = false;

          overlay.addEventListener("mousedown", (e) => {
            isDrawing = true;
            startX = e.clientX;
            startY = e.clientY;

            selection = document.createElement("div");
            selection.className = "screenshot-selection";
            overlay.appendChild(selection);
          });

          overlay.addEventListener("mousemove", (e) => {
            if (!isDrawing) return;

            const currentX = e.clientX;
            const currentY = e.clientY;

            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            selection.style.left = `${left}px`;
            selection.style.top = `${top}px`;
            selection.style.width = `${width}px`;
            selection.style.height = `${height}px`;
          });

          overlay.addEventListener("mouseup", async (e) => {
            isDrawing = false;
            const rect = selection.getBoundingClientRect();

            // 发送选区信息给扩展
            chrome.runtime.sendMessage({
              type: "CAPTURE_AREA",
              area: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                devicePixelRatio: window.devicePixelRatio,
              },
            });

            // 清理遮罩层
            document.body.removeChild(overlay);
          });
        },
      });
    } catch (error) {
      console.error("截图初始化失败:", error);
    }
  };

  // 添加 OCR 处理函数
  const processImageWithOCR = async (imageUrl) => {
    setIsOcrProcessing(true);
    try {
      const worker = await createWorker("chi_sim");
      const {
        data: { text },
      } = await worker.recognize(imageUrl);
      await worker.terminate();

      // 将识别结果添加到消息列表
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `截图OCR识别结果:\n\n${text}`,
        },
      ]);
    } catch (error) {
      console.error("OCR处理失败:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "图片文字识别失败: " + error.message,
        },
      ]);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // 修改截图处理部分
  useEffect(() => {
    const handleCaptureArea = async (message) => {
      if (message.type === "CAPTURE_AREA") {
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const { x, y, width, height, devicePixelRatio } = message.area;

          // 捕获整个可视区域
          const dataUrl = await chrome.tabs.captureVisibleTab(null, {
            format: "png",
          });

          // 创建一个 canvas 来裁剪图片
          const img = new Image();
          img.src = dataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // 考虑设备像素比
          canvas.width = width * devicePixelRatio;
          canvas.height = height * devicePixelRatio;

          ctx.drawImage(
            img,
            x * devicePixelRatio,
            y * devicePixelRatio,
            width * devicePixelRatio,
            height * devicePixelRatio,
            0,
            0,
            canvas.width,
            canvas.height
          );

          // 将截图添加到消息列表中
          const screenshotUrl = canvas.toDataURL("image/png");
          setMessages((prev) => [
            ...prev,
            {
              role: "user",
              content: `<img src="${screenshotUrl}" alt="截图" style="max-width: 100%; border-radius: 4px;" />`,
            },
          ]);

          // 对截图进行 OCR 处理
          await processImageWithOCR(screenshotUrl);
        } catch (error) {
          console.error("区域截图失败:", error);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleCaptureArea);
    return () => chrome.runtime.onMessage.removeListener(handleCaptureArea);
  }, []);

  return (
    <div
      className={`w-full h-screen ${
        isDarkMode ? "bg-slate-900" : "bg-gray-100"
      } ${
        isDarkMode ? "text-gray-100" : "text-gray-900"
      } p-3 relative flex flex-col`}
    >
      <button
        onClick={handleScreenshot}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isDarkMode
            ? "bg-slate-800/80 hover:bg-slate-700/80 text-blue-400 hover:text-blue-300"
            : "bg-white/90 hover:bg-white text-blue-500 hover:text-blue-600"
        } backdrop-blur-sm flex items-center gap-2`}
      >
        <Camera size={15} />
        <span className="text-sm">屏幕截图</span>
      </button>
      <div className="mt-4 space-y-2 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-2">
          {options.slice(1, 3).map((option, index) => (
            <button
              disabled={isResponseLoading}
              key={index}
              onClick={() => handleOptionClick(option)}
              className={`w-full ${
                isDarkMode
                  ? "bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/30"
                  : "bg-white/90 hover:bg-white border-gray-200/30"
              } rounded-xl p-5 text-base font-medium transition-all duration-200 
							border backdrop-blur-sm flex items-center justify-center gap-4
							${isResponseLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"}`}
            >
              <option.icon size={22} />
              {option.text}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {options.slice(3, 5).map((option, index) => (
            <button
              disabled={isResponseLoading}
              key={index}
              onClick={() => handleOptionClick(option)}
              className={`w-full ${
                isDarkMode
                  ? "bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/30"
                  : "bg-white/90 hover:bg-white border-gray-200/30"
              } rounded-xl p-5 text-base font-medium transition-all duration-200 
							border backdrop-blur-sm flex items-center justify-center gap-4
							${isResponseLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"}`}
            >
              <option.icon size={22} />
              {option.text}
            </button>
          ))}
        </div>
      </div>
      {messages.length == 1 && (
        <div className="flex items-center justify-center text-sm my-4">
          <span
            className={`${
              isDarkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-500 hover:text-blue-600"
            } cursor-pointer`}
            onClick={handleToSaveWeb}
          >
            觉得该网页不错？点击收纳知识库！
          </span>
        </div>
      )}
      <div ref={messagesContainerRef} className="flex-1 my-2 overflow-y-auto">
        {messages
          .filter((message) => message.role !== "system")
          .map((message, index, filteredMessages) => (
            <div
              key={index}
              className={`max-w-[85%] p-2.5 rounded-md mb-1.5 text-sm font-light leading-relaxed ${
                message.role === "user"
                  ? isDarkMode
                    ? "bg-blue-600/50 text-gray-100 ml-auto"
                    : "bg-blue-500/20 text-blue-900 ml-auto"
                  : isDarkMode
                  ? "bg-slate-700/30 text-gray-300 mr-auto"
                  : "bg-white text-gray-700 mr-auto"
              } ${index === filteredMessages.length - 1 ? "heightFlag" : ""}`}
            >
              {message.element ? (
                <div className="relative">
                  <div
                    ref={(node) => {
                      if (node && !node.hasChildNodes()) {
                        node.appendChild(message.element);
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleOpenMarkmap(message.content)}
                      className={`p-1.5 rounded-md ${
                        isDarkMode
                          ? "bg-slate-600/50 hover:bg-slate-500/50"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                      title="在新标签页中打开"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() => handleDownloadMarkmap(message.content)}
                      className={`p-1.5 rounded-md ${
                        isDarkMode
                          ? "bg-slate-600/50 hover:bg-slate-500/50"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                      title="下载思维导图"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked(message.content || ""),
                  }}
                />
              )}
            </div>
          ))}
        {currentStreamingMessage && (
          <div className="min-h-full">
            <div
              className={`max-w-[85%] p-2.5 rounded-md mb-1.5 text-sm font-light mr-auto ${
                isDarkMode
                  ? "bg-slate-700/30 text-gray-300"
                  : "bg-white text-gray-700"
              }`}
              dangerouslySetInnerHTML={{
                __html: marked(currentStreamingMessage),
              }}
            ></div>
          </div>
        )}
        {isLoading && (
          <div className="min-h-full">
            <div
              className={`max-w-[85%] p-2.5 rounded-md mb-1.5 text-sm font-light flex items-center gap-2 ${
                isDarkMode
                  ? "bg-slate-700/30 text-gray-300"
                  : "bg-white text-gray-700"
              }`}
            >
              <Loader2 size={16} className="animate-spin" />
              ai正在思考中
            </div>
          </div>
        )}
        {isMarkMapLoading && (
          <div
            className={`max-w-[85%] p-2.5 rounded-md mb-1.5 text-sm font-light flex items-center gap-2 ${
              isDarkMode
                ? "bg-slate-700/30 text-gray-300"
                : "bg-white text-gray-700"
            }`}
          >
            <Loader2 size={16} className="animate-spin" />
            正在生成思维导图...
          </div>
        )}
        {isOcrProcessing && (
          <div
            className={`max-w-[85%] p-2.5 rounded-md mb-1.5 text-sm font-light flex items-center gap-2 ${
              isDarkMode
                ? "bg-slate-700/30 text-gray-300"
                : "bg-white text-gray-700"
            }`}
          >
            <Loader2 size={16} className="animate-spin" />
            正在进行文字识别...
          </div>
        )}
      </div>
      <div
        className={`mt-auto pt-2 ${
          isDarkMode ? "bg-slate-900" : "bg-gray-100"
        }`}
      >
        <div className="relative flex gap-2">
          <textarea
            className={`flex-1 rounded-md p-2 text-sm font-light resize-none focus:outline-none ${
              isDarkMode
                ? "bg-slate-800/50 text-gray-200 border-slate-700/30 focus:border-slate-600/50 placeholder-gray-500"
                : "bg-white text-gray-900 border-gray-200 focus:border-gray-300 placeholder-gray-400"
            } border pr-24`}
            placeholder="问问这包含于这篇网页的内容..."
            rows={2}
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              onClick={handleReset}
              disabled={isResponseLoading}
              className={`p-1.5 rounded-md ${
                isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              title="重置对话"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => {
                const textarea = document.querySelector("textarea");
                if (textarea.value.trim() && !isResponseLoading) {
                  fetchContent(textarea.value);
                  textarea.value = "";
                }
              }}
              disabled={isResponseLoading}
              className={`p-1.5 rounded-md ${
                isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                  : "bg-blue-500 hover:bg-blue-600 text-white border-transparent"
              } border flex items-center`}
              title="发送"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
