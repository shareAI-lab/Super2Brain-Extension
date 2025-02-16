import {
  checkDeepSeekApiKey,
  checkClaudeApiKey,
  checkOpenAiApiKey,
  checkOllamaConnection,
  validateAllCustomModels,
  checkLMStudioConnection,
} from "../utils/check";
import { useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import {
  setDeepSeekApiKey,
  setClaudeApiKey,
  setOpenaiApiKey,
  setOllamaConfig,
  setLmstudioConfig,
  removeOllamaModels,
  setItem,
  setCustomModelIds,
  getCustomModelIds,
  setCustomConfig,
  setOpenAiUrl,
  getOpenAiUrl,
} from "../../../../../public/storage";
import { Tooltip } from "react-tooltip";

const MODEL_NAMES = {
  deepseek: "DeepSeek",
  claude: "Claude",
  openai: "OpenAI",
  ollama: "Ollama",
  lmstudio: "LM Studio",
  custom: "自定义模型",
};

const API_INFO = {
  deepseek: {
    description:
      "DeepSeek API 支持多种强大的AI模型，包括 DeepSeek-Coder。点击下方链接前往官网获取 API Key。",
    link: "https://platform.deepseek.com/",
  },
  claude: {
    description:
      "Claude 是 Anthropic 开发的先进AI助手，支持长文本理解和生成。访问 Anthropic 官网获取 API Key。",
    link: "https://console.anthropic.com/",
  },
  openai: {
    description:
      "OpenAI 提供包括 GPT-4、GPT-3.5 等多个AI模型。登录 OpenAI 平台创建 API Key。",
    link: "https://platform.openai.com/api-keys",
  },
  ollama: {
    description:
      "Ollama 允许您在本地运行大型语言模型。输入 Ollama 服务器的 URL 地址，API Key 为可选项。",
    link: "https://ollama.ai",
  },
  lmstudio: {
    description:
      "LM Studio 允许您在本地运行开源大语言模型。输入 LM Studio 服务器的 URL 地址，API Key 为可选项。",
    link: "https://lmstudio.ai/",
  },
  custom: {
    description:
      "添加您自己的模型配置。请提供模型的API端点、密钥和模型ID。模型ID是用于识别特定模型的唯一标识符。",
    link: "#",
  },
};

const ModelSettings = ({
  modelKey,
  settings,
  handleChange,
  modelList,
  setModelList,
}) => {
  if (!API_INFO[modelKey]) {
    console.error(`未找到模型配置信息: ${modelKey}`);
    return null;
  }

  const modelName = MODEL_NAMES[modelKey] || modelKey;

  const [verifyStatuses, setVerifyStatuses] = useState({
    deepseek: { status: null, message: "" },
    claude: { status: null, message: "" },
    openai: { status: null, message: "" },
    ollama: { status: null, message: "" },
    lmstudio: { status: null, message: "" },
    custom: { status: null, message: "" },
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [modelIdInput, setModelIdInput] = useState("");
  const [failedModels, setFailedModels] = useState([]);

  const verifyApiKey = async (apiKey, url) => {
    if (
      !settings[modelKey].url &&
      (modelKey === "ollama" ||
        modelKey === "lmstudio" ||
        modelKey === "custom")
    ) {
      setVerifyStatuses((prev) => ({
        ...prev,
        [modelKey]: {
          status: "error",
          message: `请输入${MODEL_NAMES[modelKey]}服务器地址`,
        },
      }));
      return;
    }

    if (!apiKey && !["ollama", "lmstudio"].includes(modelKey)) {
      setVerifyStatuses((prev) => ({
        ...prev,
        [modelKey]: { status: "error", message: "请输入 API Key" },
      }));
      return;
    }

    setIsVerifying(true);
    try {
      let isValid = false;
      switch (modelKey) {
        case "deepseek":
          isValid = await checkDeepSeekApiKey(apiKey);
          if (isValid) await setDeepSeekApiKey(apiKey);
          break;
        case "claude":
          isValid = await checkClaudeApiKey(apiKey);
          if (isValid) await setClaudeApiKey(apiKey);
          break;
        case "openai":
          isValid = await checkOpenAiApiKey(apiKey, settings[modelKey].url);
          if (isValid) {
            await setOpenaiApiKey(apiKey);
            if (settings[modelKey].url) {
              await setOpenAiUrl(settings[modelKey].url);
            }
          }

          break;
        case "ollama":
          isValid = await checkOllamaConnection(settings[modelKey].url, apiKey);
          if (isValid) {
            await setOllamaConfig(settings[modelKey].url, apiKey);
          }
          break;
        case "lmstudio": {
          isValid = await checkLMStudioConnection(
            settings[modelKey].url,
            apiKey
          );
          if (isValid) await setLmstudioConfig(settings[modelKey].url, apiKey);
          break;
        }
        case "custom": {
          const failedResults = await validateAllCustomModels(
            settings[modelKey].url,
            apiKey
          );
          await setCustomConfig(settings[modelKey].url, apiKey);
          setFailedModels(failedResults);
          const updatedModelIds = await getCustomModelIds();
          setModelList(updatedModelIds);
          isValid = true;

          setVerifyStatuses((prev) => ({
            ...prev,
            [modelKey]: {
              status: "success",
              message:
                failedResults.length > 0
                  ? `验证完成，${failedResults.length}个模型验证失败`
                  : "所有模型验证成功",
            },
          }));
          return;
        }
      }

      setVerifyStatuses((prev) => ({
        ...prev,
        [modelKey]: {
          status: isValid ? "success" : "error",
          message: isValid ? "验证成功" : "验证失败",
        },
      }));
    } catch (error) {
      setVerifyStatuses((prev) => ({
        ...prev,
        [modelKey]: {
          status: "error",
          message: `验证失败：${error.message}`,
        },
      }));
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyLocalModelSettings = async (type) => {
    if (!settings[type].url) {
      setVerifyStatuses((prev) => ({
        ...prev,
        [type]: {
          status: "error",
          message: `请输入${MODEL_NAMES[type]}服务器地址`,
        },
      }));
      return;
    }

    setIsVerifying(true);
    try {
      if (type === "custom") {
        const failedResults = await validateAllCustomModels(
          settings[type].url,
          settings[type].apiKey
        );

        // 更新失败模型列表
        setFailedModels(failedResults);

        // 从 storage 获取更新后的有效模型列表
        const updatedModelIds = await getCustomModelIds();
        setModelList(updatedModelIds);

        setVerifyStatuses((prev) => ({
          ...prev,
          [type]: {
            status: "success",
            message:
              failedResults.length > 0
                ? `验证完成，${failedResults.length}个模型验证失败`
                : "所有模型验证成功",
          },
        }));
      } else if (type === "lmstudio") {
        const isValid = await checkLMStudioConnection(
          settings[type].url,
          settings[type].apiKey
        );
        if (isValid) {
          await setLmstudioConfig(settings[type].url, settings[type].apiKey);
        }
        setVerifyStatuses((prev) => ({
          ...prev,
          [type]: {
            status: isValid ? "success" : "error",
            message: isValid ? "验证成功" : "验证失败",
          },
        }));
      } else if (type === "ollama") {
        const isValid = await checkOllamaConnection(
          settings[type].url,
          settings[type].apiKey
        );
        if (isValid) {
          await setOllamaConfig(settings[type].url, settings[type].apiKey);
        }
        setVerifyStatuses((prev) => ({
          ...prev,
          [type]: {
            status: isValid ? "success" : "error",
            message: isValid ? "验证成功" : "验证失败",
          },
        }));
      }
    } catch (error) {
      setVerifyStatuses((prev) => ({
        ...prev,
        [type]: {
          status: "error",
          message: `验证失败：${error.message}`,
        },
      }));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleModelIdKeyDown = async (e) => {
    if (e.isComposing || e.keyCode === 229) {
      return;
    }

    if (e.key === "Enter" && modelIdInput.trim()) {
      e.preventDefault();
      const newModelIds = [...(modelList || []), modelIdInput.trim()];
      setModelIdInput("");
      setModelList(newModelIds);
      await setCustomModelIds(newModelIds);
    }
  };

  const removeModelId = async (indexToRemove) => {
    const newModelIds = (modelList || []).filter(
      (_, index) => index !== indexToRemove
    );
    setModelList(newModelIds);
    await setCustomModelIds(newModelIds);
  };

  const handleAddModelId = async () => {
    if (modelIdInput.trim()) {
      const newModelIds = [...(modelList || []), modelIdInput.trim()];
      setModelIdInput("");
      setModelList(newModelIds);
      await setCustomModelIds(newModelIds);
    }
  };

  if (modelKey === "ollama" || modelKey === "lmstudio") {
    return (
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100">
        <div className="flex items-center mb-4 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="text-indigo-600 text-sm font-bold">
                {MODEL_NAMES[modelKey].charAt(0)}
              </span>
            </div>
            {MODEL_NAMES[modelKey]} 配置
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {API_INFO[modelKey].description}
            <a
              href={API_INFO[modelKey].link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500 ml-2 font-medium inline-flex items-center group"
            >
              了解更多
              <span className="ml-1 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </a>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                服务器地址
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder={`例如: ${
                  modelKey === "lmstudio"
                    ? "http://localhost:1234"
                    : "http://localhost:11434"
                }`}
                value={settings[modelKey].url}
                onChange={handleChange(modelKey, "url")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                API Key（可选）
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="输入 API Key（如果需要）"
                value={settings[modelKey].apiKey}
                onChange={handleChange(modelKey, "apiKey")}
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => verifyLocalModelSettings(modelKey)}
                disabled={isVerifying}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>保存中...</span>
                  </div>
                ) : (
                  "保存"
                )}
              </button>
            </div>
          </div>

          {verifyStatuses[modelKey]?.status && (
            <div className="mt-2">
              {verifyStatuses[modelKey].status === "success" ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses[modelKey].message}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  <X className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses[modelKey].message}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (modelKey === "custom") {
    return (
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="text-indigo-600 text-sm font-bold">C</span>
            </div>
            自定义模型配置
          </h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              {API_INFO.custom.description}
              <span
                className="mt-1 text-amber-600 font-medium cursor-help"
                data-tooltip-id="openai-spec-tooltip"
              >
                注意：仅支持 OpenAI 规范的接口
              </span>
              <Tooltip
                id="openai-spec-tooltip"
                place="bottom"
                className="max-w-xs rounded-lg"
                content={<div className="text-sm">什么是OpenAI 规范接口</div>}
              />
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                模型ID
              </label>
              <div className="space-y-3">
                {modelList?.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg">
                    {modelList.map((modelId, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-sm"
                      >
                        {modelId}
                        <button
                          onClick={() => removeModelId(index)}
                          className="hover:text-indigo-900 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="输入模型ID（例如: gpt-4-turbo）"
                    value={modelIdInput}
                    onChange={(e) => setModelIdInput(e.target.value)}
                    onKeyDown={handleModelIdKeyDown}
                  />
                  <button
                    onClick={handleAddModelId}
                    disabled={!modelIdInput.trim()}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                API 端点
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="https://api.example.com/v1"
                value={settings.custom?.url || ""}
                onChange={handleChange("custom", "url")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="输入 API Key"
                value={settings.custom?.apiKey || ""}
                onChange={handleChange("custom", "apiKey")}
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() =>
                  verifyApiKey(settings.custom?.apiKey, settings.custom?.url)
                }
                disabled={isVerifying}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>保存中...</span>
                  </div>
                ) : (
                  "保存"
                )}
              </button>
            </div>
          </div>

          {verifyStatuses.custom?.status && (
            <div className="mt-2">
              {verifyStatuses.custom.status === "success" ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses.custom.message}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  <X className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses.custom.message}
                </span>
              )}
            </div>
          )}
          {failedModels.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                以下模型验证失败：
              </h4>
              <ul className="space-y-1">
                {failedModels.map(({ modelId }) => (
                  <li key={modelId} className="text-sm text-red-700">
                    {modelId}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (modelKey === "openai") {
    return (
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="text-indigo-600 text-sm font-bold">O</span>
            </div>
            {modelName}配置
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {API_INFO[modelKey].description}
            <a
              href={API_INFO[modelKey].link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500 ml-2 font-medium inline-flex items-center group"
            >
              获取API Key
              <span className="ml-1 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </a>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="输入 OpenAI API Key"
                value={settings[modelKey].apiKey}
                onChange={handleChange(modelKey, "apiKey")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                API 代理（可选）
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="例如: https://api.example.com/v1"
                value={settings[modelKey].url || ""}
                onChange={handleChange(modelKey, "url")}
              />
              <p className="mt-1 text-xs text-gray-500">
                如果需要使用代理访问 OpenAI API，请在此输入代理地址
              </p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() =>
                  verifyApiKey(
                    settings[modelKey].apiKey,
                    settings[modelKey].url
                  )
                }
                disabled={isVerifying}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>保存中...</span>
                  </div>
                ) : (
                  "保存"
                )}
              </button>
            </div>
          </div>

          {verifyStatuses[modelKey].status && (
            <div className="mt-2">
              {verifyStatuses[modelKey].status === "success" ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses[modelKey].message}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  <X className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses[modelKey].message}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <span className="text-indigo-600 text-sm font-bold">
              {modelName.charAt(0)}
            </span>
          </div>
          {modelName}配置
        </h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {API_INFO[modelKey].description}
          <a
            href={API_INFO[modelKey].link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-500 ml-2 font-medium inline-flex items-center group"
          >
            获取API Key
            <span className="ml-1 group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </a>
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            输入API Key
            并保存，输入完成后点击保存按钮，保存通过即可使用自定义模型
          </label>
          <div>
            <input
              type="password"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-400"
              placeholder={`输入 ${modelName} API Key`}
              value={settings[modelKey].apiKey}
              onChange={handleChange(modelKey, "apiKey")}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => verifyApiKey(settings[modelKey].apiKey)}
                disabled={isVerifying}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>保存中...</span>
                  </div>
                ) : (
                  "保存"
                )}
              </button>
            </div>
          </div>
          {verifyStatuses[modelKey].status && (
            <div className="mt-2">
              {verifyStatuses[modelKey].status === "success" ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses[modelKey].message}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  <X className="w-3.5 h-3.5 mr-1" />
                  {verifyStatuses[modelKey].message}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ModelSettings };
