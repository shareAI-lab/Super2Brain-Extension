import { Sparkle, ScanEye } from "lucide-react";
import { MarkdownRenderer } from "./modules/parseMrakdown";
import { CouldNotGetWebContent } from "./modules/couldNotGetWebContent";
import { NoLogin } from "./modules/noLogin";
import { Loading } from "../common/loading";

const WelcomePage = ({
  currentUrlTab,
  setCurrentUrlTab,
  webPreview,
  userInput,
  currentUrl,
  pageContent,
  pageLoading,
  pageSummary,
  pageCriticalAnalysis,
  setActivatePage,
}) => {
  if (!userInput) {
    return <NoLogin setActivatePage={setActivatePage} />;
  }

  if (!webPreview) {
    return <CouldNotGetWebContent setActivatePage={setActivatePage} />;
  }

  return (
    <>
      {pageLoading || !pageContent ? (
        <div className="w-full h-full rounded-l-xl flex items-center justify-center bg-white">
          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center">
                <ScanEye className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full flex items-center justify-center">
                  {!pageContent && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-gray-500">
                        因为浏览器限制原因或者网页加载原因无法获取当前页面内容
                      </span>
                    </div>
                  )}
                </div>
                {pageContent && (
                  <>
                    <div>
                      <div className="font-medium">S2B R1正在思考分析...</div>
                    </div>
                    <Loading />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[calc(100vh-8px)] rounded-xl flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2 space-y-4">
            <MarkdownRenderer
              currentUrlTab={currentUrlTab}
              setCurrentUrlTab={setCurrentUrlTab}
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
