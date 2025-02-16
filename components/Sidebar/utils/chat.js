import { config } from "../../config/index";

const buildSystemPrompt = () => ({
  role: "system",
  content: `你是一位专业的文档分析专家，擅长提炼和总结文章核心内容。请按照以下要求生成文章摘要：

    1.内容要求
      - 提取文章核心观点和关键信息
      - 使用简洁专业的语言
      - 避免无关内容和套话
      
    2.结构要求
      - 采用多级标题格式（最多三级）
      - 标题命名应反映内容实质
      - 控制总字数在原文的 30% 以内
      
    3.输出格式
      ### 网页摘要
      - 摘要内容，简洁凝练，确保不要遗漏核心内容
      ### [核心主题 1]
      #### [子主题 1.1]
      - 要点描述
      #### [子主题 1.2]
      - 要点描述
      
      ### [核心主题 2]
      #### [子主题 2.1]
      - 要点描述

    注意：
    - 上述格式中 [] 内容应该是根据网页内容分析生成
    - 主题数量和层级应根据文章内容自然延伸，无需强制匹配示例格式
    - 每个要点应当简明扼要，突出实质内容
    - 确保逻辑层次清晰，各级标题之间关系合理`,
});

const buildUserPrompt = (content) => ({
  role: "user",
  content,
});

const buildCriticalPrompt = () => ({
  role: "system",
  content: `你是一个非常毒舌刻薄的评论家，你正在浏览网页内容，请用非常犀利的语言讽刺这个网页主要内容：

  1. 分析维度
    - 对文章主要内容进行反向思考，提供反向观点输出
    - 批评文章的逻辑漏洞，以及错误
    - 讽刺文章内容对读者的实际价值

  2. 输出格式
    ### 反向思考
    #### 反思1
    - 反思内容
    ...
    ### 错误与漏洞 
    #### 漏洞1
    - 错误内容
    ...
    #### 漏洞1
    - 漏洞内容
    ...
    #### 阅读价值讽刺 
    #### 讽刺1
    - 讽刺内容
    ...
   
    注意：
    - 不要有改进建议
    - 分析应客观公正，基于事实依据
    - 批评建议应具有建设性，避免空泛评价
    - 使用专业术语，保持语言简洁犀利
    - 严格参考输出格式进行内容组织输出`,
});

// 使用 Either 模式处理响应
const handleResponse = (response) =>
  response.ok
    ? response.json().then((data) => data.choices[0]?.message?.content || "")
    : Promise.reject(new Error(`API 请求失败: ${response.status}`));

// 简化 fetch 调用
const fetchData = async (messages, userInput, model) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userInput}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  };

  return fetch(`${config.baseUrl}/text/v1/chat/completions/summary`, options)
    .then(handleResponse)
    .catch((error) => {
      console.error("API 调用失败:", error);
      throw error;
    });
};

export const fetchUrlContent = (content, userInput, model = "gpt-4o-mini") =>
  fetchData([buildSystemPrompt(), { role: "user", content }], userInput, model);

export const fetchCriticalAnalysis = (content, userInput, model = "gpt-4o") =>
  fetchData(
    [buildCriticalPrompt(), buildUserPrompt(content)],
    userInput,
    model
  );
