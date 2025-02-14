import React, { useEffect, useState } from "react";
import {
  getTaskList,
  updateTaskList,
  getUserInput,
} from "../../public/storage";

const GetTaskStatus = `https://s2bapi.zima.pet/common/tasks/{task_id}`;

export default function Status() {
  const [hasError, setHasError] = useState(false);
  const [token, setToken] = useState("");
  const [taskList, setTaskList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  useEffect(() => {
    const initializeData = async () => {
      const tasks = await getTaskList();
      setTaskList(tasks);

      const result = await getUserInput();
      setToken(result);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (!token) return;

    const pollTaskStatus = async () => {
      const currentTasks = await getTaskList();
      const currentPageTasks = currentTasks.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      );
      const pendingTasks = currentPageTasks.filter(
        (task) => task.status !== "SUCCESS" && task.status !== "FAILURE"
      );

      if (pendingTasks.length === 0) {
        clearInterval(pollInterval);
        return;
      }

      const promises = pendingTasks.map((task) =>
        fetch(GetTaskStatus.replace("{task_id}", task.taskId), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((res) => res.json())
      );

      try {
        const results = await Promise.all(promises);
        const updatedTasks = currentTasks.map((task) => {
          if (task.status === "SUCCESS" || task.status === "FAILURE") {
            return task;
          }
          const updatedTask = results.find(
            (r) => r.data.task_id === task.taskId
          );
          if (updatedTask) {
            return {
              ...task,
              status: updatedTask.data.status,
            };
          }
          return task;
        });

        setTaskList(updatedTasks);
        await updateTaskList(updatedTasks);
      } catch (error) {
        setHasError(true);
        console.error("轮询出错:", error);
      }
    };

    const pollInterval = setInterval(pollTaskStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [token, currentPage, pageSize]);

  return (
    <div className="max-w-[1000px] w-full p-4">
      <div className="bg-white rounded-lg shadow-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xl text-blue-600 font-medium py-2">任务状态</p>
          <button
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            onClick={() => window.close()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {taskList.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-lg font-medium mb-3">任务列表</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      任务名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {taskList
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((task) => (
                      <tr key={task.taskId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="text-sm font-medium text-gray-800 truncate max-w-[400px]"
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(task.createdAt).toLocaleString("zh-CN")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-sm rounded-full ${
                              task.status === "SUCCESS"
                                ? "bg-blue-100 text-blue-800"
                                : task.status === "FAILURE"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {task.status === "SUCCESS"
                              ? "已完成"
                              : task.status === "FAILURE"
                              ? "失败"
                              : "处理中"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  共 {taskList.length} 条记录
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-700">
                    第 {currentPage} 页 / 共{" "}
                    {Math.ceil(taskList.length / pageSize)} 页
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(taskList.length / pageSize)
                        )
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(taskList.length / pageSize)
                    }
                    className={`px-3 py-1 rounded ${
                      currentPage >= Math.ceil(taskList.length / pageSize)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasError && (
          <div className="mt-4 text-red-500 text-sm">
            处理过程中出现错误,请重试
          </div>
        )}
      </div>
    </div>
  );
}
