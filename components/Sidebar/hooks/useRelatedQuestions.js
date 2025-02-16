import { useCallback, useState } from "react";
import { config } from "../../config/index";
import { getUserInput } from "../../../public/storage";

const buildSystemMessage = () => {
  return {
    role: "system",
    content: `
        根据用户输入的文章，生成三个相关问题，生成三个问题, 要求：
        1. 问题要对原问题进行深入探讨
        2. 寻求更多相关细节
        3. 问题要尽量的简短有意义，不超过15个字体

        请直接返回3个问题，每个问题占一行。`,
  };
};

const fetchRelatedQuestions = async (content) => {
  const userInput = await getUserInput();
  if (!userInput.trim()) return;

  if (content.trim() === "") return;

  const response = await fetch(`${config.baseUrl}/text/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userInput}`,
    },
    body: JSON.stringify({
      messages: [buildSystemMessage(), { role: "user", content }],
      model: "gpt-4o-mini",
      stream: true,
    }),
  });

  if (!response.ok) throw new Error('请求失败');
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            fullContent += content;
          } catch (e) {
            console.error('解析数据失败:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent
    .split('\n')
    .map(q => q.trim())
    .filter(q => q.length > 0);
};

export const useRelatedQuestions = ({
  content = "",
  currentUrl,
  activatePage,
}) => {
  const [relatedQuestions, setRelatedQuestions] = useState(new Map());
  const [currentUrlLoading, setCurrentUrlLoading] = useState(false);
  const [currentUrlRelatedQuestions, setCurrentUrlRelatedQuestions] = useState(
    []
  );

  const fetchQuestions = useCallback(async () => {
    setCurrentUrlLoading(true);

    if (activatePage !== 1) {
      setCurrentUrlLoading(false);
      return;
    }

    if (!content?.trim()) {
      setCurrentUrlLoading(false);
      return;
    }

    if (relatedQuestions.has(currentUrl)) {
      setCurrentUrlRelatedQuestions(relatedQuestions.get(currentUrl));
      setCurrentUrlLoading(false);
      return;
    }

    try {
      const questions = await fetchRelatedQuestions(content);
      const validQuestions = Array.isArray(questions) ? questions : [];

      setRelatedQuestions((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentUrl, validQuestions);
        return newMap;
      });
      setCurrentUrlRelatedQuestions(validQuestions);
    } catch (error) {
      console.error("获取相关问题失败:", error);
      setCurrentUrlRelatedQuestions([]);
    } finally {
      setCurrentUrlLoading(false);
    }
  }, [content, currentUrl, relatedQuestions, activatePage]);

  return {
    relatedQuestions,
    fetchRelatedQuestions: fetchQuestions,
    currentUrlRelatedQuestions,
    currentUrlLoading,
  };
};
