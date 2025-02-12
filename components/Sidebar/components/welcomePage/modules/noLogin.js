import { LogIn } from "lucide-react";

const NoLogin = ({ setActivatePage }) => {
  return (
    <div className="w-full h-full rounded-xl flex items-center justify-center bg-white">
      <div className="p-8 text-center transform hover:scale-105 transition-all duration-300">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 bg-white shadow-lg rounded-xl flex items-center justify-center">
            <LogIn className="w-14 h-14 text-indigo-500" />
          </div>
          <div className="space-y-3">
            <div className="font-medium text-gray-700 text-lg">
              没有登录，无法进行网页速览
            </div>
            <button
              onClick={() => setActivatePage(5)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium 
                hover:bg-indigo-700 active:bg-indigo-800 transform hover:-translate-y-0.5 
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

export { NoLogin };
