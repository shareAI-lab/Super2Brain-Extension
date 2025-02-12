import { QRCodeImage } from "./qrcode";
import { Mail } from "lucide-react";

const About = () => {
  return (
    <div className="flex flex-col space-y-8 p-8">
      <h2 className="text-3xl font-bold text-gray-800 pb-6">关于我们</h2>

      <div className="flex flex-col space-y-6">
        <p className="text-lg text-gray-600 leading-relaxed">
          Super2Brain 是您的智能助手，致力于为您提供高效、便捷的 AI
          对话体验。我们期待与您一起探索 AI 的无限可能。
        </p>

        <div className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 p-3 rounded-lg transition-all">
          <Mail className="h-6 w-6 text-indigo-600" />
          <a
            href="mailto:ai-lab@foxmail.com"
            className="text-lg hover:text-indigo-600 transition-colors"
          >
            ai-lab@foxmail.com
          </a>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-8">
        <img
          src={QRCodeImage}
          alt="shareAI二维码"
          className="w-64 h-64 object-cover"
        />
        <div className="flex flex-col space-y-4 text-center">
          <h3 className="text-2xl font-medium text-gray-800">扫码关注我们</h3>
          <div className="space-y-2">
            <p className="text-lg text-gray-600">获取最新功能更新和使用技巧</p>
            <p className="text-lg text-gray-600">加入用户社区，分享使用心得</p>
            <p className="text-lg text-gray-600">随时随地体验 AI 对话的乐趣</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { About };
