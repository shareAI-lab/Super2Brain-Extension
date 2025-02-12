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
        3. 问题要尽量的简短有意义

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
    }),
  });

  const data = await response.json();
  return (data?.choices?.[0]?.message?.content || "")
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);
};

export const useRelatedQuestions = ({ content = "", currentUrl }) => {
  const [relatedQuestions, setRelatedQuestions] = useState(new Map());
  const [currentUrlLoading, setCurrentUrlLoading] = useState(false);
  const [currentUrlRelatedQuestions, setCurrentUrlRelatedQuestions] = useState(
    []
  );

  const fetchQuestions = useCallback(async () => {
    setCurrentUrlLoading(true);

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
  }, [content, currentUrl, relatedQuestions]);

  return {
    relatedQuestions,
    fetchRelatedQuestions: fetchQuestions,
    currentUrlRelatedQuestions,
    currentUrlLoading,
  };
};
