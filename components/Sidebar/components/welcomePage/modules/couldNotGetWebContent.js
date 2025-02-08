import { AlertCircle } from "lucide-react";

const CouldNotGetWebContent = ({ setActivatePage }) => {
  return (
    <div className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <p className="text-gray-600">您已关闭获取页面预览功能</p>
        <p className="text-sm text-gray-500">
          前往
          <button
            className="mx-1 text-blue-500 hover:underline"
            onClick={() => {
              setActivatePage(4);
            }}
          >
            设置
          </button>
          开启自动预览
        </p>
      </div>
    </div>
  );
};

export { CouldNotGetWebContent };
