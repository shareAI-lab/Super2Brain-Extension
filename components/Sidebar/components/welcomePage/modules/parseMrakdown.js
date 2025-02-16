import { useMemo } from "react";
import { marked } from "marked";
import { Package } from "lucide-react";

const PlaceHolder = () => {
  return (
    <div className="flex-1 min-h-[400px] flex items-center justify-center">
      <div className="p-8 text-center hover:scale-105 transition-all duration-300">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 bg-white shadow-lg rounded-xl flex items-center justify-center">
            <Package className="w-14 h-14 text-indigo-600" />
          </div>
          <div className="space-y-3">
            <div className="font-medium text-gray-700 text-lg">
              出了一点小错
            </div>
            <div className="text-sm text-gray-500 max-w-xs">
              服务繁忙，请稍后再试
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PlaceHolder };

const MarkdownRenderer = ({
  content = "",
  criticalAnalysis = "",
  currentUrlTab,
  setCurrentUrlTab,
  isLoading = false,
}) => {
  const tabs = useMemo(
    () => [
      { id: "welcome", name: "亮点" },
      { id: "analysis", name: "批判" },
    ],
    []
  );

  const handleSaveWebPage = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "SAVE_CONTENT",
    });

    if (response?.received) {
      return { success: true };
    }

    throw new Error("保存失败");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      );
    }

    if (currentUrlTab === "welcome") {
      return content ? (
        <div className="prose prose-sm md:prose-base lg:prose-lg prose-slate mx-4 mt-4">
          <div
            className="py-2 text-sm text-indigo-500 cursor-pointer hover:bg-indigo-600/10 hover:text-indigo-600 px-4 py-2 rounded-md mx-auto w-fit text-center transition-colors duration-200"
            onClick={handleSaveWebPage}
          >
            觉得该网页不错？点击收藏到知识库
          </div>
          <div dangerouslySetInnerHTML={{ __html: marked(content) }} />
        </div>
      ) : (
        <PlaceHolder />
      );
    }

    return criticalAnalysis ? (
      <div className="prose prose-sm md:prose-base lg:prose-lg prose-red mx-4">
        <div
          dangerouslySetInnerHTML={{
            __html: marked(criticalAnalysis),
          }}
        />
      </div>
    ) : (
      <PlaceHolder />
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl">
      <div className="flex-shrink-0 pt-4">
        <div className="flex justify-center gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-3xl w-fit mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 border border-gray-100/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentUrlTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${
                  currentUrlTab === tab.id
                    ? "bg-indigo-50/90 text-indigo-600 shadow-[0_2px_12px_rgb(99,102,241,0.12)]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 md:p-8">{renderContent()}</div>
    </div>
  );
};

export { MarkdownRenderer };
