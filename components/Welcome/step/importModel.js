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

export default function SecondRight({ isAllSelected, onImportSuccess }) {
  const [bookmarkTree, setBookmarkTree] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

      onImportSuccess?.();
    } catch (err) {
      setError("同步书签失败，请重试");
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
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <div className="flex-1 overflow-y-auto rounded-lg p-4 bg-white">
        <CheckboxTree
          nodes={bookmarkTree}
          checked={selectedNodes}
          expanded={expandedNodes}
          icons={FONT_AWESOME_ICONS}
          onCheck={setSelectedNodes}
          onExpand={setExpandedNodes}
          noCascade={false}
          showExpandAll={true}
          className="text-gray-700 text-sm"
        />
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          id="syncSelectedBookmarksButton"
          className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-medium shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          onClick={handleSync}
          disabled={!selectedNodes.length || isLoading}
        >
          {isLoading ? "正在导入..." : "导入"}
        </button>
      </div>
    </div>
  );
}
