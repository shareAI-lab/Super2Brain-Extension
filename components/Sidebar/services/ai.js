const MessageRole = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
};

const createUnifiedRequest = (messages, options = {}) => ({
  messages: messages.map((msg) => {
    const message = {
      role: msg.role,
      content: msg.imageData
        ? [
            { type: "text", text: msg.content },
            {
              type: "image_url",
              image_url: { url: msg.imageData },
            },
          ]
        : msg.content,
    };

    if (msg.reason_content) {
      message.reason_content = msg.reason_content;
    }

    return message;
  }),
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
      stream: true,
    }),
    transformResponse: (response) => ({
      content: response.choices[0].message.content,
      reason_content: response.choices[0].message.reasoning_content,
      usage: response.usage,
    }),
  },
  openai: {
    baseUrl: "/v1/chat/completions",
    transformRequest: (unifiedRequest) => ({
      model: unifiedRequest.model,
      messages: unifiedRequest.messages,
      temperature: unifiedRequest.temperature ?? 0.7,
      max_tokens: unifiedRequest.maxTokens,
      stream: true,
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
      stream: true,
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
      messages: unifiedRequest.messages,
      temperature: unifiedRequest.temperature ?? 0.7,
      max_tokens: unifiedRequest.maxTokens,
      stream: true,
    }),
    transformResponse: (response) => ({
      content: response.choices[0].message.content,
      reason_content: response.choices[0].message.reasoning_content,
      usage: response.usage,
    }),
  },
  ollama: {
    baseUrl: "/api/chat",
    transformRequest: (unifiedRequest) => ({
      model: unifiedRequest.model,
      messages: unifiedRequest.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      options: {
        temperature: unifiedRequest.temperature ?? 0.7,
      },
      stream: true,
    }),
    transformResponse: (response) => ({
      content: response.message.content,
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    }),
  },
  custom: {
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
      stream: true,
    }),
    transformResponse: (response) => ({
      content: response.choices[0].message.content,
      usage: response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    }),
  },
  lmstudio: {
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
      stream: true,
    }),
    transformResponse: (response) => ({
      content: response.choices[0].message.content,
      usage: response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    }),
  },
};

const MODEL_MAPPING = {
  "deepseek-v3": "deepseek-chat",
  "deepseek-r1": "deepseek-r1",
  "Deepseek-V3": "deepseek-chat",
  "Deepseek-R1": "deepseek-r1",
  "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
};

const removeTrailingV1 = (url) =>
  url.endsWith("/v1") ? url.slice(0, -3) : url;

const callAI = async ({
  provider,
  baseUrl,
  apiKey,
  model,
  messages,
  options = {},
}) => {
  const cleanBaseUrl = removeTrailingV1(baseUrl);
  const adapter = modelAdapters[provider];
  let mappedModel = MODEL_MAPPING[model.toLowerCase()] || model;
  if (provider === "deepseek" && model === "deepseek-v3") {
    mappedModel = "deepseek-chat";
  } else if (provider === "deepseek" && model === "deepseek-r1") {
    mappedModel = "deepseek-r1";
  }
  if (!adapter) {
    throw new Error(`不支持的 AI 提供商: ${provider}`);
  }

  try {
    const response = await fetch(`${cleanBaseUrl}${adapter.baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(
        adapter.transformRequest(
          createUnifiedRequest(messages, {
            ...options,
            model: mappedModel,
            stream: true,
          })
        )
      ),
    });

    if (response.status === 402) {
      throw new Error("余额不足");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let fullReasoningContent = "";
    let lastChunkData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const chunkData = JSON.parse(data);
            lastChunkData = chunkData;

            if (
              provider === "custom" ||
              provider === "openai" ||
              provider === "deepseek" ||
              provider === "super2brain" ||
              provider === "lmstudio"
            ) {
              fullContent += chunkData.choices[0]?.delta?.content || "";
              if (chunkData.choices[0]?.delta?.reasoning_content) {
                fullReasoningContent +=
                  chunkData.choices[0].delta.reasoning_content;
              }
            } else if (provider === "claude") {
              fullContent += chunkData.delta?.text || "";
            } else if (provider === "ollama") {
              fullContent += chunkData.message?.content || "";
            } else {
              fullContent += chunkData.message?.content || "";
            }
          } catch (e) {
            console.error("解析流式数据失败:", e);
          }
        }
      }
    }

    // 构造与原格式相同的响应
    const simulatedResponse = {
      choices: [
        {
          message: {
            content: fullContent,
            ...(fullReasoningContent && {
              reasoning_content: fullReasoningContent,
            }),
          },
        },
      ],
      usage: lastChunkData?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };

    return adapter.transformResponse(simulatedResponse);
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new Error("请求超时，请稍后再试，请检查你的网络或切换模型");
    }
    console.error(`${provider} API 调用失败:`, error);
    throw error;
  }
};

export { callAI, MessageRole };
