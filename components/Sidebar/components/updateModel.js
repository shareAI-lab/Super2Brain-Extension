import { Info } from "lucide-react";

const UpdateNotification = ({ isVisible, updateInfo }) => {
  if (!isVisible || updateInfo.isDismissed) return null;

  const {
    currentVersion = "",
    newVersion = "",
    releaseNotes = "",
    fixNotes = "",
    choremUpdateUrl = "",
    edgeUpdateUrl = "",
  } = updateInfo;

  const formatNotes = (notes) => {
    if (!notes) return [<li key="empty">暂无内容</li>];

    const notesList = notes.split("&").filter(Boolean);
    if (notesList.length === 0) return [<li key="empty">暂无内容</li>];

    return notesList.map((note, index) => (
      <li key={index} className="mb-1">
        {note.trim() || "暂无内容"}
      </li>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 max-w-xl w-full mx-4 shadow-2xl transform transition-all">
        <div>
          <div className="flex items-center justify-center mb-6">
            <Info className="w-16 h-16 text-indigo-500" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            发现新版本
          </h3>

          <div className="text-sm text-gray-600 mb-4">
            <span className="bg-gray-100 px-2 py-1 rounded mr-2">
              当前版本：{currentVersion || "未知"}
            </span>
            <span className="text-gray-400 mx-2">→</span>
            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
              最新版本：{newVersion || "未知"}
            </span>
          </div>

          <div className="text-left space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">更新内容：</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {formatNotes(releaseNotes)}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">修复内容：</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {formatNotes(fixNotes)}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">手动更新链接：</h4>
              <div className="space-y-2">
                {choremUpdateUrl && (
                  <div className="flex items-center">
                    <span className="text-gray-600 min-w-[70px]">Chrome: </span>
                    <a
                      href={choremUpdateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all ml-2"
                    >
                      {choremUpdateUrl}
                    </a>
                  </div>
                )}
                {edgeUpdateUrl && (
                  <div className="flex items-center">
                    <span className="text-gray-600 min-w-[70px]">Edge: </span>
                    <a
                      href={edgeUpdateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all ml-2"
                    >
                      {edgeUpdateUrl}
                    </a>
                  </div>
                )}
                {updateInfo.updateDocs && (
                  <div className="flex items-center">
                    <span className="text-gray-600 min-w-[70px]">教程: </span>
                    <a
                      href={updateInfo.updateDocs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all ml-2"
                    >
                      手动更新教程
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={updateInfo.dismissUpdate}
            >
              本次不再提醒
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { UpdateNotification };
