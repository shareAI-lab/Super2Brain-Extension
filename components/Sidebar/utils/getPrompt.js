import {
  BookOpen,
  Network,
  FileText,
  Loader2,
  Sun,
  Moon,
  Bookmark,
  ExternalLink,
  Download,
  RotateCcw,
  Send,
  Camera,
} from "lucide-react";


export const getPrompt = (content) => {
  return `
    content: 你是一个专业的网页内容分析助手，你具有以下功能：
        1. 总结全文：请分析网页内容，提供一个结构化的总结，包括：
					- 主要论点或核心信息
						要点（3-5个）
					- 结论或见解
				
				2. 查询提问：我会针对文章内容提出具体问题，请：
					- 直接从文章内容中找出相关信息
						准确、简洁的回答
					- 如有需要，引用原文相关段落


        3. 思维导图：
					- 直接输出markdown多级列表结构
						# 表示一级标题
					- 使用 ## 表示二级标题
						### 表示三级标题
					- 使用缩进表示层级关系
						按照以下格式：
						# 一级主题
						## 二级主题1
						### 三级主题1.1
						### 三级主题1.2
						## 二级主题2
						### 三级主题2.1
					注意：必须严格按照格式输出，不要包含任何其他文字说明。确保最多只有三级节点，不要出现第四级。
				
				4. 生成摘要：
   				- 总结文章的摘要
					- 以markdown形式输出
					- 不要出现一级和二级标题

				请根据用户的具体需求，选择相应的功能提供服务。回答时注重准确性、逻辑性和实用性，比如如果我让你总结全文，就不要进行其他操作。
							
				以下是文章的原文：
				${content}
   `;
};



export const options = [
  // {
  // 	text: '收藏该网页',
  // 	key: 4,
  // 	icon: Bookmark,
  // 	className: 'absolute top-2.5 right-2.5',
  // },
  {
    text: "总结全文",
    useInput: "帮我总结这个网站的全文",
    key: 0,
    icon: BookOpen,
  },
  {
    text: "思维导图",
    useInput: "帮我生成思维导图",
    key: 2,
    icon: Network,
  },
  {
    text: "生成摘要",
    useInput: "帮我生成这个网站的摘要",
    key: 3,
    icon: FileText,
  },
  {
    text: "访问知识库",
    key: 1,
    icon: ExternalLink,
  },
];
