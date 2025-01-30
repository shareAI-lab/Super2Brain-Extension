import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

export default function PinExtension({ onNext }) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    // 检查插件是否已固定
    const checkPinStatus = async () => {
      try {
        const status = await chrome.action.getUserSettings();
        setIsPinned(status.isOnToolbar);
      } catch (error) {
        console.error("检查固定状态失败:", error);
      }
    };

    // 初始检查
    checkPinStatus();

    const messageListener = (message) => {
      if (message.action === "extensionPinned") {
        setIsPinned(true);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    const intervalId = setInterval(checkPinStatus, 500);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div>
      <div className="mb-16 pt-12">
        <h2 className="text-2xl mb-4 flex items-center gap-2">
          <span className="inline-block">📌</span>
          固定插件到工具栏
        </h2>
        <p className="text-lg text-gray-600">
          为了方便您随时使用super2brain，请将插件固定到浏览器工具栏。
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700">1. 点击浏览器右上角的"扩展"图标</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700">
              2. 找到"super2brain"插件，点击图钉图标
            </p>
          </div>
          <div
            className={`p-4 rounded-lg ${
              isPinned ? "bg-green-50" : "bg-blue-50"
            }`}
          >
            <p className={isPinned ? "text-green-700" : "text-blue-700"}>
              {isPinned ? "✅ 已成功固定插件！" : "3. 等待图标添加完成"}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isPinned}
        className={`w-fit flex items-center justify-center gap-2 px-6 py-3 text-base rounded-lg transition-colors ${
          isPinned
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-blue-200/70 text-blue-400 cursor-not-allowed"
        }`}
      >
        继续
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
