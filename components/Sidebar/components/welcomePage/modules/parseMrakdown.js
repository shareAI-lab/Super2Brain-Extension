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
        <div className="prose prose-sm md:prose-base lg:prose-lg prose-slate mx-4">
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
        <div className="flex justify-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentUrlTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  currentUrlTab === tab.id
                    ? "bg-blue-50 text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
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
