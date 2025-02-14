import { Sparkle} from "lucide-react";

const PlaceHolder = () => {
  return (
    <div className="flex-1 h-full flex items-center justify-center">
      <div className="p-8 text-center hover:scale-105 transition-all duration-300">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 bg-white shadow-lg rounded-xl flex items-center justify-center">
            <Sparkle className="w-14 h-14 text-indigo-600" />
          </div>
          <div className="space-y-3">
            <div className="font-medium text-gray-700 text-lg">深度思考搜索</div>
            <div className="text-sm text-gray-500 max-w-xs">
              深度思考的过程比较缓慢，请不要关闭侧边栏
            </div>
            <div className="text-sm text-gray-500 max-w-xs">
              Super2Brain会自动操作您的浏览器，进行深度思考
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PlaceHolder };
