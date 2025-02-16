import React, { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import SecondRight from "./importModel";
import { ConfirmModal } from "../modules/confirmMoadl";

const ImportModal = ({ isOpen, onClose, onConfirm }) => {
  const [isAllSelected, setIsAllSelected] = useState(false);

  if (!isOpen) return null;

  const handleToggleAll = () => {
    setIsAllSelected(!isAllSelected);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-lg p-6 w-[90%] max-w-4xl mx-4 
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">选择要导入的书签</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="mb-2">
          <div className="ml-2 flex items-center gap-4">
            <button
              onClick={handleToggleAll}
              className="rounded bg-indigo-600 ml-2 px-4 py-2 text-sm font-semibold 
              text-white shadow-sm hover:bg-indigo-500 focus-visible:outline 
              focus-visible:outline-2 focus-visible:outline-offset-2
               focus-visible:outline-indigo-600"
            >
              {isAllSelected ? "取消全选" : "全选"}
            </button>
          </div>
          <SecondRight
            isAllSelected={isAllSelected}
            onImportSuccess={() => {
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

const SkipModal = ({ isOpen, onClose, onConfirm, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-lg p-6 w-[90%] max-w-md mx-4 
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm"
      >
        <h3 className="text-xl font-semibold mb-4">确认跳过</h3>
        <p className="text-gray-600 mb-6">
          跳过导入步骤将无法使用书签相关的智能功能，确定要跳过吗？
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onContinue}
            className="px-4 py-2 text-sm rounded-lg transition-colors bg-indigo-600 
            text-white hover:bg-indigo-500"
          >
            继续导入
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg transition-colors bg-gray-200 
            text-gray-600 hover:bg-gray-300"
          >
            确认跳过
          </button>
        </div>
      </div>
    </div>
  );
};

const RefreshModal = ({ isOpen, onClose, onRefresh }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-lg p-6 w-[90%] max-w-md mx-4 
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm"
      >
        <h3 className="text-xl font-semibold mb-4">需要刷新标签页</h3>
        <p className="text-gray-600 mb-6">
          由于浏览器限制，必须刷新当前已打开的标签页才能使用 Super2Brain。
          新打开的标签页无需刷新。
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors bg-gray-200 
            text-gray-600 hover:bg-gray-300"
          >
            暂不刷新
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm rounded-lg transition-colors bg-indigo-600 
            text-white hover:bg-indigo-500"
          >
            立即刷新
          </button>
        </div>
      </div>
    </div>
  );
};

const ImportingModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div className="relative bg-white rounded-lg p-6 w-[90%] max-w-md mx-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-4">正在导入书签</h3>
        <p className="text-gray-600 mb-6">
          正在导入您的书签，请勿关闭此页面。导入完成后会自关闭
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
};

export default function Second({ onNext }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(true);
  const [isImportingModalOpen, setIsImportingModalOpen] = useState(false);

  const handleImportClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmImport = () => {
    setIsModalOpen(false);
    setIsImportingModalOpen(true);
  };

  const handleConfirmModalClose = () => {
    setIsConfirmModalOpen(false);
    onNext();
  };

  const handleRefresh = () => {
    chrome.runtime.sendMessage(
      {
        action: "refreshAllTabs",
        bypassCache: true,
      },
      (response) => {
        if (response.success) {
          setIsRefreshModalOpen(false);
        } else {
          console.error("刷新标签页失败:", response.error);
        }
      }
    );
  };

  return (
    <div>
      <div className="mb-16 pt-12">
        <h2 className="text-2xl mb-4 flex items-center gap-2">
          <span className="inline-block">🎯</span>
          第二步导入
        </h2>
        <p className="text-lg text-gray-600">
          请选择您想要导入的书签内容,我们将为您构建向量知识库
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSkipModalOpen(true)}
          className="w-fit flex items-center justify-center gap-2 px-6 py-3 text-base 
          rounded-lg transition-colors bg-gray-200 text-gray-600 hover:bg-gray-300"
        >
          跳过
        </button>
        <button
          onClick={handleImportClick}
          className="w-fit flex items-center justify-center gap-2 px-6 py-3 text-base 
          rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
        >
          开始导入
          <ArrowRight size={20} />
        </button>
      </div>

      <RefreshModal
        isOpen={isRefreshModalOpen}
        onClose={() => setIsRefreshModalOpen(false)}
        onRefresh={handleRefresh}
      />

      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmImport}
        onNext={onNext}
      />

      <SkipModal
        isOpen={isSkipModalOpen}
        onClose={() => setIsSkipModalOpen(false)}
        onConfirm={() => {
          setIsSkipModalOpen(false);
          onNext();
        }}
        onContinue={() => {
          setIsSkipModalOpen(false);
          handleImportClick();
        }}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleConfirmModalClose}
        onConfirm={handleConfirmModalClose}
      />

      <ImportingModal
        isOpen={isImportingModalOpen}
        onClose={() => setIsImportingModalOpen(false)}
      />
    </div>
  );
}
