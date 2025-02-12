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

  const completion = await openai.chat.completions.create({
    messages,
    model: model,
    temperature: 0.7,
    stream: false,
  });

  return completion.choices[0].message.content;
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

const analyzeInputType = async (userInput, messageHistory, model) => {
  const contextMessages = messageHistory.map(({ role, content }) => ({
    role,
    content,
  }));

  const messages = [
    ...contextMessages,
    {
      role: "user",
      content: `基于我们的对话历史，请分析以下用户输入的类型，只返回以下选项之一，返回的选项不要包括前面的数字选项：
      1. GREETING - 如果是问候语（如：你好、早上好等）
      2. TRANSLATION - 如果是翻译请求
      3. SEARCH - 如果是需要搜索的问题
      4. CONTEXT_BASED - 如果问题和和上文有关且关联比较大
      5. UNKNOWN - 如果无法理解或分类
      输入内容："${userInput}"`,
    },
  ];

  try {
    const inputType = await invokeOpenAI(messages, model);
    return inputType.trim();
  } catch (error) {
    console.error("分析输入类型时出错:", error);
    return "UNKNOWN";
  }
};

const getDirectResponse = async (userInput, messageHistory, model) => {
  const contextMessages = messageHistory.slice(-3).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const messages = [
    ...contextMessages,
    {
      role: "user",
      content: `基于我们的对话历史，请回答用户的问题：
      "${userInput}"`,
    },
  ];

  try {
    const response = await invokeOpenAI(messages, model);
    return response.trim();
  } catch (error) {
    console.error("获取直接回应时出错:", error);
    return "抱歉，我遇到了一些问题，无法正确处理您的请求。";
  }
};

const getResponse = async (query, onProgress, messageHistory = [], model) => {
  const inputType = await analyzeInputType(query, messageHistory, model);

  if (inputType === "SEARCH") {
    const searchUrl = await analyzeAndCreateSearchUrl(
      query,
      messageHistory,
      model
    );
    onProgress({ state: 1, searchUrl });
  } else if (
    ["GREETING", "TRANSLATION", "CONTEXT_BASED", "UNKNOWN"].includes(inputType)
  ) {
    const directResponse = await getDirectResponse(
      query,
      messageHistory,
      model
    );
    onProgress({ state: 2, response: directResponse });
  }
};

export { getResponse };
