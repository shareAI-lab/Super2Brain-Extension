const ConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[90%] max-w-md mx-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          <h3 className="text-xl font-semibold text-blue-600">导入进行中</h3>
        </div>
        <div className="space-y-2">
          <p className="text-gray-600">
            正在导入您的书签数据，这可能需要一些时间...
          </p>
          <p className="text-sm text-gray-500">
            请保持浏览器保持在打开状态，但是不用保持在该界面。
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-sm rounded transition-colors hover:bg-gray-100 
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
