const ConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-8 w-[95%] max-w-2xl mx-4 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          <h3 className="text-2xl font-semibold text-indigo-600">导入进行中</h3>
        </div>
        <div className="space-y-3">
          <p className="text-lg text-gray-600">
          正在导入您的书签数据，这可能需要一些时间，您可以将此界面放在后台，浏览其他页面。
          </p>
          <p className="text-base text-gray-500">
            请保持浏览器保持在打开状态，等待导入完成后点击知道了。
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-sm rounded transition-colors bg-indigo-5000 hover:bg-indigo-700 
              text-gray-500 border border-gray-200"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export { ConfirmModal };
