import { RefreshCw, Bell } from "lucide-react";

const Notification = () => {
  const notifications = [
    {
      type: "update",
      title: "系统更新提醒",
      content: "新版本已发布，点击查看更新内容",
      time: "2024-03-20",
    },
    {
      type: "notification",
      title: "消息通知",
      content: "您有新的未读消息",
      time: "2024-03-19",
    },
    {
      type: "update",
      title: "系统更新提醒",
      content: "新版本已发布，点击查看更新内容",
      time: "2024-03-20",
    },
  ];

  const renderNotificationCard = ({ type, title, content, time }) => (
    <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`p-2.5 rounded-full ${
            type === "update" ? "bg-blue-100" : "bg-green-100"
          }`}
        >
          {type === "update" ? (
            <RefreshCw className="w-5 h-5 text-blue-600" />
          ) : (
            <Bell className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="font-medium text-gray-800">{title}</div>
      </div>
      <div className="text-sm text-gray-600 mb-3">{content}</div>
      <div className="text-xs text-gray-400">{time}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 mt-4">
      <div className="flex flex-col gap-3">
        {notifications.map((notification, index) => (
          <div key={index}>{renderNotificationCard(notification)}</div>
        ))}
      </div>
    </div>
  );
};

export { Notification };
