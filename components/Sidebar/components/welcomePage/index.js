import { LogIn, Check, Loader2, Globe } from "lucide-react";
import { MarkdownRenderer } from "./modules/parseMrakdown";
import { CouldNotGetWebContent } from "./modules/couldNotGetWebContent";
import { NoLogin } from "./modules/noLogin";
const WelcomePage = ({
  webPreview,
  userInput,
  currentUrl,
  pageContent,
  pageLoading,
  pageSummary,
  pageCriticalAnalysis,
  setActivatePage,
}) => {
  console.log("userinput", !userInput);
  if (!userInput) {
    return <NoLogin setActivatePage={setActivatePage} />;
  }

  if (!webPreview) {
    return <CouldNotGetWebContent setActivatePage={setActivatePage} />;
  }

  return (
    <>
      {pageLoading ? (
        <div className="w-full h-full rounded-xl flex items-center justify-center bg-white">
          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center">
                <Globe className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full ${
                    pageContent ? "bg-green-500" : "border-2 border-gray-300"
                  } flex items-center justify-center`}
                >
                  {pageContent ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium">页面内容已加载</div>
                  <div className="text-sm text-gray-500">{currentUrl}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                </div>
                <div>
                  <div className="font-medium">super2brain分析内容解析</div>
                  <div className="text-sm text-gray-500">全力分析中... </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[calc(100vh-8px)] rounded-xl flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2 space-y-4">
            <MarkdownRenderer
              content={pageSummary}
              criticalAnalysis={pageCriticalAnalysis}
            />
          </div>
        </div>
      )}
    </>
  );
};

export { WelcomePage };
