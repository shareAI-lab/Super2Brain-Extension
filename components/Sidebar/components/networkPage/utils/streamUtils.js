// 创建新文件处理流式请求
export const handleStreamResponse = async (stream) => {
  const chunks = [];
  let fullContent = "";

  try {
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        chunks.push(content);
        fullContent += content;
      }
    }
    return fullContent;
  } catch (error) {
    console.error("Stream processing error:", error);
    throw error;
  }
};

export const createStreamCompletion = async (
  openai,
  { model, messages, temperature = 0.7 }
) => {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      stream: true,
      max_tokens: 1000,
    });

    return handleStreamResponse(response);
  } catch (error) {
    // 处理特定的错误状态
    if (error.status === 504) {
      throw new Error("链接超时，请检查网络连接并稍后重试");
    }
    if (error.status === 402) {
      throw new Error("账户余额不足，请充值后继续使用");
    }
    throw error;
  }
};
