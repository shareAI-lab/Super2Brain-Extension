import React from "react";
import { ArrowRight } from "lucide-react";

export default function First({ onNext, apiKey, setApiKey }) {
  return (
    <div>
      <div className="mb-16 pt-12">
        <h2 className="text-2xl mb-4 flex items-center gap-2">
          <span className="inline-block">🎉</span>
          就差一点啦，请先设置您的apikey
        </h2>
        <p className="text-lg text-gray-600">
          您已成功安装super2brain插件！只需几步简单设置，即可将您收藏或阅读的网页内容，一键导入知识库。
        </p>
      </div>
      <div>
        <div className="flex flex-col gap-6">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入你的super2brain的apikey"
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-sm text-gray-500">
            还没有key？
            <a
              href="https://super2brain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              点击获取
            </a>
          </div>
          <button
            onClick={onNext}
            disabled={!apiKey}
            className={`w-fit flex items-center justify-center gap-2 px-6 py-3 text-base rounded-lg transition-colors ${
              apiKey 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-blue-200/70 text-blue-400 cursor-not-allowed"
            }`}
          >
            继续
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
