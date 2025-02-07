import { OpenAI } from "openai";
import { searchWeb } from "../service";

const openai = new OpenAI({
  apiKey: "sk-OSqhqCm1DoE24Kf0E2796eAeE75b484d9f08CbD779E7870a",
  baseURL: "https://openai.super2brain.com/v1",
  dangerouslyAllowBrowser: true,
});

const generateSimilarQuestions = async (query, response, onProgress) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "你是一个帮助生成相关问题的AI助手。请基于用户的上一个问题和回答，生成3个后续问题。",
        },
        {
          role: "user",
          content: `基于以下问题和回答，生成3个用户可能会继续追问的后续问题：
            
            原问题：${query}
            回答：${response}
  
            要求：
            1. 问题要对原问题进行深入探讨
            2. 寻求更多相关细节
            3. 探索相关但不同的方面
  
            请直接返回3个问题，每个问题占一行。`,
        },
      ],
    });

    const questions = (completion.choices[0]?.message?.content || "")
      .split("\n")
      .filter((q) => q.trim());

    onProgress?.({ stage: 5, questions });
    return questions;
  } catch (error) {
    console.error("生成相似问题时发生错误:", error);
    return [];
  }
};

const determineSearchNeed = async (query) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "你是一个判断助手。请判断用户的问题是否需要联网搜索最新信息来回答。对于日常聊天、情感交流、翻译、数学计算等问题，不需要联网搜索。",
      },
      { role: "user", content: query },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "determine_search_need",
          description: "判断是否需要联网搜索",
          parameters: {
            type: "object",
            properties: {
              needSearch: {
                type: "boolean",
                description: "是否需要联网搜索",
              },
              reason: {
                type: "string",
                description: "判断原因",
              },
            },
            required: ["needSearch", "reason"],
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "determine_search_need" },
    },
  });

  return JSON.parse(
    response.choices[0].message.tool_calls[0].function.arguments
  );
};

const buildMessages = (systemPrompt, context, searchResults, query) => [
  { role: "system", content: systemPrompt },
  ...context,
  ...(searchResults
    ? [
        {
          role: "system",
          content: `以下是相关的搜索结果，请参考：\n${searchResults}`,
        },
      ]
    : []),
  { role: "user", content: query },
];

const getFinalResponse = async (messages) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });

  // 检查是否有function calling
  const hasFunctionCall = response.choices[0].message.tool_calls?.length > 0;
  return {
    content: response.choices[0].message.content,
    hasFunctionCall,
  };
};

const getSystemPrompt = () => {
  return `你是一个智能助手。请根据用户的问题提供准确、有帮助的回答。如果有搜索结果，请参考搜索结果来回答，但要用自己的话重新组织语言，确保回答流畅自然。
        回答时要注意：
        1. 保持客观专业
        2. 如果信息不确定，要明确指出
        3. 如果有搜索结果，要基于最新信息回答
        4. 使用清晰的结构和适当的分段`;
};

export const getNetwork = async (query, context = [], onProgress) => {
  // 首先判断是否需要搜索
  const { needSearch } = await determineSearchNeed(query);
  onProgress?.({ stage: 1 });

  // 获取搜索结果（如果需要的话）
  const searchResults = needSearch ? await searchWeb(query) : "";

  // 构建消息并获取回答
  const messages = buildMessages(
    getSystemPrompt(),
    context,
    searchResults,
    query
  );
  const { content: response } = await getFinalResponse(messages);

  // 更新进度
  onProgress?.({
    stage: needSearch ? 3 : 2,
    response,
  });

  // 生成相关问题
  const similarQuestions = await generateSimilarQuestions(
    query,
    response,
    onProgress
  );
  onProgress?.({ stage: 4, questions: similarQuestions });

  return response;
};
