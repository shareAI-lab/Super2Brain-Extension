const FirstRight = () => {
  const features = [
    {
      icon: "🔍",
      title: "知识向量搜索",
      description: "智能理解内容语义，快速定位所需知识点",
    },
    {
      icon: "📄",
      title: "文档智能导入",
      description: "支持PDF、Word等多种格式，自动提取重要内容",
    },
    {
      icon: "🌐",
      title: "网页内容采集",
      description: "一键保存网页知识，自动整理归类",
    },
    {
      icon: "🎧",
      title: "音频内容转换",
      description: "将音频内容转换为文字，提取关键信息",
    },
    {
      icon: "🎯",
      title: "会议录音分析",
      description: "自动记录会议要点，生成结构化笔记",
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-12 bg-white rounded-xl shadow-lg min-h-[600px] w-full">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🚀 构建你的智能知识库
        </h2>
        <p className="text-gray-600 text-lg">多维度输入，让知识管理更轻松</p>
      </div>

      <div className="grid gap-8">
        {features.map(({ icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-5 p-5 rounded-lg hover:bg-gray-50 transition-all duration-300"
          >
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-xl text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-gray-600 text-base">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <p className="flex items-center gap-3 text-blue-700">
          <span className="text-xl">💡</span>
          <span className="text-base">
            提示：可以通过快捷键快速启动这些功能
          </span>
        </p>
      </div>
    </div>
  );
};

export default FirstRight;
