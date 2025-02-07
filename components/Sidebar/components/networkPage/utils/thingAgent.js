import OpenAI from "openai";
import { config } from "../../../../config/index";
export const createWebContent = (url, content, query) => ({
  url,
  content: content || "",
  query,
  timestamp: new Date().toISOString(),
});

export const createThingAgent = ({
  apiKey = config.apiKey,
  model = "gpt-4o-mini",
  baseURL = `${config.modelUrl}/v1`,
}) => {
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
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: analyzeQueryPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  };

  const processDocuments = async (
    query,
    documents,
    messageHistory,
    onStatusUpdate
  ) => {
    const focusPoints = await analyzeQuery(query);

    const contextMessages = messageHistory.slice(-5).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const finalResponse = await documents.reduce(
      async (prevResponsePromise, doc, index) => {
        const prevResponse = await prevResponsePromise;

        onStatusUpdate?.(doc.url, 1);

        const messages = [
          { role: "system", content: conversationPrompt },
          ...contextMessages, 
          {
            role: "user",
            content: `问题: ${query}\n关注点: ${focusPoints}\n当前内容: ${doc.content}`,
          },
        ];

        if (prevResponse) {
          messages.push({ role: "assistant", content: prevResponse });
        }

        const response = await openai.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
        });

        onStatusUpdate?.(doc.url, 2);

        return response.choices[0].message.content;
      },
      Promise.resolve("")
    );

    return finalResponse;
  };

  return {
    chat: async (query, documents, messageHistory = [], onStatusUpdate) => {
      try {
        return await processDocuments(
          query,
          documents,
          messageHistory,
          onStatusUpdate
        );
      } catch (error) {
        console.error("Agent error:", error);
        throw new Error("处理对话时发生错误");
      }
    },
  };
};
