import { useEffect, useState } from 'react';
import { getWebSummary, setWebSummary } from '../../../public/storage';
import { fetchUrlContent } from '../utils/chat';
import { pipe } from 'lodash/fp';

export const useSummary = ({
  currentUrl,
  pageContent,
  userInput,
  webPreview,
}) => {
  const [pageSummary, setPageSummary] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [summaryCache, setSummaryCache] = useState(new Map());
  const [loadingUrls, setLoadingUrls] = useState(new Map());

  useEffect(() => {
    if (!webPreview || !userInput?.trim()) {
      return;
    }

    const shouldSkipFetch = (url, content) => {
      const isLoading = loadingUrls.get(url);
      const hasSummary = summaryCache.get(url);
      const hasNoContent = !content || !url;
      return isLoading || hasSummary || hasNoContent;
    };

    const handleExistingSummary = (url) => {
      const summary = summaryCache.get(url);
      if (summary) {
        setPageLoading(false);
        setPageSummary(summary);
        return true;
      }
      return false;
    };

    const shouldFetchSummary = pipe(
      (url, content) => ({
        shouldSkip: shouldSkipFetch(url, content),
        hasExisting: handleExistingSummary(url),
      }),
      ({ shouldSkip, hasExisting }) => !shouldSkip && !hasExisting
    );

    const fetchSummary = async (url, content) => {
      try {
        setPageLoading(true);
        setLoadingUrls((prev) => new Map(prev).set(url, true));
        const cachedSummary = await getWebSummary(url);
        
        if (cachedSummary) {
          setPageLoading(false);
          setLoadingUrls((prev) => new Map(prev).set(url, false));
          setSummaryCache((prev) => new Map(prev).set(url, cachedSummary));
          setPageSummary(cachedSummary);
          return;
        }

        const summary = await fetchUrlContent(content, userInput);
        setWebSummary(url, summary);
        setSummaryCache((prev) => new Map(prev).set(url, summary));
        setPageSummary(summary);
      } catch (error) {
        console.error('获取摘要失败:', error);
      } finally {
        if (url === currentUrl) {
          setPageLoading(false);
        }
        setLoadingUrls((prev) => new Map(prev).set(url, false));
      }
    };

    if (shouldFetchSummary(currentUrl, pageContent)) {
      fetchSummary(currentUrl, pageContent);
    } else {
      setPageLoading(loadingUrls.get(currentUrl) ?? false);
      setPageSummary(summaryCache.get(currentUrl) ?? '');
    }
  }, [currentUrl, pageContent, userInput, webPreview]);

  return {
    pageSummary,
    pageLoading,
    summaryCache,
    loadingUrls,
  };
}; 