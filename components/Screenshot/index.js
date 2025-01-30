import React, { useState, useEffect } from "react";
import { ArrowLeft, Camera, Send } from "lucide-react";

export default function Screenshot({ onBack, onCaptureComplete }) {
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  const handleScreenshot = async () => {
    setScreenshotPreview(null); // 重新截图时清除预览
    try {
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

            document.body.removeChild(overlay);
          });
        },
      });
    } catch (error) {
      console.error("截图初始化失败:", error);
    }
  };

  useEffect(() => {
    const handleCaptureArea = async (message) => {
      if (message.type === "CAPTURE_AREA") {
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const { x, y, width, height, devicePixelRatio } = message.area;

          const dataUrl = await chrome.tabs.captureVisibleTab(null, {
            format: "png",
          });

          const img = new Image();
          img.src = dataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

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

          const screenshotUrl = canvas.toDataURL("image/png");
          setScreenshotPreview(screenshotUrl); // 保存预览图片
        } catch (error) {
          console.error("区域截图失败:", error);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleCaptureArea);
    return () => chrome.runtime.onMessage.removeListener(handleCaptureArea);
  }, []);

  const handleConfirm = () => {
    if (screenshotPreview) {
      onCaptureComplete(screenshotPreview);
      onBack();
    }
  };

  const handleSendQuestion = async () => {
    if (!question.trim()) return;
    
    // Mock响应，之后可替换为实际API调用
    const mockResponse = `这是对于问题"${question}"的模拟回答。实际实现时将替换为API响应。`;
    setAnswer(mockResponse);
    setQuestion('');
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-gray-100 p-3 relative flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg transition-all duration-200 bg-slate-800/80 hover:bg-slate-700/80 text-gray-400 hover:text-gray-300"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-medium">屏幕截图</h2>
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        {screenshotPreview ? (
          <>
            <div className="relative w-full max-h-[40vh] overflow-hidden rounded-lg">
              <img 
                src={screenshotPreview} 
                alt="截图预览" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleScreenshot}
                className="px-4 py-2 rounded-lg transition-all duration-200 bg-slate-800/80 hover:bg-slate-700/80 text-gray-300"
              >
                重新截图
              </button>
            </div>

            <div className="w-full space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="请输入您的问题..."
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-gray-100 border border-slate-700 focus:outline-none focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
                />
                <button
                  onClick={handleSendQuestion}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Send size={16} />
                  发送
                </button>
              </div>
            </div>

            {answer && (
              <div className="p-4 rounded-lg bg-slate-800 text-gray-100 mt-auto">
                {answer}
              </div>
            )}
          </>
        ) : (
          <button
            onClick={handleScreenshot}
            className="p-4 rounded-xl transition-all duration-200 bg-slate-800/80 hover:bg-slate-700/80 text-blue-400 hover:text-blue-300 flex flex-col items-center gap-3"
          >
            <Camera size={32} />
            <span className="text-sm">点击开始截图</span>
          </button>
        )}
      </div>
    </div>
  );
} 