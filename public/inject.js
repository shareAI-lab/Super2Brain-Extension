const loadingButtonContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="memfree-loader animate-spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;

(function () {
  // 确保 DOM 已完全加载
  const initializeExtension = () => {
    if (window._sidebarInjected) return;
    window._sidebarInjected = true;

    if (
      typeof Readability === "undefined" ||
      typeof TurndownService === "undefined"
    ) {
      console.error("必要的依赖未加载");
      return;
    }
    if (!document.body) {
      console.error("DOM 未完全加载");
      return;
    }

    window.addEventListener("message", function (event) {
      if (event.data.type === "SIDEBAR_ACTION") {
        chrome.runtime.sendMessage({ action: "openSidebar" });
      }
    });

    window.openSuperBrainSidebar = function () {
      window.postMessage({ type: "SIDEBAR_ACTION" }, "*");
    };

    if (document.getElementById("send-url-button")) return;

    const button = document.createElement("button");
    button.id = "send-url-button";
    button.className = "flot-btn";

    button.disabled = false;

    const svgButtonContent = `

  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 50px; height: 50px;">
    <style type="text/css">
      .st0{fill:#1E8BCA;}
      .st1{fill:#FFFFFF;}
    </style>
    <path class="st0" d="M9.8,9.3c0,0-1.7-2.7,1.1-5.2c2.5-2.4,6.2-0.4,7,0.1C17.9,4.2,11.4,4.2,9.8,9.3z"/>
    <path class="st0" d="M18.5,11.5c-1.9,0-6.4,0.2-8-0.4c-1.7-0.7-2.6-2.2-2.6-3.9c0-1.6,0.8-3.1,2.2-4.3 C4.9,4,0.9,7.6,0.9,12.4c0,2.9,1.1,4.9,2.9,6.6H0.7c0,0,2,3.6,11.7,3.6h5.4c5.8,0,6-0.7,6-4.8C23.7,14.6,22.9,11.5,18.5,11.5z"/>
    <circle class="st1" cx="18.3" cy="17.7" r="1.3"/>
  </svg>
`;

    button.innerHTML = svgButtonContent;

    button.addEventListener("mousedown", function (e) {
      e.preventDefault();

      let startY = e.clientY - button.offsetTop;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      function onMouseMove(e) {
        let newTop = e.clientY - startY;

        newTop = Math.min(
          Math.max(0, newTop),
          window.innerHeight - button.offsetHeight
        );

        button.style.top = newTop + "px";
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }
    });

    button.onclick = function (e) {
      const floatingIcon = e.target.closest(".floating-icon");
      if (floatingIcon) {
        const originalContent = floatingIcon.innerHTML;
        floatingIcon.innerHTML = loadingButtonContent;

        processContent().finally(() => {
          setTimeout(() => {
            floatingIcon.innerHTML = originalContent;
          }, 2000);
        });
      } else {
        chrome.runtime.sendMessage({ action: "openSidebar" });
      }
    };

    document.body.appendChild(button);

    const alertContainer = document.createElement("div");
    alertContainer.id = "custom-alert-container";
    alertContainer.innerHTML = `
      <div id="custom-alert">
        <div id="custom-alert-content">
          <p id="custom-alert-message"></p>
          <button id="custom-alert-ok" style="background-color: rgb(99, 102, 241); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(alertContainer);

    function showAlert(message) {
      const alertContainer = document.getElementById("custom-alert-container");
      const alertMessage = document.getElementById("custom-alert-message");
      alertMessage.innerHTML = message;
      alertContainer.style.display = "flex";

      const alertOkButton = document.getElementById("custom-alert-ok");
      alertOkButton.onclick = function () {
        alertContainer.style.display = "none";
      };
    }

    function updateButtonStyle(button) {
      if (button.disabled) {
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
      } else {
        button.style.opacity = "1";
        button.style.cursor = "pointer";
      }
    }

    async function processContent() {
      try {
        button.disabled = true;

        const markdown = await extractMarkdown(window.location.href);

        if (!markdown || markdown.trim().length === 0) {
          showAlert(
            "无法读取该网页内容<br>原因：<br>• 页面未加载完成<br>• 网页限制"
          );
          return;
        }

        const taskListResult = await new Promise((resolve) => {
          chrome.storage.local.get(["taskList"], resolve);
        });

        const taskList = taskListResult.taskList || [];
        const currentUrl = window.location.href;

        if (taskList.some((task) => task.url === currentUrl)) {
          showAlert("该网页已导入成功，请勿重复导入！");
          return;
        }

        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: "sendURL",
              data: {
                url: currentUrl,
                markdown: markdown,
                title: document.title,
              },
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(response);
              }
            }
          );
        });

        if (response?.ok) {
          showAlert("导入成功，该网页已加入任务队列！");
        } else {
          throw new Error("发送失败");
        }
      } catch (error) {
        console.error("Error processing page:", error);
        showAlert(
          "内容提取失败：<br>• 请检查网络连接<br>• 页面可能没有可提取的内容<br>• 页面可能受到访问限制"
        );
      } finally {
        button.innerHTML = svgButtonContent;
        button.disabled = false;
      }
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "SAVE_CONTENT") {
        processContent();
        return true;
      }
    });

    const updateFloatingDirection = () => {
      const button = document.querySelector(".flot-btn");
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const topSpace = buttonRect.top;
      const threshold = 100;

      button.classList.toggle("float-down", topSpace < threshold);
      button.classList.toggle("float-up", topSpace >= threshold);
    };

    updateFloatingDirection();

    ["scroll", "resize"].forEach((event) =>
      window.addEventListener(event, updateFloatingDirection)
    );
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    initializeExtension();
  } else {
    // 否则等待 DOM 加载完成
    document.addEventListener("DOMContentLoaded", initializeExtension);
  }
})();

async function extractMarkdown(baseUrl) {
  try {
    if (
      typeof Readability === "undefined" ||
      typeof TurndownService === "undefined"
    ) {
      throw new Error("必要的依赖未加载");
    }

    const turndownService = new TurndownService();
    const rules = [
      {
        name: "truncate-svg",
        filter: "svg",
        replacement: () => "",
      },
      {
        name: "header",
        filter: ["h1", "h2", "h3"],
        replacement: (content, node) => {
          const h1s = document.getElementsByTagName("h1");
          const h2s = document.getElementsByTagName("h2");
          const h3s = document.getElementsByTagName("h3");

          if (h1s.length > 0 && node.tagName === "H1") {
            return `# ${content}\n\n`;
          } else if (
            h1s.length === 0 &&
            h2s.length > 0 &&
            node.tagName === "H2"
          ) {
            return `# ${content}\n\n`;
          } else if (
            h1s.length === 0 &&
            h2s.length === 0 &&
            node.tagName === "H3"
          ) {
            return `# ${content}\n\n`;
          }
          return `${content}\n\n`;
        },
      },
      {
        name: "absolute-image-paths",
        filter: "img",
        replacement: (content, node) => {
          const src = node.getAttribute("src");
          if (src) {
            const absoluteSrc = new URL(src, baseUrl).href;
            return `![${node.getAttribute("alt") || ""}](${absoluteSrc})`;
          }
          return "";
        },
      },
    ];

    rules.forEach((rule) => turndownService.addRule(rule.name, rule));

    const reader = new Readability(document.cloneNode(true), {
      charThreshold: 0,
      keepClasses: true,
      nbTopCandidates: 10,
    });
    const article = reader.parse();
    if (!article || !article.content) {
      throw new Error("无法解析页面内容");
    }

    const markdown = turndownService.turndown(article.content);
    if (!markdown.trim()) {
      throw new Error("提取的内容为空");
    }

    return markdown;
  } catch (error) {
    console.error("Markdown 提取失败:", error);
    throw new Error(`提取失败: ${error.message}`);
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }
  const user = event.data.user;
  const hostname = window.location.hostname;
  if (user && (hostname === "localhost" || hostname === "x.super2brain.com")) {
    chrome.storage.local.set({ user }, () => {});
  }
});

function getUserInput() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["Super2BrainToken"], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.Super2BrainToken);
      }
    });
  });
}
