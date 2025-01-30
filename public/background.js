import {
  keepAlive,
  splitArrayIntoChunks,
  processSelectedBookmarks,
  fetchPageContent,
  sendToBackend,
} from "./utils.js";
import {
  getItem,
  setItem,
  getUserInput,
  incrementSuccessCount,
  incrementFailedCount,
  resetCounts,
} from "./storage.js";

// 存储每个标签页的状态
const tabStates = new Map();

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    // 打开欢迎页面
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html"),
      active: true,
    });
  }
});

async function initializeStorage() {
  // 初始化计数器
  await setItem("successCount", 0);
  await setItem("failedCount", 0);
  await setItem("progress", 0);
  await setItem("hasError", false);
}

chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
});

// // 监听浏览器启动事件
// chrome.runtime.onStartup.addListener(async () => {
// 	await initializeStorage()
// })

async function processChunks(chunks, token) {
  const totalChunkNumber = chunks.length;
  let successCount = 0;
  let failedCount = 0;

  try {
    for (let i = 0; i < totalChunkNumber; i++) {
      const chunk = chunks[i];
      const urls = chunk.map((item) =>
        typeof item === "object" ? item.url : item
      );

      for (const url of urls) {
        try {
          const pageData = await fetchPageContent(url);

          const result = await sendToBackend(
            {
              ...pageData,
              url,
            },
            token
          );

          // 保存任务信息
          const newTask = {
            url,
            title: pageData.title,
            status: result.data.status,
            taskId: result.data.task_id,
            createdAt: new Date().toISOString(),
          };
          const existingTaskList = (await getItem("taskList")) || [];
          await setItem("taskList", [newTask, ...existingTaskList]);

          successCount++;
          await setItem("successCount", successCount);
        } catch (error) {
          console.error(`处理 URL 失败: ${url}`, error);
          failedCount++;
          await setItem("failedCount", failedCount);
        }
      }

      const progressPercentage = Math.round(((i + 1) / totalChunkNumber) * 100);
      await setItem("progress", progressPercentage);
    }
  } finally {
    // 只有在所有处理完成后，才设置 isProcessing 为 false
    await setItem("isProcessing", false);
  }
}

async function handleStartup() {
  try {
    const remainingChunks = await getItem("remainingChunks");
    const token = await getUserInput();
    if (!remainingChunks || !token || remainingChunks.length === 0) {
      return;
    }

    await keepAlive(true);
    await processChunks(remainingChunks, token);
  } catch (error) {
    console.error("Error during startup:", error);
  } finally {
    await keepAlive(false);
  }
}

chrome.runtime.onStartup.addListener(() => {
  handleStartup();
});

async function sendBookmarksInBatches(bookmarks, batchSize = 5) {
  try {
    const token = await getUserInput();
    if (!token) {
      throw new Error("Token not found in local storage.");
    }

    await keepAlive(true);

    const chunks = splitArrayIntoChunks(bookmarks, batchSize);
    await processChunks(chunks, token);
  } catch (error) {
    console.error("Error processing bookmarks:", error);
  } finally {
    await keepAlive(false);
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "processBookmarks") {
    sendResponse({ status: "processing" });
    (async () => {
      try {
        await keepAlive(true);
        await setItem("successCount", 0);
        await setItem("failedCount", 0);
        await setItem("progress", 0);
        await setItem("hasError", false);
        await setItem("isProcessing", true);

        // 保存新的总书签数
        const simplifiedBookmarks = await processSelectedBookmarks(
          request.items.bookmarks
        );
        await setItem("totalBookmarks", simplifiedBookmarks.length);

        await sendBookmarksInBatches(simplifiedBookmarks, 5);
      } catch (error) {
        if (
          error.message.includes("无法获取书签") ||
          error.message.includes("用户未登录")
        ) {
          await setItem("hasError", true);
        }
        console.error("Error processing bookmarks:", error);
        await setItem("isProcessing", false);
      } finally {
        await keepAlive(false);
      }
    })();
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendURL") {
    const { url, token, markdown, title } = message.data;
    (async () => {
      try {
        await keepAlive(true);
        const endpoint =
          "https://api.super2brain.com/common/tasks/content-note";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url,
            content: markdown,
            title,
          }),
        });

        const data = await response.json();

        // 保存任务信息
        const newTask = {
          url,
          title,
          status: data.data.status,
          taskId: data.data.task_id,
          createdAt: new Date().toISOString(),
        };

        const existingTaskList = (await getItem("taskList")) || [];
        await setItem("taskList", [newTask, ...existingTaskList]);

        sendResponse({ ok: true });
      } catch (error) {
        console.error("发送URL时出错:", error);
        sendResponse({ ok: false });
      } finally {
        await keepAlive(false);
      }
    })();
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "openSidebar") {
    chrome.sidePanel.setOptions({
      enabled: true,
      path: "sidepanel.html",
    });

    chrome.sidePanel.open({ windowId: sender.tab.windowId });
  }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_MINDMAP') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('mindmap.html') + 
           `?prompt=${encodeURIComponent(message.payload.prompt)}` +
           `&url=${encodeURIComponent(message.payload.url)}` +
           `&title=${encodeURIComponent(message.payload.title)}`
    });
  }
});