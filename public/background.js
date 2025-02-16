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
  setLastUpdateCheck,
  getLastUpdateCheck,
  setVersion,
} from "./storage.js";

// 合并后的安装事件监听器
chrome.runtime.onInstalled.addListener(async function (details) {
  if (details.reason === "install" || details.reason === "update") {
    // 处理欢迎页面和版本更新
    if (details.reason === "install") {
      chrome.tabs.create({
        url: chrome.runtime.getURL("welcome.html"),
        active: true,
      });
    }

    const manifest = chrome.runtime.getManifest();
    await setLastUpdateCheck(new Date().getTime());
    await setVersion(manifest.version);
  }
});

async function initializeStorage() {
  await setItem("successCount", 0);
  await setItem("failedCount", 0);
  await setItem("progress", 0);
  await setItem("hasError", false);
  await setItem("pageTitles", []);
  await setItem("taskList", []);
}

chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
});

async function processChunks(chunks, token) {
  const MAX_CONCURRENT = 5;
  const totalUrls = chunks.flat();
  let successCount = 0;
  let failedCount = 0;
  let processedCount = 0;

  const processQueue = async (urls, activePromises = new Set()) => {
    if (urls.length === 0 && activePromises.size === 0) {
      return;
    }

    while (activePromises.size < MAX_CONCURRENT && urls.length > 0) {
      const item = urls.shift();
      const url = typeof item === "object" ? item.url : item;

      const promise = (async () => {
        try {
          // 检查URL是否已经存在
          const taskList = (await getItem("taskList")) || [];
          const isUrlExists = taskList.some((task) => task.url === url);

          if (isUrlExists) {
            console.log(`URL已存在，跳过处理: ${url}`);
            processedCount++;
            return;
          }

          const pageData = await fetchPageContent(url);
          const result = await sendToBackend({ ...pageData, url }, token);

          const newTask = {
            url,
            title: pageData.title,
            status: result.data.status,
            taskId: result.data.task_id,
            createdAt: new Date().toISOString(),
          };

          const existingTitles = await getItem("pageTitles");

          await Promise.all([
            setItem("taskList", [newTask, ...(taskList || [])]),
            setItem("pageTitles", [...(existingTitles || []), pageData.title]),
          ]);

          successCount++;
          await setItem("successCount", successCount);
        } catch (error) {
          console.error(`处理 URL 失败: ${url}`, error);
          failedCount++;
          await setItem("failedCount", failedCount);
        } finally {
          processedCount++;
          const progress = Math.round(
            (processedCount / totalUrls.length) * 100
          );
          await setItem("progress", progress);
          activePromises.delete(promise);
        }
      })();

      activePromises.add(promise);
    }

    if (activePromises.size > 0) {
      await Promise.race(activePromises);
      // 递归处理队列
      await processQueue(urls, activePromises);
    }
  };

  try {
    await processQueue(totalUrls);
  } finally {
    await Promise.all([
      setItem("successCount", successCount),
      setItem("failedCount", failedCount),
      setItem("isProcessing", false),
    ]);

    chrome.runtime.sendMessage({
      type: "BOOKMARKS_PROCESS_COMPLETE",
      payload: { successCount, failedCount },
    });
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
    Promise.resolve().then(async () => {
      try {
        const token = await getUserInput();
        const { url, markdown, title } = message.data;

        await keepAlive(true);
        const endpoint = `https://s2bapi.zima.pet/common/tasks/content-note`;

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
    });
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
    return true;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CAPTURE_SELECTED_AREA") {
    (async () => {
      try {
        const tab = sender.tab;
        const { x, y, width, height, devicePixelRatio } = request.payload;

        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
          format: "png",
        });

        const offscreenCanvas = new OffscreenCanvas(
          width * devicePixelRatio,
          height * devicePixelRatio
        );
        const ctx = offscreenCanvas.getContext("2d");

        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

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

        const croppedBlob = await offscreenCanvas.convertToBlob({
          type: "image/png",
        });

        const reader = new FileReader();
        reader.readAsDataURL(croppedBlob);
        reader.onloadend = () => {
          chrome.tabs.sendMessage(tab.id, {
            type: "SCREENSHOT_CAPTURED",
            payload: {
              dataUrl: reader.result,
            },
          });

          chrome.runtime.sendMessage({
            type: "SCREENSHOT_CAPTURED",
            payload: {
              dataUrl: reader.result,
            },
          });
        };

        sendResponse({ success: true });
      } catch (error) {
        console.error("截图失败:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

async function extractPageContent(url) {
  try {
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
      return { url, content: "" };
    }

    const tab = await chrome.tabs.create({
      url,
      active: false,
    });

    // 创建一个超时 Promise
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("页面加载超时(30秒)")), 30000);
    });

    // 等待页面加载完成的 Promise
    const pageLoad = new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    try {
      // 使用 Promise.race 竞争加载和超时
      await Promise.race([pageLoad, timeout]);

      // 确保页面完全加载后再执行脚本
      await new Promise((resolve) => setTimeout(resolve, 1000));

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractMultipleContents") {
    extractMultiplePages(message.urls)
      .then((contents) => sendResponse({ success: true, contents }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

function compareVersions(v1, v2) {
  const v1Parts = v1.split(".").map(Number);
  const v2Parts = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  return 0;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkUpdate") {
    (async () => {
      const lastUpdateCheck = await getLastUpdateCheck();
      const now = new Date().getTime();
      if (now - lastUpdateCheck < 24 * 60 * 60 * 1000) {
        sendResponse({
          updateAvailable: false,
        });
      } else {
        await setLastUpdateCheck(now);
      }
      try {
        const currentVersion = chrome.runtime.getManifest().version;
        const response = await fetch(
          "https://extension-update.oss-cn-beijing.aliyuncs.com/version.json"
        );

        if (!response.ok) {
          throw new Error("获取版本信息失败");
        }

        const data = await response.json();
        const hasUpdate = compareVersions(data.version, currentVersion) > 0;

        sendResponse({
          updateAvailable: hasUpdate,
          version: data.version,
          currentVersion,
          releaseNotes: data.releaseNotes,
          fixNotes: data.fixNotes,
          choremUpdateUrl: data.choremUpdateUrl,
          edgeUpdateUrl: data.edgeUpdateUrl,
          updateDocs: data.updateDocs,
        });
      } catch (error) {
        console.error("检查更新失败:", error);
        sendResponse({
          updateAvailable: false,
          error: error.message,
        });
      }
    })();
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshAllTabs") {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({});

        const refreshableTabs = tabs.filter(
          (tab) =>
            !tab.url.startsWith("chrome://") &&
            !tab.url.startsWith("chrome-extension://") &&
            !tab.url.startsWith("edge://") &&
            !tab.url.startsWith("about:") &&
            !tab.url.startsWith("https://www.zima.pet/")
        );

        await Promise.all(
          refreshableTabs.map((tab) =>
            chrome.tabs.reload(tab.id, { bypassCache: message.bypassCache })
          )
        );

        sendResponse({
          success: true,
          refreshedCount: refreshableTabs.length,
        });
      } catch (error) {
        console.error("刷新标签页时出错:", error);
        sendResponse({
          success: false,
          error: error.message,
        });
      }
    })();
    return true;
  }
});
