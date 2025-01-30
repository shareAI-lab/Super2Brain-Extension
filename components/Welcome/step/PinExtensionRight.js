import { Zap, Flame, Lightbulb } from 'lucide-react';

export default function PinExtensionRight() {
  const features = [
    {
      Icon: Zap,
      title: "一键启动",
      description: "随时点击工具栏图标，快速打开super2brain插件。"
    },
    {
      Icon: Flame, 
      title: "快捷操作",
      description: "一键将浏览器书签导入到知识库。"
    },
    {
      Icon: Lightbulb,
      title: "随时查看任务状态", 
      description: "可以看到自己导入的内容的更新状态。"
    }
  ];

  return (
    <div className="flex flex-col gap-8 p-12 bg-white rounded-xl shadow-lg min-h-[600px] w-full relative">
      <div className="absolute top-12 right-16 flex flex-col items-center">
        <div className="text-blue-600 text-xl font-medium px-3 py-2 bg-blue-50 rounded-lg">
          点击这里打开插件管理面板👆 
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          📌 快速访问
        </h2>
        <p className="text-gray-600 text-lg">固定插件后，您可以：</p>
      </div>

      <div className="grid gap-6">
        {features.map(({ Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-5 p-5 rounded-lg hover:bg-gray-50 transition-all duration-300"
          >
            <Icon className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-xl text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-gray-600 text-base">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 