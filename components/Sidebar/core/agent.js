import OpenAI from "openai";
import { config } from "../../config/index";
import { extractUrls } from "./webSearch";
import { createStreamCompletion } from "../components/networkPage/utils/streamUtils";

const callOpenai = async (messages, model = "gpt-4o-mini", userInput) => {
  try {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("消息参数无效");
    }

    if (!userInput) {
      throw new Error("缺少用户认证信息");
    }

    const openai = new OpenAI({
      baseURL: `${config.baseUrl}/text/v1`,
      apiKey: userInput,
      dangerouslyAllowBrowser: true,
    });

    const response = await createStreamCompletion(openai, {
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    if (response.status === 504) {
      throw new Error("链接超时，请检查网络连接并稍后重试");
    }

    if (response.status === 402) {
      throw new Error("账户余额不足，请充值后继续使用");
    }

    return response;
  } catch (error) {
    console.error("OpenAI API 调用失败:", error.message);
    if (
      error.message.includes("链接超时") ||
      error.message.includes("余额不足")
    ) {
      throw new Error(error.message);
    }
    throw new Error(`AI 服务调用失败: ${error.message}`);
  }
};

const analyzeQuery = async (query, updateStatus, userInput, selectedModel) => {
  updateStatus(`思考问题：${query}`);
  const response = await callOpenai(
    [
      {
        role: "system",
        content: `你是一位专业的研究助手。根据用户的问题，生成一个最优的搜索关键词，
                以帮助获取最相关的信息。关键词应该：
                1. 简洁精确
                2. 包含主要信息点
                3. 去除无关词语
                请直接返回关键词字符串，不需要任何格式化。`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    selectedModel,
    userInput
  );

  return response.trim();
};

const buildWebSearchUrl = async (query, updateStatus, userInput) => {
  const searchKey = await analyzeQuery(
    query,
    updateStatus,
    userInput,
    "gpt-4o"
  );
  updateStatus(`搜索关键词：${searchKey}`);
  return [`https://www.bing.com/search?q=${encodeURIComponent(searchKey)}`];
};

const searchWeb = async (query, updateStatus, userInput) => {
  const searchUrls = await buildWebSearchUrl(query, updateStatus, userInput);

  try {
    const responses = await Promise.all(searchUrls.map((url) => fetch(url)));

    const htmlContents = await Promise.all(
      responses.map((response) => response.text())
    );

    return htmlContents;
  } catch (error) {
    console.error("搜索过程中发生错误:", error);
    throw error;
  }
};

const getUrlLink = async (query, updateStatus, userInput) => {
  const searchHtmlContents = await searchWeb(query, updateStatus, userInput);

  const allLinks = searchHtmlContents
    .flatMap((html) => extractUrls(html))
    .filter(
      (link, index, self) => index === self.findIndex((l) => l.url === link.url)
    );

  return allLinks;
};

const fetchWebContent = async (query, userInput, updateStatus) => {
  const allLinks = await getUrlLink(query, updateStatus, userInput);

  const extractResponse = await chrome.runtime.sendMessage({
    action: "extractMultipleContents",
    urls: allLinks.map((result) => result.url),
  });

  return extractResponse.contents;
};

const analyzeUrlContent = async (
  query,
  urlContent,
  userInput,
  selectedModel
) => {
  return await callOpenai(
    [
      {
        role: "system",
        content: `你是一位专业的分析助手。根据用户的问题，以及搜索到的网页的内容进行分析，生成一个关于用户问题的回答。回答的内容要具体一些，包含有具体的细节`,
      },
      {
        role: "user",
        content: `问题：${query}\n网页内容：${urlContent}`,
      },
    ],
    selectedModel,
    userInput
  );
};

const getFinalResponse = async (
  query,
  formattedResults,
  userInput,
  selectedModel
) => {;
  const response = await callOpenai(
    [
      {
        role: "system",
        content: `根据用户的问题以及搜索到的每个网页的回答，生成一个最终的回答。回答的内容要具体一些，包含有具体的细节，返回的格式为markdown`,
      },
      {
        role: "user",
        content: `问题：${query}\n 每个网页的回答：${formattedResults}`,
      },
    ],
    selectedModel,
    userInput
  );

  return response;
};

const getDeepFinalResponse = async (
  query,
  currentResponse,
  formattedResults,
  userInput,
  selectedModel
) => {
  const response = await callOpenai(
    [
      {
        role: "system",
        content: `根据用户的问题以及当前回答，以及补充回答生成一个最终的回答。回答的内容要具体一些，包含有具体的细节，返回的格式为markdown`,
      },
      {
        role: "user",
        content: `问题：${query}\n 当前回答：${currentResponse}\n 补充回答：${formattedResults}`,
      },
    ],
    selectedModel,
    userInput
  );

  return response;
};

const thinkContent = async (
  query,
  currentResponse,
  index,
  userInput,
  selectedModel
) => {
  const response = await callOpenai(
    [
      {
        role: "system",
        content: `你是一个专业的深度思考分析师。你的任务是：
      1. 分析用户原始问题和当前回答之间的关联性
      2. 识别回答内容的潜在缺失
      3. 生成补充性问题以填补信息空缺
      4. 分析深层次的内容生成补充问题

      ${
        index === 0
          ? `必须生成2-4个关于用户原始问题的补充问题`
          : `请严格评估当前回答：
        - 如果论据充分、观点全面、有具体数据支持且包含最新信息，则必须只返回 "[]"
        - 否则生成2-4个补充问题`
      }

      返回格式要求：
      - 如果需要补充问题，返回JSON格式字符串数组，如：["问题1", "问题2"]
      - 如果不需要补充，仅返回 "[]"
      - 不要返回任何其他解释文字
      
      补充问题要求：
      - 具有针对性和深度
      - 避免重复已有信息
      - 聚焦于填补知识空缺
      - 每个问题不超过30个字`,
      },
      {
        role: "user",
        content: `原始问题：${query}\n当前回答：${currentResponse}`,
      },
    ],
    selectedModel,
    userInput
  );

  return response;
};

const getDeepResponse = async (
  query,
  questionList,
  finalResponse,
  depth = 0,
  maxDepth = 1,
  userInput,
  updateStatus
) => {
  if (!Array.isArray(questionList) || questionList.length === 0) {
    return finalResponse;
  }

  updateStatus("补充搜索相关信息");
  const urlContentsList = await Promise.all(
    questionList.map(async (question) => {
      const questionStatus = (status) => {
        updateStatus(status);
      };
      return fetchWebContent(question, userInput, questionStatus);
    })
  );

  updateStatus("深入分析补充内容");
  const deepAnalyzeResults = await Promise.all(
    urlContentsList.map((urlContents, questionIndex) =>
      Promise.all(
        urlContents.map((urlContent) =>
          analyzeUrlContent(
            questionList[questionIndex],
            urlContent.content,
            userInput,
            "gpt-4o"
          )
        )
      )
    )
  );

  const formattedDeepResults = questionList
    .map(
      (question, index) =>
        `补充问题${index + 1}：${question}\n回答：${deepAnalyzeResults[
          index
        ].join("\n")}\n\n`
    )
    .join("");

  updateStatus("完善答案内容");
  const finalDeepResponse = await getDeepFinalResponse(
    query,
    finalResponse,
    formattedDeepResults,
    userInput,
    "gpt-4o"
  );

  if (depth >= maxDepth) {
    return finalDeepResponse;
  }

  updateStatus("检查答案完整性");
  const deepThinkQuestions = JSON.parse(
    await thinkContent(query, finalDeepResponse, depth + 1, userInput, "gpt-4o")
  );

  if (!Array.isArray(deepThinkQuestions) || deepThinkQuestions.length === 0) {
    return finalDeepResponse;
  }

  const deepDepth = depth + 1;
  return getDeepResponse(
    query,
    deepThinkQuestions,
    finalDeepResponse,
    deepDepth,
    maxDepth,
    userInput,
    updateStatus
  );
};

// 创建一个上下文对象来管理共享状态
const createContext = (
  query,
  userInput,
  depth = 0,
  maxDepth = 1,
  onStatusUpdate
) => {
  const context = {
    query,
    userInput,
    depth,
    maxDepth,
    statusList: [],
    updateStatus: (status) => {
      context.statusList.push(status);
      onStatusUpdate?.(context.statusList);
    },
  };
  return context;
};

const isGreeting = async (text, userInput, selectedModel) => {
  try {
    const response = await callOpenai(
      [
        {
          role: "system",
          content: `你是一个判断助手。判断用户输入是否为问候语（如：你好、在吗、打扰一下等，或者是一些闲聊，比如哈哈，等无思考意义的问题）。
          - 如果是问候语，返回 "true"
          - 如果不是问候语，返回 "false"
          - 严格返回布尔值字符串，不要返回其他内容`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      selectedModel,
      userInput
    );

    return response.trim().toLowerCase() === "true";
  } catch (error) {
    console.error("判断问候语失败:", error);
    return false;
  }
};

const getGreetingResponse = async (text, userInput, selectedModel) => {
  try {
    const response = await callOpenai(
      [
        {
          role: "system",
          content: `你是一个友好的AI助手。请根据用户的问候生成一个自然、友好的回应。
          回应要求：
          1. 保持简短自然
          2. 表达愿意帮助的态度
          3. 语气要亲切`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      selectedModel,
      userInput
    );

    return response;
  } catch (error) {
    console.error("生成问候回复失败:", error);
    return "你好！我是你的AI助手，很高兴为你服务。";
  }
};

// 修改主要响应函数
const getResponse = async (
  query,
  depth = 0,
  maxDepth = 1,
  userInput,
  selectedModel,
  onStatusUpdate
) => {
  try {
    if (await isGreeting(query, userInput, selectedModel)) {
      return await getGreetingResponse(query, userInput, selectedModel);
    }

    const context = createContext(
      query,
      userInput,
      depth,
      maxDepth,
      onStatusUpdate
    );

    const urlContents = await fetchWebContent(
      query,
      userInput,
      context.updateStatus
    );

    context.updateStatus("分析搜索结果");
    const analyzeResults = await Promise.all(
      urlContents.map((urlContent) =>
        analyzeUrlContent(query, urlContent.content, userInput, selectedModel)
      )
    );

    const formattedResults = analyzeResults
      .map((result, index) => `内容${index + 1}：\n${result} \n\n`)
      .join("\n\n");

    context.updateStatus("整理初步答案");
    const finalResponse = await getFinalResponse(
      query,
      formattedResults,
      userInput,
      selectedModel
    );

    if (depth >= maxDepth) {
      return finalResponse;
    }

    context.updateStatus("深入思考分析");
    const deepThinkQuestions = JSON.parse(
      await thinkContent(query, finalResponse, depth, userInput, selectedModel)
    );

    if (deepThinkQuestions.length > 0) {
      context.updateStatus("展开深度研究");
      return await getDeepResponse(
        query,
        deepThinkQuestions,
        finalResponse,
        depth + 1,
        maxDepth,
        userInput,
        context.updateStatus
      );
    }

    return finalResponse;
  } catch (error) {
    console.error("响应生成过程中发生错误:", error);
    throw error;
  }
};

export { getResponse };
