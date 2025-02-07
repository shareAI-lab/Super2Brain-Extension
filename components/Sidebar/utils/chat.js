import { config } from '../../config/index'

const buildSystemPrompt = () => ({
  role: "system",
  content: `你是一个专业的内容结构分析助手。请严格按照以下层级格式输出内容：

    # 主要主题
    ## 具体要点

    注意事项：
    - 仅输出层级结构内容，可以在二级具体要点进行补充
    - 确保层级不超过两级
    - 每个层级的内容应简明扼要
    - 保持逻辑连贯性`,
});

export const fetchUrlContent = async (content, model = "gpt-4o-mini") => {
  try {
    const response = await fetch(
      `${config.modelUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [buildSystemPrompt(), { role: "user", content }],
        }),
      }
    );

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
