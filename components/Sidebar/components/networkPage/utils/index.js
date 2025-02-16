import { OpenAI } from "openai";
import { config } from "../../../../config/index";
import { getUserInput } from "../../../../../public/storage";

const invokeOpenAI = async (messages, model = "gpt-4o-mini") => {
  const useInput = await getUserInput();
  const openai = new OpenAI({
    apiKey: useInput,
    baseURL: `${config.baseUrl}/text/v1`,
    dangerouslyAllowBrowser: true,
  });

  let fullContent = "";

  const stream = await openai.chat.completions.create({
    messages,
    model: model,
    temperature: 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    fullContent += content;
  }

  return fullContent;
};

const generateSearchQuery = async (userInput, messageHistory, model) => {
  const contextMessages = messageHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const messages = [
    ...contextMessages,
    {
      role: "user",
      content: `基于我们的对话历史，请将以下用户输入转换为简洁的搜索的问题（只返回关键词，不需要其他解释）：
      "${userInput}"`,
    },
  ];

  try {
    const searchQuery = await invokeOpenAI(messages, model);
    return searchQuery.trim();
  } catch (error) {
    console.error("生成搜索查询时出错:", error);
    return userInput;
  }
};

const createSearchUrl = (searchQuery) => {
  const encodedQuery = encodeURIComponent(searchQuery);
  return `https://www.bing.com/search?q=${encodedQuery}`;
};

const analyzeAndCreateSearchUrl = async (userInput, messageHistory, model) => {
  const searchQuery = await generateSearchQuery(
    userInput,
    messageHistory,
    model
  );
  return createSearchUrl(searchQuery);
};

const analyzeInputType = async (
  userInput,
  messageHistory,
  model,
  searchEnabled
) => {
  if (!searchEnabled) {
    return "CONTEXT_BASED";
  } else {
    return "SEARCH";
  }
};

const getDirectResponse = async (userInput, messageHistory, model, onStreamProgress) => {
  const contextMessages = messageHistory.slice(-3).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const messages = [
    {
      role: "system",
      content: "请提供详细的回答，并在回答的同时展示你的推理过程。使用 [推理过程] 和 [回答] 来区分内容。",
    },
    ...contextMessages,
    {
      role: "user",
      content: `基于我们的对话历史，请回答用户的问题：
      "${userInput}"`,
    },
  ];

  try {
    const openai = new OpenAI({
      apiKey: await getUserInput(),
      baseURL: `${config.baseUrl}/text/v1`,
      dangerouslyAllowBrowser: true,
    });

    const stream = await openai.chat.completions.create({
      messages,
      model: model,
      temperature: 0.7,
      stream: true,
    });

    let fullContent = "";
    let fullReasoningContent = "";
    let isReasoningSection = true;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      
      if (content.includes("[回答]")) {
        isReasoningSection = false;
        continue;
      }
      if (content.includes("[推理过程]")) {
        isReasoningSection = true;
        continue;
      }

      if (isReasoningSection) {
        fullReasoningContent += content;
      } else {
        fullContent += content;
      }

      // 流式输出进度回调
      onStreamProgress?.({
        state: 2,
        response: fullContent.trim(),
        reasoning_content: fullReasoningContent.trim()
      });
    }

    return {
      content: fullContent.trim(),
      reasoning_content: fullReasoningContent.trim()
    };
  } catch (error) {
    console.error("获取直接回应时出错:", error);
    throw error;
  }
};

const getResponse = async (
  query,
  searchEnabled,
  onProgress,
  messageHistory = [],
  model = "gpt-4o-mini"
) => {
  const inputType = await analyzeInputType(
    query,
    messageHistory,
    "gpt-4o-mini",
    searchEnabled
  );

  if (inputType === "SEARCH") {
    const searchUrl = await analyzeAndCreateSearchUrl(
      query,
      messageHistory,
      "gpt-4o-mini"
    );
    onProgress({ state: 1, searchUrl });
  } else if (
    ["GREETING", "TRANSLATION", "CONTEXT_BASED", "UNKNOWN"].includes(inputType)
  ) {
    try {
      await getDirectResponse(
        query,
        messageHistory,
        model.toLowerCase(),
        (progress) => {
          onProgress({ 
            state: 2, 
            response: progress.response,
            reasoning_content: progress.reasoning_content 
          });
        }
      );
    } catch (error) {
      console.error("获取直接回应时出错:", error);
      throw error;
    }
  }
};

export { getResponse };
