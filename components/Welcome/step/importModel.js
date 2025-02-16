import React, { useEffect, useState, useCallback } from "react";
import CheckboxTree from "react-checkbox-tree";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckSquare,
  faSquare,
  faMinus,
  faChevronRight,
  faChevronDown,
  faPlusSquare,
  faMinusSquare,
  faFolder,
  faFolderOpen,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
import { getItem } from "../../../public/storage";
import { resetCounts } from "../../../public/storage";
import { Loader2 } from "lucide-react";

const FONT_AWESOME_ICONS = {
  check: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-check text-indigo-600 bg-white"
      icon={faCheckSquare}
    />
  ),
  uncheck: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-uncheck text-gray-400 bg-white"
      icon={faSquare}
    />
  ),
  halfCheck: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-half-check text-indigo-400"
      icon={faMinus}
    />
  ),
  expandClose: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-expand-close"
      icon={faChevronRight}
    />
  ),
  expandOpen: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-expand-open"
      icon={faChevronDown}
    />
  ),
  expandAll: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-expand-all"
      icon={faPlusSquare}
    />
  ),
  collapseAll: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-collapse-all"
      icon={faMinusSquare}
    />
  ),
  parentClose: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-parent-close text-gray-600"
      icon={faFolder}
    />
  ),
  parentOpen: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-parent-open text-indigo-500"
      icon={faFolderOpen}
    />
  ),
  leaf: (
    <FontAwesomeIcon
      className="rct-icon rct-icon-leaf-close text-gray-500"
      icon={faFile}
    />
  ),
};

const fadeInKeyframes = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = fadeInKeyframes;
  document.head.appendChild(style);
}

export default function SecondRight({
  isAllSelected,
  onImportSuccess,
  onNext,
}) {
  const [bookmarkTree, setBookmarkTree] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState("");
  const [resultLoading, setResultLoading] = useState(false);
  const [status, setStatus] = useState({
    success: 0,
    failed: 0,
  });
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [pageTitles, setPageTitles] = useState([]);
  const [isFinish, setIsFinish] = useState(false);
  const getAllNodeIds = useCallback((nodes) => {
    return nodes.reduce((ids, node) => {
      const childIds = node.children ? getAllNodeIds(node.children) : [];
      return [...ids, node.value, ...childIds];
    }, []);
  }, []);

  useEffect(() => {
    if (!isLoading && bookmarkTree.length > 0) {
      const allIds = getAllNodeIds(bookmarkTree);
      setSelectedNodes(isAllSelected ? allIds : []);
    }
  }, [isAllSelected, isLoading, bookmarkTree, getAllNodeIds]);

  const formatBookmarkTree = (nodes) => {
    return nodes.map((node) => ({
      value: node.id,
      label: node.title,
      children: node.children ? formatBookmarkTree(node.children) : [],
    }));
  };

  const fetchBookmarkTree = useCallback(() => {
    try {
      chrome.bookmarks.getTree((bookmarks) => {
        const formattedTree = formatBookmarkTree(bookmarks[0].children);
        setBookmarkTree(formattedTree);
        setExpandedNodes(getAllNodeIds(formattedTree));
        setIsLoading(false);
      });
    } catch (err) {
      setError("获取书签失败");
      setIsLoading(false);
    }
  }, [getAllNodeIds]);

  const syncSelectedBookmarks = async (selectedItems) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "processBookmarks",
          items: selectedItems,
        },
        (response) => {
          if (response.status !== "processing") {
            reject(new Error("处理书签时发生错误"));
          } else {
            resolve(response);
          }
        }
      );
    });
  };

  const updatePageTitles = useCallback(async () => {
    try {
      const titles = await getItem("pageTitles");
      if (Array.isArray(titles)) {
        setPageTitles(titles);
        console.log("更新标题:", titles);
      }
    } catch (error) {
      console.error("获取页面标题失败:", error);
    }
  }, []);

  const handleSync = async () => {
    if (!selectedNodes.length) return;

    setIsLoading(true);
    setTotalBookmarks(selectedNodes.length);
    setResultMessage("super2brain 已导入您的书签，正在为您构建向量数据库");

    try {
      await chrome.storage.local.set({ isProcessing: true });
      await resetCounts();
      setStatus({ success: 0, failed: 0 });

      const updateStats = async () => {
        try {
          const success = (await getItem("successCount")) || 0;
          const failed = (await getItem("failedCount")) || 0;
          setStatus({ success, failed });
        } catch (error) {
          console.error("更新状态失败:", error);
        }
      };

      const interval = setInterval(updateStats, 1000);

      const selectedItems = {
        folders: selectedNodes.filter((id) =>
          bookmarkTree.some((n) => n.value === id && n.children)
        ),
        bookmarks: selectedNodes.filter(
          (id) => !bookmarkTree.some((n) => n.value === id && n.children)
        ),
      };

      const processComplete = new Promise((resolve) => {
        const listener = (message) => {
          if (message.type === "BOOKMARKS_PROCESS_COMPLETE") {
            chrome.runtime.onMessage.removeListener(listener);
            resolve(message.payload);
          }
        };
        chrome.runtime.onMessage.addListener(listener);
      });

      await syncSelectedBookmarks(selectedItems);
      clearInterval(interval);
    } catch (err) {
      setError("同步书签失败，请重试");
    } finally {
      setIsFinish(true);
    }
  };

  useEffect(() => {
    fetchBookmarkTree();
  }, [fetchBookmarkTree]);

  useEffect(() => {
    const initPageTitles = async () => {
      await updatePageTitles();
    };

    initPageTitles();
  }, []);

  const calculateProgress = () => {
    const { success, failed } = status;
    const completedCount = success + failed;
    return totalBookmarks
      ? Math.round((completedCount / totalBookmarks) * 100)
      : 0;
  };

  if (isLoading) {
    return (
      <div>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/30" />
          <div className="relative bg-white rounded-lg p-6 w-[1200px] max-w-5xl mx-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-6">
              <Loader2 className="inline-block animate-spin mr-2" />
              正在导入书签
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              正在导入您的书签，请勿关闭此页面。导入完成后会自关闭
            </p>
            <p className="text-gray-600 mb-8 text-lg">
              super2brain 会根据您导入的书签，为您构建向量数据库。
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-green-600 bg-green-50 p-3 rounded-lg">
                <span className="font-medium">
                  成功导入: {status.success} 个书签
                </span>
              </div>
              <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-3 rounded-lg">
                <span className="font-medium">
                  导入失败: {status.failed} 个书签
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>

              <div className="text-right text-sm text-gray-600">
                {calculateProgress()}% 完成
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => window.close()}
                disabled={!isFinish}
                className={`px-4 py-2 rounded-lg text-white transition-colors
                  ${
                    isFinish
                      ? "bg-indigo-500 hover:bg-indigo-600"
                      : "bg-indigo-200 cursor-not-allowed"
                  }`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <div className="flex-1 overflow-y-auto rounded-lg p-4 bg-white max-h-[600px]">
        <CheckboxTree
          nodes={bookmarkTree}
          checked={selectedNodes}
          expanded={expandedNodes}
          icons={FONT_AWESOME_ICONS}
          onCheck={setSelectedNodes}
          onExpand={setExpandedNodes}
          noCascade={false}
          showExpandAll={true}
        />

        <div className="fixed bottom-6 right-6 z-10">
          <button
            id="syncSelectedBookmarksButton"
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-medium shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            onClick={handleSync}
            disabled={!selectedNodes.length || isLoading}
          >
            导入
          </button>
        </div>
      </div>
    </div>
  );
}
