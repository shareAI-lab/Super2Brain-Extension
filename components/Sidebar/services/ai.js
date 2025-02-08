// 定义统一的消息格式
const MessageRole = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
};

const createUnifiedRequest = (messages, options = {}) => ({
  messages,
  model: options.model,
  ...options,
});

const modelAdapters = {
  deepseek: {
    baseUrl: "/v1/chat/completions",
    transformRequest: (unifiedRequest) => ({
      model: unifiedRequest.model || "deepseek-chat",
      messages: unifiedRequest.messages,
      temperature: unifiedRequest.temperature ?? 0.7,
      max_tokens: unifiedRequest.maxTokens,
    }),
    transformResponse: (response) => ({
      content: response.choices[0].message.content,
      usage: response.usage,
    }),
  },

  openai: {
    baseUrl: "/v1/chat/completions",
    transformRequest: (unifiedRequest) => ({
      model: unifiedRequest.model,
      messages: unifiedRequest.messages.map((msg) => ({
        role: msg.role,
        content: Array.isArray(msg.content)
          ? msg.content
          : [{ type: "text", text: msg.content }],
      })),
      temperature: unifiedRequest.temperature ?? 0.7,
      max_tokens: unifiedRequest.maxTokens,
    }),
    transformResponse: (response) => ({
      content: response.choices[0].message.content,
      usage: response.usage,
    }),
  },

  claude: {
    baseUrl: "/v1/messages",
    transformRequest: (unifiedRequest) => ({
      model: unifiedRequest.model,
      messages: unifiedRequest.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: unifiedRequest.temperature ?? 0.7,
      max_tokens: unifiedRequest.maxTokens,
    }),
    transformResponse: (response) => ({
      content: response.content[0].text,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens:
          response.usage.input_tokens + response.usage.output_tokens,
      },
    }),
  },
  super2brain: {
    baseUrl: "/v1/chat/completions",
    transformRequest: (unifiedRequest) => ({
      model: unifiedRequest.model,
      messages: unifiedRequest.messages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === "string"
            ? msg.content
            : Array.isArray(msg.content)
            ? msg.content.map((c) => c.text).join("\n")
            : "",
      })),
      temperature: unifiedRequest.temperature ?? 0.7,
      max_tokens: unifiedRequest.maxTokens,
    }),
    transformResponse: (response) => ({
      content: response.choices[0].message.content,
      usage: response.usage,
    }),
  },
};

// 统一的 api调用格式
const callAI = async ({
  provider,
  baseUrl,
  apiKey,
  model,
  messages,
  options = {},
}) => {
  const adapter = modelAdapters[provider];

  if (!adapter) {
    throw new Error(`不支持的 AI 提供商: ${provider}`);
  }

  try {
    const response = await fetch(`${baseUrl}${adapter.baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(
        adapter.transformRequest(
          createUnifiedRequest(messages, { ...options, model })
        )
      ),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    const data = await response.json();
    return adapter.transformResponse(data);
  } catch (error) {
    console.error(`${provider} API 调用失败:`, error);
    throw error;
  }
};

export { callAI, MessageRole };
