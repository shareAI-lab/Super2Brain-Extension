// AI 模型配置
export const AI_MODELS = {
  // DeepSeek 模型
  "DeepSeek-Chat": {
    id: "DeepSeek-Chat",
    provider: "deepseek",
    supportsImage: false,
  },
  "DeepSeek-Coder": {
    id: "DeepSeek-Coder",
    provider: "deepseek",
    supportsImage: false,
  },
  // Claude 模型
  "claude-3-opus": {
    id: "claude-3-opus",
    provider: "claude",
    supportsImage: true,
  },
  "claude-3.5-sonnet": {
    id: "claude-3.5-sonnet",
    provider: "claude",
    supportsImage: true,
  },
  // OpenAI 模型
  "gpt-4-turbo": {
    id: "gpt-4-turbo",
    provider: "openai",
    supportsImage: true,
  },
  "gpt-4": {
    id: "gpt-4",
    provider: "openai",
    supportsImage: true,
  },
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    provider: "openai",
    supportsImage: false,
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    supportsImage: true,
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    supportsImage: true,
  },
};

export const super2brainModel = {
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    supportsImage: true,
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    supportsImage: true,
  },
  "gpt-4": {
    id: "gpt-4",
    provider: "openai",
    supportsImage: true,
  },
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    provider: "openai",
    supportsImage: false,
  },
};
