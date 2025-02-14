export async function setItem(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("Chrome存储错误:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export async function getItem(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

export async function getUserId() {
  const user = await getItem("user");
  return user && user.id ? user.id : null;
}

export async function incrementItem(key, incrementBy = 1) {
  return getItem(key).then((currentValue) => {
    const newValue = (currentValue || 0) + incrementBy;
    return setItem(key, newValue).then(() => newValue);
  });
}

export async function saveUserInput(input) {
  return setItem("Super2BrainToken", input);
}

export async function getUserInput() {
  const token = await getItem("Super2BrainToken");
  return token;
}

export async function clearUserInput() {
  await setItem("Super2BrainToken", null);
}

export async function getTaskList() {
  const taskList = await getItem("taskList");
  return taskList || [];
}

export async function updateTaskList(taskList) {
  try {
    await setItem("taskList", taskList);

    const savedTasks = await getItem("taskList");

    return true;
  } catch (error) {
    console.error("存储任务列表时出错:", error);
    throw error;
  }
}

// 设置成功计数
export async function setSuccessCount(count) {
  return setItem("successCount", count);
}

// 设置失败计数
export async function setFailedCount(count) {
  return setItem("failedCount", count);
}

// 获取成功计数
export async function getSuccessCount() {
  return getItem("successCount") || 0;
}

// 获取失败计数
export async function getFailedCount() {
  return getItem("failedCount") || 0;
}

// 增加成功计数
export async function incrementSuccessCount() {
  const currentCount = await getSuccessCount();
  return setSuccessCount(currentCount + 1);
}

// 增加失败计数
export async function incrementFailedCount() {
  const currentCount = await getFailedCount();
  return setFailedCount(currentCount + 1);
}

// 重置计数器
export async function resetCounts() {
  await setSuccessCount(0);
  await setFailedCount(0);
}

export async function setWebPreview(webPreview) {
  return setItem("webPreview", webPreview);
}

export async function getWebPreview() {
  const webPreview = await getItem("webPreview");
  return webPreview ?? true;
}

export async function getDeepSeekApiKey() {
  const apiKey = await getItem("deepSeekApiKey");
  return apiKey || "";
}

export async function setDeepSeekApiKey(apiKey) {
  return setItem("deepSeekApiKey", apiKey);
}

export async function setClaudeApiKey(apiKey) {
  return setItem("claudeApiKey", apiKey);
}

export async function getClaudeApiKey() {
  const apiKey = await getItem("claudeApiKey");
  return apiKey || "";
}

export async function setOpenaiApiKey(apiKey) {
  return setItem("openaiApiKey", apiKey);
}

export async function getOpenaiApiKey() {
  const apiKey = await getItem("openaiApiKey");
  return apiKey || "";
}

export async function setOllamaConfig(url, apiKey) {
  return setItem("ollamaConfig", { url, apiKey });
}

export async function getOllamaConfig() {
  const config = await getItem("ollamaConfig");
  return config || {};
}

export async function setLmstudioConfig(url, apiKey) {
  return setItem("lmstudioConfig", { url, apiKey });
}

export async function getLmstudioConfig() {
  const config = await getItem("lmstudioConfig");
  return config || {};
}

export async function setOllamaModels(models) {
  const formattedModels = models.reduce((acc, model) => {
    const key = model.name;
    acc[key] = {
      id: model.name,
      provider: "ollama",
      supportsImage: false,
      details: model.details || {},
      size: model.size,
      modified_at: model.modified_at,
    };
    return acc;
  }, {});

  return setItem("ollamaModels", formattedModels);
}

export async function getOllamaModels() {
  const models = await getItem("ollamaModels");
  return models || {};
}

export async function removeOllamaModels() {
  return setItem("ollamaModels", null);
}

export async function removeDeepSeekApiKey() {
  return setItem("deepSeekApiKey", null);
}

export async function removeClaudeApiKey() {
  return setItem("claudeApiKey", null);
}

export async function removeOpenaiApiKey() {
  return setItem("openaiApiKey", null);
}

export async function removeOllamaConfig() {
  return setItem("ollamaConfig", null);
}

export async function removeLmstudioConfig() {
  return setItem("lmstudioConfig", null);
}

// 设置自定义模型列表
export async function setCustomModelIds(modelIds) {
  return setItem("customModelIds", modelIds);
}

// 获取自定义模型列表
export async function getCustomModelIds() {
  const modelIds = await getItem("customModelIds");
  return modelIds || [];
}

// 移除自定义模型列表
export async function removeCustomModelIds() {
  return setItem("customModelIds", null);
}

export async function setCustomApiKey(modelId, apiKey) {
  return setItem(`customApiKey_${modelId}`, apiKey);
}

export const setCustomConfig = async (url, apiKey) => {
  return setItem("customConfig", { url, apiKey });
};

export const getCustomConfig = async () => {
  const config = await getItem("customConfig");
  return config || {};
};

export const removeCustomConfig = async () => {
  return setItem("customConfig", null);
};

export async function setCustomModels(models) {
  const formattedModels = models.reduce((acc, modelId) => {
    acc[modelId] = {
      id: modelId,
      provider: "custom",
      supportsImage: false,
    };
    return acc;
  }, {});

  return setItem("customModels", formattedModels);
}

export async function getCustomModels() {
  const models = await getItem("customModels");
  return models || {};
}

export async function setLmstudioModels(models) {
  const formattedModels = models.data.reduce((acc, model) => {
    const key = model.id;
    acc[key] = {
      id: model.id,
      provider: "lmstudio",
      supportsImage: false,
      details: {
        object: model.object,
        owned_by: model.owned_by,
      },
    };
    return acc;
  }, {});

  return setItem("lmstudioModels", formattedModels);
}

export async function getLmstudioModels() {
  const models = await getItem("lmstudioModels");
  return models || {};
}

export async function removeLmstudioModels() {
  return setItem("lmstudioModels", null);
}

export async function setUrlLoading(url) {
  return setItem(`urlLoading-${url}`, true);
}

export async function getUrlLoading(url) {
  return getItem(`urlLoading-${url}`);
}

export async function removeUrlLoading(url) {
  return setItem(`urlLoading-${url}`, false);
}

export async function setWebSummary(url, webSummary) {
  return setItem(`webSummary-${url}`, webSummary);
}

export async function getWebSummary(url) {
  const summary = await getItem(`webSummary-${url}`);
  return summary || "";
}

export async function setWebAnalysis(url, webAnalysis) {
  return setItem(`webAnalysis-${url}`, webAnalysis);
}

export async function getWebAnalysis(url) {
  const analysis = await getItem(`webAnalysis-${url}`);
  return analysis || "";
}

export async function setLastUpdateCheck(timestamp) {
  return setItem("lastUpdateCheck", timestamp);
}

export async function getLastUpdateCheck() {
  return getItem("lastUpdateCheck");
}

export async function setLatestVersionInfo(versionInfo) {
  return setItem("latestVersionInfo", {
    version: versionInfo.version,
    downloadUrl: versionInfo.downloadUrl,
    releaseNotes: versionInfo.releaseNotes,
    publishDate: versionInfo.publishDate,
  });
}

export async function getLatestVersionInfo() {
  return {
    version: "1.0.1",
    description: "测试版本",
    releaseNotes: "测试版本",
    downloadUrl: "https://www.baidu.com",
    publishDate: "2025-02-13",
  };
}

export async function getVersion() {
  const manifest = chrome.runtime.getManifest();
  const manifestVersion = manifest.version;

  const storedVersion = await getItem("currentVersion");
  if (!storedVersion) {
    await setItem("currentVersion", manifestVersion);
    return manifestVersion;
  }

  return storedVersion;
}

export async function setVersion(version) {
  return setItem("currentVersion", version);
}

const compareVersions = (v1, v2) => {
  const normalize = (v) => v.split(".").map(Number);
  const [arr1, arr2] = [normalize(v1), normalize(v2)];

  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    const num1 = arr1[i] || 0;
    const num2 = arr2[i] || 0;
    if (num1 !== num2) return num1 - num2;
  }
  return 0;
};

export async function checkNeedsUpdate(v2) {
  const [currentVersion, lastCheck] = await Promise.all([
    getVersion(),
    getLastUpdateCheck(),
  ]);

  if (!v2 || !v2.version) return false;

  const now = Date.now();
  await setLastUpdateCheck(now);

  return compareVersions(v2.version, currentVersion) > 0;
}
