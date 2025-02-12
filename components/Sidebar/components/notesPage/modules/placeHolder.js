import { LogIn } from "lucide-react";

const PlaceHolder = ({ setActivatePage }) => {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2 flex items-center justify-center">
      <div className="p-8 text-center transform hover:scale-105 transition-all duration-300">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 bg-white shadow-lg rounded-xl flex items-center justify-center animate-pulse">
            <LogIn className="w-14 h-14 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="font-medium text-gray-700 text-lg">
              没有登录，无法进行知识库搜索
            </div>
            <button
              onClick={() => setActivatePage(5)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium 
                hover:bg-blue-600 active:bg-blue-700 transform hover:-translate-y-0.5 
                transition-all duration-150 shadow-md hover:shadow-lg"
            >
              点击跳转登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PlaceHolder };
