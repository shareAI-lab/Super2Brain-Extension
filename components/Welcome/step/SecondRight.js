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
import { resetCounts } from "../../../public/storage";

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

export default function SecondRight() {
  const [bookmarkTree, setBookmarkTree] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // 收集所有节点的 ID 以实现完全展开
        const getAllNodeIds = (nodes) => {
          return nodes.reduce((ids, node) => {
            const childIds = node.children ? getAllNodeIds(node.children) : [];
            return [...ids, node.value, ...childIds];
          }, []);
        };

        setExpandedNodes(getAllNodeIds(formattedTree));
        setIsLoading(false);
      });
    } catch (err) {
      setError("获取书签失败");
      setIsLoading(false);
    }
  }, []);

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

  const handleSync = async () => {
    if (!selectedNodes.length) return;

    setIsLoading(true);
    try {
      await chrome.storage.local.set({ isProcessing: true });
      resetCounts();

      const selectedItems = {
        folders: selectedNodes.filter((id) =>
          bookmarkTree.some((n) => n.value === id && n.children)
        ),
        bookmarks: selectedNodes.filter(
          (id) => !bookmarkTree.some((n) => n.value === id && n.children)
        ),
      };

      await syncSelectedBookmarks(selectedItems);
      alert(
        `成功导入 ${selectedItems.bookmarks.length} 个书签，请勿关闭浏览器`
      );

      setBookmarkTree([]);
      setSelectedNodes([]);
      setExpandedNodes([]);
    } catch (err) {
      alert("同步书签失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarkTree();
  }, [fetchBookmarkTree]);

  if (error) return <div className="text-red-500">{error}</div>;
  if (isLoading) return <div>加载中...</div>;

  return (
    <div className="w-full h-full p-4">
      <div className="h-[85vh] overflow-y-auto rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
        <CheckboxTree
          nodes={bookmarkTree}
          checked={selectedNodes}
          expanded={expandedNodes}
          icons={FONT_AWESOME_ICONS}
          onCheck={setSelectedNodes}
          onExpand={setExpandedNodes}
          noCascade={false}
          showExpandAll={true}
          className="text-gray-700"
        />
      </div>
      <button
        id="syncSelectedBookmarksButton"
        className="bg-indigo-500 text-white w-full px-4 py-3 mt-6 rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={handleSync}
        disabled={!selectedNodes.length || isLoading}
      >
        {isLoading ? "正在导入..." : "导入选中的书签"}
      </button>
    </div>
  );
}
