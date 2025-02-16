export const keepAlive = (() => {
  let intervalId;

  return async (state) => {
    if (state && !intervalId) {
      chrome.runtime.getPlatformInfo(() => {});
      intervalId = setInterval(
        () => chrome.runtime.getPlatformInfo(() => {}),
        20000
      );
    } else if (!state && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
})();

// 处理书签的逻辑
export async function processSelectedBookmarks(ids) {
  if (!Array.isArray(ids)) {
    throw new TypeError("Expected an array of IDs");
  }

  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      const bookmarksMap = new Map();
      function traverse(nodes, parentTags = [], skipFirstLevel = true) {
        nodes.forEach((node) => {
          if (skipFirstLevel && node.children) {
            traverse(node.children, parentTags, false);
          } else if (node.children && node.children.length > 0) {
            traverse(node.children, [...parentTags, node.title], false);
          } else if (node.url) {
            bookmarksMap.set(node.id, {
              url: node.url,
              title: node.title,
              tag: parentTags.join("/"),
            });
          }
        });
      }

      traverse(tree[0].children);

      // 返回选中的书签的信息
      const selectedNodes = ids
        .map((id) => bookmarksMap.get(id))
        .filter(Boolean);

      resolve(selectedNodes);
    });
  });
}

export function splitArrayIntoChunks(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchPageContent(url) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const tab = await chrome.tabs.create({ url: url, active: false });

      const timeout = 30000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          chrome.tabs.remove(tab.id);
          reject(new Error("页面加载超时"));
        }, timeout);
      });

      const contentPromise = new Promise((resolve, reject) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === "complete") {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ["turndown.js", "readability.js"],
              },
              () => {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: tab.id },
                    function: () => {
                      return new Promise((resolve, reject) => {
                        try {
                          const turndownService = new TurndownService();
                          const reader = new Readability(
                            document.cloneNode(true)
                          );
                          const article = reader.parse();
                          const markdown = turndownService.turndown(
                            article?.content || ""
                          );
                          resolve({
                            markdown: markdown,
                            title: document.title,
                          });
                        } catch (error) {
                          reject(error);
                        }
                      });
                    },
                  },
                  async (results) => {
                    await chrome.tabs.remove(tab.id);
                    if (results && results[0]) {
                      resolve(results[0].result);
                    } else {
                      reject(new Error("提取内容失败"));
                    }
                  }
                );
              }
            );
          }
        });
      });

      return await Promise.race([contentPromise, timeoutPromise]);
    } catch (error) {
      attempt++;
      if (attempt === maxRetries) {
        throw error;
      }
      await sleep(2000 * attempt);
    }
  }
}

export async function processUrlQueue(urls, delayBetweenRequests = 1000) {
  // 确保输入是数组
  if (!Array.isArray(urls)) {
    urls = [urls];
  }

  const results = [];
  const errors = [];

  // 顺序处理每个 URL
  for (const url of urls) {
    try {
      // 在每个请求之间添加延迟
      if (results.length > 0) {
        await sleep(delayBetweenRequests);
      }

      const content = await fetchPageContent(url);
      results.push({
        url,
        content,
        success: true,
      });
    } catch (error) {
      console.error(`处理 ${url} 失败:`, error);
      errors.push({
        url,
        error: error.message,
        success: false,
      });
    }
  }

  return {
    results, // 成功处理的结果
    errors, // 失败的记录
    total: urls.length,
    successful: results.length,
    failed: errors.length,
  };
}

export async function sendToBackend(data, token) {
  const endpoint = data.isPdf
    ? "https://s2bapi.zima.pet/common/tasks/doc-note"
    : "https://s2bapi.zima.pet/common/tasks/content-note";

  const body = data.isPdf
    ? { url: data.pdfUrl, title: data.title, fileName: data.pdfUrl }
    : { url: data.url, content: data.markdown, title: data.title };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function captureVisibleTab() {
  try {
    // 获取当前激活的标签页
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // 捕获可见区域的截图
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
      quality: 100,
    });

    return {
      success: true,
      dataUrl,
      title: tab.title,
      url: tab.url,
    };
  } catch (error) {
    console.error("截图失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// 可选：如果需要完整页面截图
export async function captureFullPage() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // 注入脚本获取页面完整高度
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        return {
          width: Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
          ),
          height: Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
          ),
        };
      },
    });

    // 调整标签页大小
    await chrome.tabs.update(tab.id, { url: tab.url });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 捕获截图
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
      quality: 100,
    });

    return {
      success: true,
      dataUrl,
      title: tab.title,
      url: tab.url,
    };
  } catch (error) {
    console.error("完整页面截图失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function initializeScreenCapture() {
  try {
    // 获取屏幕媒体流
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: false,
    });

    // 创建视频元素
    const video = document.createElement("video");
    video.srcObject = stream;

    // 等待视频加载
    await new Promise((resolve) => (video.onloadedmetadata = resolve));
    await video.play();

    // 创建画布
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制视频帧
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // 停止所有轨道
    stream.getTracks().forEach((track) => track.stop());

    // 转换为图片数据
    const dataUrl = canvas.toDataURL("image/png");

    return {
      success: true,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    console.error("区域截图失败:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// 将 base64 图片数据转换为 Markdown 图片格式
export function convertToMarkdownImage(dataUrl, alt = "截图") {
  return `![${alt}](${dataUrl})`;
}
