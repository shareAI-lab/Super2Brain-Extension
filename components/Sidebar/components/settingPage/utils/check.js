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

export const checkOpenAiApiKey = async (apiKey) => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
