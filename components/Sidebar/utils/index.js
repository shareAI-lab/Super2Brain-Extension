import { search, rerankNotes } from "./service";
import { OpenAI } from "openai";
import { getSystemPrompt } from "./getSystemPrompt";
import { config } from "../../config/index";
import {
  handleStreamResponse,
  createStreamRequest,
} from "../components/networkPage/utils/streamUtils";

const determineSearchNeed = async (userInput, query, model, searchEnabled) => {
  return {
    needSearch: searchEnabled,
    reason: "未提供原因",
    searchKeywords: String(query).trim(),
  };
};

const generateSimilarQuestions =
  (openai) => async (query, response, onProgress) => {
    try {
      const stream = await openai.chat.completions.create({
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
        stream: true,
      });

      const content = await handleStreamResponse(stream);
      const questions = content.split("\n").filter((q) => q.trim());
      onProgress?.({ stage: 5, questions });
      return questions;
    } catch (error) {
      console.error("生成相似问题时发生错误:", error);
      return [];
    }
  };

const formatVectorResults = (results) => {
  return results
    .map(
      (item, index) => `
      文档 ${index + 1}:
      标题：${item.title || "无标题"}
      内容：${item.content || ""}
      正文：${item.polished_content || ""}
      ${item.short_summary ? `摘要：${item.short_summary}` : ""}
      -------------------`
    )
    .join("\n");
};

const getVector = async (userInput, query, onProgress) => {
  try {
    const results = await search(userInput, query);

    onProgress?.({
      stage: 2,
      results: Object.values(results),
    });

    const formattedResults = formatVectorResults(Object.values(results));
    return formattedResults;
  } catch (error) {
    console.error("搜索时发生错误:", error);
    throw new Error("搜索失败");
  }
};

const formatFinalResponse = (response) => {
  return response.trim();
};

const handleStreamOutput = (stream, onProgress) => async () => {
  let accumulatedContent = "";
  let accumulatedReasoningContent = "";

  try {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      const reasoningContent = chunk.choices[0]?.delta?.reasoning_content || "";
      accumulatedContent += content;
      accumulatedReasoningContent += reasoningContent;
      onProgress?.({
        stage: 3,
        response: accumulatedContent,
        reasoning_content: accumulatedReasoningContent,
      });
    }
    return accumulatedContent;
  } catch (error) {
    console.error("处理流式响应时发生错误:", error);
    throw error;
  }
};

const processStreamResponse = async (openai, messages, model, onProgress) => {
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    return await handleStreamOutput(stream, onProgress)();
  } catch (error) {
    console.error("创建流式响应时发生错误:", error);
    throw error;
  }
};

export const getResponse = async (
  query,
  preMessages,
  userInput,
  model,
  searchEnabled,
  onProgress
) => {
  onProgress?.({ stage: 1 });

  const openai = new OpenAI({
    apiKey: userInput,
    baseURL: `${config.baseUrl}/text/v1`,
    dangerouslyAllowBrowser: true,
  });

  const { needSearch, searchKeywords } = await determineSearchNeed(
    userInput,
    query,
    model,
    searchEnabled
  );

  if (!needSearch) {
    onProgress?.({ stage: -1 });

    try {
      const messages = [
        {
          role: "system",
          content: "回答用户的问题",
        },
        ...preMessages,
        { role: "user", content: query },
      ];

      const streamContent = await processStreamResponse(
        openai,
        messages,
        model,
        onProgress
      );

      const questionGenerator = generateSimilarQuestions(openai);
      await questionGenerator(query, streamContent, onProgress);
      return streamContent;
    } catch (error) {
      throw new Error(`API请求失败: ${error.message}`);
    }
  }

  onProgress?.({
    stage: 2,
  });

  const initialResults = await getVector(userInput, searchKeywords, onProgress);

  if (initialResults.length === 0) {
    onProgress?.({
      stage: 3,
      response:
        "不好意思，您的知识库中暂时没有相关内容，请您换一个关键词试试。",
    });
    return;
  }

  const messages = [
    {
      role: "system",
      content: getSystemPrompt(initialResults, preMessages),
    },
    {
      role: "user",
      content: query,
    },
  ];

  onProgress?.({
    stage: 4,
  });

  try {
    const streamContent = await processStreamResponse(
      openai,
      messages,
      model,
      onProgress
    );

    const questionGenerator = generateSimilarQuestions(openai);
    await questionGenerator(query, streamContent, onProgress);
    return streamContent;
  } catch (error) {
    onProgress?.({
      stage: 6,
      response: "服务器不稳定，请您切换其他模型或者检查网络。",
    });
  }
};
