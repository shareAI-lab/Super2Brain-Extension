import { useState, useEffect } from "react";
import { config } from "../../config/index.js";
import {
  getDeepSeekApiKey,
  getOpenaiApiKey,
  getClaudeApiKey,
  getOllamaConfig,
  getCustomConfig,
  getLmstudioConfig,
  getUserInput,
  getOpenAiUrl,
} from "../../../public/storage";

const useSeetingHandler = () => {
  const [settings, setSettings] = useState({
    super2brain: {
      baseUrl: config.baseUrl || "",
      apiKey: "",
    },
    deepseek: {
      baseUrl: "https://api.deepseek.com",
      apiKey: "",
    },
    openai: {
      baseUrl: "https://api.openai.com",
      apiKey: "",
    },
    claude: {
      baseUrl: "https://api.anthropic.com",
      apiKey: "",
    },
    ollama: {
      baseUrl: "http://localhost:11434",
      apiKey: "",
    },
    lmstudio: {
      baseUrl: "http://localhost:1234",
      apiKey: "",
    },
    custom: {
      baseUrl: "",
      apiKey: "",
    },
  });

  const fetchDeepSeekConfig = async () => {
    try {
      const configs = await Promise.all([
        getDeepSeekApiKey(),
        getOpenaiApiKey(),
        getClaudeApiKey(),
      ]);
      const currentUserInput = await getUserInput();
      const lmstudioConfig = await getLmstudioConfig();
      const ollamaConfig = await getOllamaConfig();
      const customConfig = await getCustomConfig();
      const openaiUrl = await getOpenAiUrl();
      console.log(openaiUrl);
      setSettings((prev) => ({
        super2brain: {
          baseUrl: `${config.baseUrl}/v1` || "",
          apiKey: currentUserInput || "",
        },
        deepseek: {
          baseUrl: "https://api.deepseek.com" || "",
          apiKey: configs[0] || "",
        },
        openai: {
          baseUrl: openaiUrl || "https://api.openai.com",
          apiKey: configs[1] || "",
        },
        claude: {
          baseUrl: "https://api.anthropic.com" || "",
          apiKey: configs[2] || "",
        },
        ollama: {
          baseUrl: ollamaConfig.url || "http://localhost:11434",
          apiKey: ollamaConfig.apiKey || "",
        },
        lmstudio: {
          baseUrl: lmstudioConfig.url || "http://localhost:1234",
          apiKey: lmstudioConfig.apiKey || "",
        },
        custom: {
          baseUrl: customConfig.url || "",
          apiKey: customConfig.apiKey || "",
        },
      }));
    } catch (error) {
      console.error("获取 DeepSeek 配置失败:", error);
    }
  };

  return { settings, setSettings, fetchDeepSeekConfig };
};

export { useSeetingHandler };
