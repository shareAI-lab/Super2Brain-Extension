import { search, rerankNotes } from "./service";
import { OpenAI } from "openai";
import { getSystemPrompt } from "./getSystemPrompt";
import { config } from "../../config/index";


const determineSearchNeed = async (userInput, query, model) => {
  const openai = new OpenAI({
    apiKey: userInput,
    baseURL: `${config.baseUrl}/text/v1`,
    dangerouslyAllowBrowser: true,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是一个判断助手。请判断用户的问题是否需要从知识库中进行向量搜索。
                    对于普通的问候、翻译、数学计算这三种问题，不需要进行向量搜索。
                    对于其他问题，则需要进行向量搜索。
                    
                    请直接返回一个JSON格式的结果，格式如下：
                    {
                      "needSearch": true/false,
                      "reason": "这里是判断原因",
                      "searchKeywords": "这里是搜索关键词"
                    }`,
        },
        { role: "user", content: query },
      ],
    });

    const parsedContent = JSON.parse(response.choices[0].message.content);

    return {
      needSearch: Boolean(parsedContent.needSearch),
      reason: String(parsedContent.reason || "未提供原因"),
      searchKeywords: String(parsedContent.searchKeywords || query),
    };
  } catch (error) {
    console.error("判断搜索需求时发生错误:", error);
    return {
      needSearch: false,
      reason: "处理请求时发生错误",
      searchKeywords: query,
    };
  }
};

const generateSimilarQuestions =
  (openai) => async (query, response, onProgress) => {
    const processQuestions = (content) =>
      (content || "").split("\n").filter((q) => q.trim());

    const handleProgress = (questions) => {
      onProgress?.({ stage: 5, questions });
      return questions;
    };

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

      return Promise.resolve(completion)
        .then((result) => result.choices[0]?.message?.content)
        .then(processQuestions)
        .then(handleProgress)
        .catch((error) => {
          console.error("生成相似问题时发生错误:", error);
          return [];
        });
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
    console.log("results", results);

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

export const getResponse = async (
  query,
  preMessages,
  userInput,
  model,
  onProgress
) => {
  onProgress?.({ stage: 1 });

  const openai = new OpenAI({
    apiKey: userInput,
    baseURL: `${config.baseUrl}/text/v1`,
    dangerouslyAllowBrowser: true,
  });

  const { needSearch, reason, searchKeywords } = await determineSearchNeed(
    userInput,
    query,
    model
  );

  if (!needSearch) {
    onProgress?.({ stage: -1 });
    const directResponse = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是一个友好的AI助手，可以帮助用户回答问题、闲聊和进行翻译。",
        },
        ...preMessages,
        { role: "user", content: query },
      ],
      stream: false,
    });

    const formattedResponse = formatFinalResponse(
      directResponse.choices[0].message.content
    );

    onProgress?.({
      stage: 3,
      response: formattedResponse,
    });

    const questionGenerator = generateSimilarQuestions(openai);
    await questionGenerator(query, formattedResponse, onProgress);
    return formattedResponse;
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
    const completion = await openai.chat.completions.create({
      model,
      messages,
      stream: false,
    });

    const formattedResponse = formatFinalResponse(
      completion.choices[0].message.content
    );

    onProgress?.({
      stage: 3,
      response: formattedResponse,
    });

    const questionGenerator = generateSimilarQuestions(openai);
    await questionGenerator(query, formattedResponse, onProgress);
    return formattedResponse;
  } catch (error) {
    onProgress?.({
      stage: 6,
      response: "服务器不稳定，请您切换其他模型或者检查网络。",
    });
  }
};
