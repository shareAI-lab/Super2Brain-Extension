import { config } from "../../config/index";

const buildSystemPrompt = () => ({
  role: "system",
  content: `你是一个专业的内容结构分析助手。请严格按照以下层级格式输出内容：

    # 主要主题
    ## 具体要点
    - 补充说明

    注意事项：
    - 所有输出内容都需要使用层级标记
    - 确保主要层级不超过两级
    - 每个层级的内容应简明扼要
    - 保持逻辑连贯性`,
});

const buildUserPrompt = (content) => ({
  role: "user",
  content,
});

const buildCriticalPrompt = () => ({
  role: "system",
  content: `你是一个专业的批判性分析助手。请按照以下原则分析内容，同时输出格式严格按照该格式输出：

    # DeekSeek 评价 (这个值是固定的，且只有一个，括号内的不要显示)
    ## 存在的问题
    - 问题描述

    注意事项：
    - 所有输出内容都需要使用层级标记
    - 确保主要层级不超过两级
    - 每个层级的内容应简明扼要
    - 保持逻辑连贯性
    - 保持客观中立的分析态度
    - 指出关键性问题和潜在风险
    - 提供具体可行的改进方案
    - 确保批评建设性和专业性
    - 遵循结构化的层级输出`,
});

export const fetchUrlContent = async (content, model = "gpt-4o-mini") => {
  try {
    const response = await fetch(`${config.modelUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [buildSystemPrompt(), { role: "user", content }],
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

export const fetchCriticalAnalysis = async (content, model = "gpt-4o-mini") => {
  try {
    const response = await fetch(`${config.modelUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
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
