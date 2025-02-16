import {
  setOllamaModels,
  getOllamaModels,
  getCustomModelIds,
  setCustomModelIds,
  setCustomModels,
  setLmstudioModels,
  getLmstudioModels,
} from "../../../../../public/storage";

export const checkDeepSeekApiKey = async (apiKey) => {
  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Hi" }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "验证失败");
    }

    return true;
  } catch (error) {
    console.error("API密钥验证错误:", error);
    return false;
  }
};

export const checkClaudeApiKey = async (apiKey) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "验证失败");
    }

    return true;
  } catch (error) {
    console.error("API密钥验证错误:", error);
    return false;
  }
};

export const checkOpenAiApiKey = async (apiKey, baseUrl = null) => {
  try {
    if (baseUrl) {
      baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      // 移除末尾的 v1 路径（如果存在）
      baseUrl = baseUrl.endsWith("/v1") ? baseUrl.slice(0, -3) : baseUrl;
    }
    const url = baseUrl
      ? `${baseUrl}/v1/chat/completions`
      : "https://api.openai.com/v1/chat/completions";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "验证失败");
    }

    return true;
  } catch (error) {
    console.error("API密钥验证错误:", error);
    throw error;
  }
};

export const fetchOllamaModels = async (url, apiKey = "") => {
  try {
    const baseUrl = url.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error("无法连接到 Ollama 服务器");
    }

    const data = await response.json();
    if (!Array.isArray(data.models)) {
      throw new Error("无法获取模型列表");
    }

    if (data.models.length === 0) {
      throw new Error("未找到可用模型");
    }

    await setOllamaModels(data.models);
    return await getOllamaModels();
  } catch (error) {
    console.error("获取 Ollama 模型列表错误:", error);
    throw new Error(`获取模型列表失败: ${error.message}`);
  }
};

export const checkOllamaConnection = async (url, apiKey = "") => {
  try {
    // 直接使用 fetchOllamaModels 进行连接检查和模型获取
    const models = await fetchOllamaModels(url, apiKey);
    return models && Object.keys(models).length > 0;
  } catch (error) {
    console.error("Ollama 连接验证错误:", error);
    throw new Error(`Ollama 验证失败: ${error.message}`);
  }
};

export const checkLMStudioConnection = async (url, apiKey = "") => {
  try {
    const baseUrl = url.replace(/\/$/, "");

    const response = await fetch(`${baseUrl}/v1/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "无法连接到 LM Studio 服务器");
    }

    const data = await response.json();
    if (!Array.isArray(data.data)) {
      throw new Error("无效的服务器响应");
    }

    if (data.data.length === 0) {
      throw new Error("未找到可用模型");
    }

    // 保存模型列表
    await setLmstudioModels(data);

    // 进行连接测试
    const testResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: data.data[0].id,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
    });

    if (!testResponse.ok) {
      const error = await testResponse.json();
      throw new Error(error.error?.message || "API 调用测试失败");
    }

    return await getLmstudioModels();
  } catch (error) {
    console.error("LM Studio 连接验证错误:", error);
    throw new Error(`LM Studio 验证失败: ${error.message}`);
  }
};

export const checkCustomModel = async (url, apiKey, modelId) => {
  try {
    const baseUrl = url.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "连接测试失败");
    }

    return true;
  } catch (error) {
    console.error("自定义模型连接测试错误:", error);
    throw new Error(`连接测试失败: ${error.message}`);
  }
};

export const validateAllCustomModels = async (url, apiKey) => {
  try {
    const modelIds = await getCustomModelIds();

    const validationResults = await Promise.all(
      modelIds.map(async (modelId) => {
        try {
          await checkCustomModel(url, apiKey, modelId);
          return { modelId, isValid: true };
        } catch (error) {
          return { modelId, isValid: false };
        }
      })
    );

    const validModelIds = validationResults
      .filter((result) => result.isValid)
      .map((result) => result.modelId);

    const failedModels = validationResults
      .filter((result) => !result.isValid)
      .map((result) => ({
        modelId: result.modelId,
        error: "验证失败",
      }));

    // 保存有效的模型ID列表
    await setCustomModelIds(validModelIds);
    // 同时更新 customModels 存储
    await setCustomModels(validModelIds);

    return failedModels;
  } catch (error) {
    console.error("批量验证模型时出错:", error);
    throw new Error("验证失败");
  }
};
