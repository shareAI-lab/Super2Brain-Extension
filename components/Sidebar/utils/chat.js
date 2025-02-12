import { config } from "../../config/index";

const buildSystemPrompt = () => ({
  role: "system",
  content: `你是一位专业的文档分析专家，擅长提炼和总结文章核心内容。请按照以下要求生成文章摘要：

    1. 📝 内容要求
      - 提取文章核心观点和关键信息
      - 使用简洁专业的语言，适当使用 emoji 增强可读性
      - 避免无关内容和套话
      - 直接进入正文，无需开篇和结尾总结
      - 最高级标题统一为"DeepSeek 速览"
      - 内容尽可能的与原文相关且语言简洁
      
    2. 📊 结构要求
      - 采用多级标题格式（最多三级）
      - 标题命名应反映内容实质
      - 控制总字数在原文的 30% 以内
      
    3. 🎯 输出格式
      ### DeepSeek 速览
      #### [核心主题 1]
      ##### [子主题 1.1]
      - 要点描述
      ##### [子主题 1.2]
      - 要点描述
      
      #### [核心主题 2]
      ##### [子主题 2.1]
      - 要点描述

    注意：
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
  content: `你是一位专业的文档质量分析专家，擅长发现文章中的问题。请按照以下要求分析文章缺陷：

1. 🔍 分析维度
   - 内容完整性：信息是否充分，论述是否完整
   - 逻辑严谨性：论证过程是否合理，结论是否可靠
   - 表达准确性：用词是否精准，概念是否清晰
   - 结构合理性：层次是否分明，重点是否突出
   - 实用价值：对读者是否具有实际指导意义
   - 下面的二级三级标题是根据文章内容来分析的，而不是固定的直接缺陷点
 2. 📊 输出格式
   ### DeepSeek 缺陷分析
      #### [缺陷点 1]
      ##### [子缺陷点 1.1]
      - 缺陷描述
      ##### [子缺陷点 1.2]
      - 缺陷描述
      
      #### [缺陷点 2]
      ##### [子缺陷点 2.1]
      - 缺陷描述


注意：
- 不要有改进建议
- 分析应客观公正，基于事实依据
- 批评建议应具有建设性，避免空泛评价
- 使用专业术语，保持语言简洁清晰
- 适当使用 emoji 提升可读性，但不影响专业性`,
});

const processApiResponse = (response) =>
  response.ok
    ? response
        .json()
        .then((data) => ({ ok: true, data: data.choices[0].message.content }))
    : Promise.resolve({ ok: false, error: `API 请求失败: ${response.status}` });

export const fetchUrlContent = async (
  content,
  userInput,
  model = "gpt-4o-mini"
) => {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userInput}`,
    },
    body: JSON.stringify({
      model,
      messages: [buildSystemPrompt(), { role: "user", content }],
    }),
  };

  try {
    const result = await fetch(
      `${config.baseUrl}/text/v1/chat/completions`,
      fetchOptions
    ).then(processApiResponse);

    if (!result.ok) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error) {
    console.error("内容分析失败:", error);
    throw error;
  }
};

export const fetchCriticalAnalysis = async (
  content,
  userInput,
  model = "gpt-4o"
) => {
  try {
    const response = await fetch(`${config.baseUrl}/text/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInput}`,
      },
      body: JSON.stringify({
        model,
        messages: [buildCriticalPrompt(), buildUserPrompt(content)],
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("获取 OpenAI 响应时出错:", error);
    throw error;
  }
};
