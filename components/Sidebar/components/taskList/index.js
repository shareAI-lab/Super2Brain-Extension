import React, { useEffect, useState } from "react";
import {
  getTaskList,
  updateTaskList,
  getUserInput,
} from "../../../../public/storage";
import { config } from "../../../config/index";
import { PlaceHolder } from "./modules";
const GetTaskStatus = `${config.baseUrl}mon/tasks/{task_id}`;

const useTaskPolling = (token) => {
  const [taskList, setTaskList] = useState([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      const tasks = await getTaskList();
      setTaskList(tasks);
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (!token) return;

    const pollTaskStatus = async () => {
      const currentTasks = await getTaskList();
      const pendingTasks = currentTasks.filter(
        (task) => task.status !== "SUCCESS" && task.status !== "FAILURE"
      );

      if (pendingTasks.length === 0) return;

      try {
        const results = await Promise.all(
          pendingTasks.map((task) =>
            fetch(GetTaskStatus.replace("{task_id}", task.taskId), {
              headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json())
          )
        );

        const updatedTasks = currentTasks.map((task) => {
          if (task.status === "SUCCESS" || task.status === "FAILURE")
            return task;
          const updatedTask = results.find(
            (r) => r.data.task_id === task.taskId
          );
          return updatedTask
            ? { ...task, status: updatedTask.data.status }
            : task;
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
  }, [token]);

  return { taskList, hasError };
};

const TaskList = () => {
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      const result = await getUserInput();
      setToken(result);
    };
    fetchToken();
  }, []);

  const { taskList, hasError } = useTaskPolling(token);

  const renderStatus = (status) => {
    const statusConfig = {
      SUCCESS: {
        text: "已完成",
        className: "bg-green-50 text-indigo-700 border border-indigo-200",
      },
      FAILURE: {
        text: "失败",
        className: "bg-red-50 text-red-700 border border-red-200",
      },
      default: {
        text: "处理中",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
      },
    };
    const config = statusConfig[status] || statusConfig.default;
    return (
      <span
        className={`
          px-2.5 py-0.5 text-xs font-medium rounded-full 
          transition-all duration-200 ease-in-out
          ${config.className}
        `}
      >
        {config.text}
      </span>
    );
  };

  return (
    <div className="w-full h-[calc(100vh-8px)] flex flex-col bg-white rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold p-4 pb-2 border-b border-gray-100">
        任务列表
      </h3>
      <div className="flex-1 overflow-y-auto p-4">
        {taskList.length > 0 ? (
          <div className="w-full flex flex-col gap-4">
            {taskList.map((task) => (
              <div
                key={task.taskId}
                className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out"
              >
                <div className="px-6 py-4">
                  <div className="w-full flex flex-col gap-3">
                    <div className="w-full flex items-center justify-between">
                      <div className="truncate text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {task.title}
                      </div>
                      <div className="flex-shrink-0">
                        {renderStatus(task.status)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(task.createdAt).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <PlaceHolder />
          </div>
        )}
      </div>
    </div>
  );
};

export { TaskList };
