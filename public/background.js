import {
  keepAlive,
  splitArrayIntoChunks,
  processSelectedBookmarks,
  fetchPageContent,
  sendToBackend,
  captureVisibleTab,
  captureFullPage,
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
        const endpoint = "https://s2bapi.zima.pet/common/tasks/content-note";

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
  if (message.type === "OPEN_MINDMAP") {
    chrome.tabs.create({
      url:
        chrome.runtime.getURL("mindmap.html") +
        `?prompt=${encodeURIComponent(message.payload.prompt)}` +
        `&url=${encodeURIComponent(message.payload.url)}` +
        `&title=${encodeURIComponent(message.payload.title)}`,
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_MIND_MAP") {
    chrome.sidePanel.open({ windowId: sender.tab.windowId });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CAPTURE_SCREENSHOT") {
    captureVisibleTab()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道打开
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CAPTURE_SELECTED_AREA") {
    (async () => {
      try {
        const tab = sender.tab;
        const { x, y, width, height, devicePixelRatio } = request.payload;

        // 捕获整个可见区域
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
          format: "png",
        });

        // 创建离屏 canvas
        const offscreenCanvas = new OffscreenCanvas(
          width * devicePixelRatio,
          height * devicePixelRatio
        );
        const ctx = offscreenCanvas.getContext("2d");

        // 创建位图
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        // 裁剪指定区域
        ctx.drawImage(
          bitmap,
          x * devicePixelRatio,
          y * devicePixelRatio,
          width * devicePixelRatio,
          height * devicePixelRatio,
          0,
          0,
          width * devicePixelRatio,
          height * devicePixelRatio
        );

        // 转换为 blob
        const croppedBlob = await offscreenCanvas.convertToBlob({
          type: "image/png",
        });

        // 转换为 base64
        const reader = new FileReader();
        reader.readAsDataURL(croppedBlob);
        reader.onloadend = () => {
          // 发送消息给 content script
          chrome.tabs.sendMessage(tab.id, {
            type: "SCREENSHOT_CAPTURED",
            payload: {
              dataUrl: reader.result,
            },
          });
        };
      } catch (error) {
        console.error("截图失败:", error);
      }
    })();
    return true;
  }
});

async function extractPageContent(url) {
  try {
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
      console.log("不支持获取插件页面内容:", url);
      return { url, content: "" };
    }

    console.log("正在创建新标签页:", url);
    const tab = await chrome.tabs.create({ 
      url, 
      active: false 
    });
    console.log("标签页已创建:", tab.id);

    // 创建一个超时 Promise
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("页面加载超时(30秒)")), 30000);
    });

    // 等待页面加载完成的 Promise
    const pageLoad = new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          console.log("页面加载完成:", tab.id);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    try {
      // 使用 Promise.race 竞争加载和超时
      await Promise.race([pageLoad, timeout]);
      
      // 确保页面完全加载后再执行脚本
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("开始执行内容提取:", tab.id);
      const content = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            const turndownService = new TurndownService();
            const reader = new Readability(document.cloneNode(true), {
              charThreshold: 0,
              keepClasses: true,
              nbTopCandidates: 10,
            });
            const article = reader.parse();
            return turndownService.turndown(article?.content || "");
          } catch (error) {
            console.error("Content extraction error:", error);
            return "";
          }
        },
      });

      return { url, content: content[0]?.result || "" };
    } catch (error) {
      console.error(`页面处理失败: ${error.message}`);
      return { url, content: "" };
    } finally {
      // 无论成功还是失败，都确保关闭标签页
      console.log("准备关闭标签页:", tab.id);
      await chrome.tabs.remove(tab.id);
    }
  } catch (error) {
    console.error("提取页面内容时出错:", error, "URL:", url);
    return { url, content: "" };
  }
}

async function extractMultiplePages(urls) {
  try {
    // 并行处理所有URL
    const results = await Promise.all(
      urls.map((url) => extractPageContent(url))
    );

    // 过滤掉空内容的结果
    return results.filter((result) => result.content);
  } catch (error) {
    console.error("批量提取内容时出错:", error);
    return [];
  }
}

// 监听来自 sidepanel 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractMultipleContents") {
    extractMultiplePages(message.urls)
      .then((contents) => sendResponse({ success: true, contents }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // 表示会异步发送响应
  }
});
