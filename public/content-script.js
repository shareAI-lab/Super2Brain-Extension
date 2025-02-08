let isInitialized = false;

async function initializeContentScript() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    await ensureDependencies();
    const markdown = await extractMarkdown(window.location.href);
    chrome.runtime.sendMessage({
      type: "MARKDOWN_CONTENT",
      payload: markdown,
    });
  } catch (error) {
    console.error("❌ 初始化失败:", error);
  }

  // URL 变化监听
  const observer = new MutationObserver(async () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      try {
        const markdown = await extractMarkdown(location.href);
        chrome.runtime.sendMessage({
          type: "MARKDOWN_CONTENT",
          payload: markdown,
        });
      } catch (error) {
        console.error("❌ 新页面提取失败:", error);
      }
    }
  });

  let lastUrl = location.href;
  observer.observe(document, { subtree: true, childList: true });

  chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
      if (message.type === "CHECK_READY") {
        sendResponse({ ready: true });
        return false;
      }

      if (message.type === "PING") {
        sendResponse({ status: "ok" });
        return false;
      }

      if (message.type === "GET_MARKDOWN") {
        try {
          await ensureDependencies();

          const markdown = await extractMarkdown(
            message.url || window.location.href
          );
          chrome.runtime.sendMessage({
            type: "MARKDOWN_CONTENT",
            payload: markdown,
          });

          sendResponse({ status: "success" });
        } catch (error) {
          console.error("处理内容失败:", error);
          sendResponse({ status: "error", error: error.message });
        }
        return true;
      }
    }
  );
}

// 注入脚本的辅助函数
function injectScript(scriptPath) {
  const script = document.createElement("script");
  script.src = scriptPath;
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// 确保依赖加载的函数
async function ensureDependencies() {
  if (
    typeof TurndownService === "undefined" ||
    typeof Readability === "undefined"
  ) {
    await injectDependencies();
  }
}

// 初始化
initializeContentScript();

// 修改 extractMarkdown 函数以支持外部 URL
async function extractMarkdown(url) {
  try {
    let documentToProcess;

    // 这是正确的逻辑：
    if (url === window.location.href) {
      // 如果是当前页面，直接使用当前 document
      documentToProcess = document.cloneNode(true);
    } else {
      // 如果是其他页面，需要 fetch 获取内容
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      documentToProcess = parser.parseFromString(html, "text/html");
    }

    // 获取页面基础信息
    const pageContent = {
      title: documentToProcess.title || "无标题",
      url: url,
      metaDescription:
        documentToProcess.querySelector('meta[name="description"]')?.content ||
        "",
    };

    // 使用 Readability 解析主要内容
    const reader = new Readability(documentToProcess, {
      charThreshold: 0,
      keepClasses: false,
      nbTopCandidates: 5,
    });

    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("无法提取页面内容");
    }

    // 配置 Turndown
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    // 转换为 Markdown
    let markdown = turndownService.turndown(article.content);

    // 构建元数据
    const metadata = [
      `# ${pageContent.title}`,
      "",
      pageContent.metaDescription ? `> ${pageContent.metaDescription}` : "",
      "",
      `原文链接: ${pageContent.url}`,
      "",
      "---",
      "",
    ]
      .filter(Boolean)
      .join("\n");

    return metadata + markdown;
  } catch (error) {
    console.error("提取 Markdown 失败:", error);
    return `提取内容失败: ${error.message}\n\n页面 URL: ${url}`;
  }
}

// 添加依赖注入函数
async function injectDependencies() {
  const dependencies = {
    turndown: "https://unpkg.com/turndown/dist/turndown.js",
    readability: "https://unpkg.com/@mozilla/readability/readability.js",
  };

  for (const [name, url] of Object.entries(dependencies)) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`加载 ${name} 失败`));
      document.head.appendChild(script);
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
}

function createScreenshotUI() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999999;
    cursor: crosshair;
  `;

  const selection = document.createElement("div");
  selection.style.cssText = `
    position: fixed;
    border: 2px solid #1890ff;
    background: rgba(24, 144, 255, 0.1);
    display: none;
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    position: absolute;
    bottom: -40px;
    right: 0;
    display: none;
    gap: 8px;
  `;

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "取消";
  cancelButton.style.cssText = `
    padding: 4px 12px;
    background: #ffffff;
    color: #666;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 4px;
  `;

  const confirmButton = document.createElement("button");
  confirmButton.textContent = "确定";
  confirmButton.style.cssText = `
    padding: 4px 12px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(confirmButton);
  selection.appendChild(buttonContainer);
  overlay.appendChild(selection);

  let startX,
    startY,
    isDrawing = false;

  overlay.addEventListener("mousedown", (e) => {
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.display = "block";
    buttonContainer.style.display = "none";
    selection.style.left = `${startX}px`;
    selection.style.top = `${startY}px`;
  });

  overlay.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = currentX - startX;
    const height = currentY - startY;

    selection.style.width = `${Math.abs(width)}px`;
    selection.style.height = `${Math.abs(height)}px`;
    selection.style.left = `${width > 0 ? startX : currentX}px`;
    selection.style.top = `${height > 0 ? startY : currentY}px`;
  });

  overlay.addEventListener("mouseup", () => {
    isDrawing = false;
    buttonContainer.style.display = "flex";
  });

  // 确认按钮点击事件
  confirmButton.addEventListener("click", async () => {
    const rect = selection.getBoundingClientRect();
    chrome.runtime.sendMessage({
      type: "CAPTURE_SELECTED_AREA",
      payload: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        devicePixelRatio: window.devicePixelRatio,
      },
    });
    document.body.removeChild(overlay);
  });

  // 取消按钮点击事件
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  // 防止按钮点击事件冒泡到 overlay
  buttonContainer.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

  document.body.appendChild(overlay);
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "START_SCREENSHOT") {
    createScreenshotUI();
  }
  // 添加截图完成的消息处理
  if (request.type === "SCREENSHOT_CAPTURED") {
    // 将消息转发到 sidebar
    chrome.runtime.sendMessage({
      type: "SCREENSHOT_CAPTURED",
      payload: request.payload,
    });
  }
});
