import OpenAI from "openai";
import { config } from "../../../../config/index";
import { createStreamCompletion } from "./streamUtils";

export const createWebContent = (url, content, query) => ({
  url,
  content: content || "",
  query,
  timestamp: new Date().toISOString(),
});

export const createThingAgent = ({
  apiKey,
  model = "gpt-4o-mini",
  baseURL = `${config.baseUrl}/text/v1`,
}) => {
  if (model === "Deepseek-R1") {
    model = "asoner";
  } else if (model === "Deepseek-V3") {
    model = "deepseek-chat";
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });

  const analyzeQueryPrompt = `请分析用户的问题,提取出需要重点关注的方面。
        请用简洁的方式列出关键点。`;

  const conversationPrompt = `基于之前的对话和新的内容,请:
        1. 吸收新内容中的相关信息
        2. 完善和补充已有的理解
        3. 给出更全面的答案
        请保持答案的连贯性和完整性。`;

  const analyzeQuery = async (query) => {
    return createStreamCompletion(openai, {
      model,
      messages: [
        { role: "system", content: analyzeQueryPrompt },
        { role: "user", content: query },
      ],
    });
  };

  const processDocuments = async (
    query,
    documents,
    messageHistory,
    onStatusUpdate,
    onStreamUpdate
  ) => {
    const focusPoints = await analyzeQuery(query);
    const contextMessages = messageHistory.map(({ role, content }) => ({
      role,
      content,
    }));

    // 并行处理所有文档
    const documentResponses = await Promise.all(
      documents.map(async (doc) => {
        onStatusUpdate?.(doc.url, 1);

        const response = await createStreamCompletion(openai, {
          model,
          messages: [
            { role: "system", content: conversationPrompt },
            ...contextMessages,
            {
              role: "user",
              content: `问题: ${query}\n关注点: ${focusPoints}\n当前内容: ${doc.content}`,
            },
          ],
        });

        onStatusUpdate?.(doc.url, 2);
        return response;
      })
    );

    // 合并所有文档的响应
    const combinedContent = documentResponses.join("\n\n");

    // 修改最终总结部分为流式输出
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "请总结和整合以下所有内容，给出一个完整的回答：",
        },
        {
          role: "user",
          content: `问题: ${query}\n关注点: ${focusPoints}\n所有内容:\n${combinedContent}`,
        },
      ],
      stream: true,
    });

    let fullContent = "";
    let fullReasoningContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      const reasoningContent = chunk.choices[0]?.delta?.reasoning_content || "";

      fullContent += content;
      fullReasoningContent += reasoningContent;

      onStreamUpdate?.({
        content,
        reasoningContent,
      });
    }

    return {
      content: fullContent,
      reasoning_content: fullReasoningContent,
    };
  };

  return {
    chat: async (
      query,
      documents,
      messageHistory = [],
      onStatusUpdate,
      onStreamUpdate
    ) => {
      try {
        return await processDocuments(
          query,
          documents,
          messageHistory,
          onStatusUpdate,
          onStreamUpdate
        );
      } catch (error) {
        console.error("Agent error:", error);
        throw new Error("处理对话时发生错误");
      }
    },
  };
};
