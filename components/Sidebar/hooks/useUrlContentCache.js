import { useRef, useCallback } from "react";
import { fetchUrlContent } from "../utils/chat";

// 创建缓存结构
const createCacheItem = (content, summary = null) => ({
  content,
  summary,
  timestamp: Date.now(),
});

export const useUrlContentCache = () => {
  const contentCacheRef = useRef(new Map());
  const loadingStateRef = useRef(new Map());
  const abortControllersRef = useRef(new Map());

  const getCachedContent = useCallback((url) => {
    return contentCacheRef.current.get(url);
  }, []);

  const getLoadingState = useCallback((url) => {
    return loadingStateRef.current.get(url) || false;
  }, []);

  const cacheContent = useCallback(async (url, content) => {
    if (abortControllersRef.current.has(url)) {
      abortControllersRef.current.get(url).abort();
    }

    const controller = new AbortController();
    abortControllersRef.current.set(url, controller);

    loadingStateRef.current.set(url, true);

    try {
      contentCacheRef.current.set(url, createCacheItem(content));

      const summary = await fetchUrlContent(content);

      contentCacheRef.current.set(url, createCacheItem(content, summary));

      return summary;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("请求被取消:", url);
      } else {
        console.error("获取摘要失败:", error);
      }
      throw error;
    } finally {
      loadingStateRef.current.set(url, false);
      abortControllersRef.current.delete(url);
    }
  }, []);

  const clearCache = useCallback((url) => {
    contentCacheRef.current.delete(url);
    loadingStateRef.current.delete(url);

    if (abortControllersRef.current.has(url)) {
      abortControllersRef.current.get(url).abort();
      abortControllersRef.current.delete(url);
    }
  }, []);

  const clearAllCache = useCallback(() => {
    contentCacheRef.current.clear();
    loadingStateRef.current.clear();

    Array.from(abortControllersRef.current.values()).forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
  }, []);

  return {
    getCachedContent,
    getLoadingState,
    cacheContent,
    clearCache,
    clearAllCache,
  };
};
