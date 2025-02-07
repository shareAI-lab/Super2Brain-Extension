## Super2Brain

### 功能特性

- 🤖 多模型 AI 支持

  - DeepSeek API 集成
  - OpenAI API 集成
  - 灵活的模型切换

- 📊 智能内容分析

  - 网页内容智能总结
  - 关键信息自动提取
  - 智能摘要生成
  - 思维导图可视化

- 🔒 数据安全与隐私
  - 本地数据存储保护
  - 用户隐私保障
  - 便捷导入知识库

### 技术栈

- Next.js
- React
- TailwindCSS
- Markmap

### 开始使用

环境变量

`components/config/index.js`

```js
export const config = {
  token: "", // 调用后端接口的 token
  baseUrl: "", // 调用后端接口的 url
  modelUrl: "", // https://example.com 不需要到 v1
  apiKey: "", // 调用 AI 的 api key
};
```

1. 克隆项目

```bash
git clone https://github.com/your-username/Super2Brain.git

cd Super2Brain
```

2. 安装依赖

```bash
npm install
```

3. 编译

```bash
npm run prep
```

### 系统要求

- Node.js 16.x 或更高版本
- npm 7.x 或更高版本

### 许可证

ISC License

### 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

### 感谢与开源声明

本项目基于以下优秀的开源项目构建：

- [Markmap](https://markmap.js.org/) - 用于生成思维导图的开源库 (MIT License)
- [Next.js](https://nextjs.org/) - React 框架 (MIT License)
- [React](https://reactjs.org/) - 用户界面库 (MIT License)
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架 (MIT License)
- [memfree](https://github.com/memfreeme/memfree) - 用于生成思维导图的开源库 (MIT License)

特别感谢以上项目的贡献者们。本项目遵循 ISC License，详细许可证信息请查看 [LICENSE](./LICENSE) 文件。

如果您使用了本项目，请保留相关的版权信息和许可证声明。
