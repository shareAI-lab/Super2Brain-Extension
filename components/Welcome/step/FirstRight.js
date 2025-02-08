const FirstRight = () => {
  const features = [
    {
      icon: "📥",
      title: "智能网页采集",
      description: "一键保存网页内容，自动构建知识向量库",
    },
    {
      icon: "🤖",
      title: "AI智能问答",
      description: "接入官方及第三方大模型,实现知识库智能对话",
    },
    {
      icon: "🔎",
      title: "联网实时搜索",
      description: "智能联网搜索,为对话提供最新信息支持",
    },
    {
      icon: "📃",
      title: "页面速览",
      description: "快速提取页面重点内容,提升阅读效率",
    },
    {
      icon: "🗨️",
      title: "智能对话",
      description: "与当前页面内容进行智能对话交互,深入理解页面信息",
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-12 bg-white rounded-xl shadow-lg h-full w-full">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🚀 打造智能网页助手
        </h2>
        <p className="text-gray-600 text-lg">
          构建个人知识库，提升网页浏览体验
        </p>
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
    </div>
  );
};

export default FirstRight;
