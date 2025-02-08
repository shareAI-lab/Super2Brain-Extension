const SecondRight = () => {
  const features = [
    {
      icon: "🔖",
      title: "书签智能导入",
      description: "一键导入浏览器书签，批量构建个人知识库",
    },
    {
      icon: "🎯",
      title: "RAG知识库构建",
      description: "自动向量化网页内容，构建高质量问答数据库",
    },
    {
      icon: "🤖",
      title: "多模型智能问答",
      description: "支持ChatGPT、Claude等模型，实现知识库智能对话",
    },
    {
      icon: "💬",
      title: "实时网页对话",
      description: "与当前浏览的网页内容实时对话，快速获取页面要点",
    },
    {
      icon: "🔍",
      title: "智能网页解析",
      description: "一键分析任意网页内容，基于RAG技术进行深度问答交互",
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

export default SecondRight;
