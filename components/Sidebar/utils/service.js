import { config } from "../../config/index"

export const token = config.token;
export const baseUrl = config.baseUrl;
export const search = async (query) => {
  try {
    const response = await fetch(
      `${baseUrl}/common/notes/search/similar?limit=10`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query_text: query,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("登录已过期，请重新登录");
      }
      throw new Error("Network response was not ok");
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.msg || "请求失败");
    }
    console.log("result", result);
    return result.data;
  } catch (error) {
    console.error("Error fetching first API:", error);
    throw error;
  }
};

export const rerankNotes = async ({ query_text, notes, top_n }) => {
  try {
    const response = await fetch(`${baseUrl}/common/notes/rerank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query_text,
        notes,
        top_n,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("登录已过期，请重新登录");
      }
      throw new Error("Network response was not ok");
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.msg || "请求失败");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching second API:", error);
    throw error;
  }
};

export const searchWeb = async (query) => {
  try {
    const response = await fetch(`${baseUrl}/common/search/web`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("登录已过期，请重新登录");
      }
      throw new Error("Network response was not ok");
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.msg || "请求失败");
    }

    const searchResults =
      result.data?.choices?.[0]?.message?.tool_calls?.[1]?.search_result || [];

    // 格式化搜索结果
    const formattedResults = searchResults
      .map((item, index) => {
        const source = item.media ? `来源：${item.media}` : "";
        const title = item.title ? `标题：${item.title}` : "";
        const content = item.content ? `内容：${item.content}` : "";
        const link = item.link ? `链接：${item.link}` : "";

        return `[搜索结果 ${
          index + 1
        }]\n${title}\n${source}\n${content}\n${link}\n`;
      })
      .join("\n");

    return formattedResults;
  } catch (error) {
    console.error("Error fetching web search:", error);
    throw error;
  }
};
