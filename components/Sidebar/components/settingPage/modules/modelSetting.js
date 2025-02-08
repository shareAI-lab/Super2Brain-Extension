import {
  checkDeepSeekApiKey,
  checkClaudeApiKey,
  checkOpenAiApiKey,
} from "../utils/check";
import { useState } from "react";
import { Check, X, CheckCircle, Loader2 } from "lucide-react";
import {
  setDeepSeekApiKey,
  setClaudeApiKey,
  setOpenaiApiKey,
} from "../../../../../public/storage";

const MODEL_NAMES = {
  deepseek: "DeepSeek",
  claude: "Claude",
  openai: "OpenAI",
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
};

const ModelSettings = ({ modelKey, settings, handleChange }) => {
  const modelName = MODEL_NAMES[modelKey] || modelKey;
  const [verifyStatuses, setVerifyStatuses] = useState({
    deepseek: { status: null, message: "" },
    claude: { status: null, message: "" },
    openai: { status: null, message: "" },
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyApiKey = async (apiKey) => {
    if (!apiKey) {
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
          if (isValid) {
            await setDeepSeekApiKey(apiKey);
          }
          break;
        case "claude":
          isValid = await checkClaudeApiKey(apiKey);
          if (isValid) {
            await setClaudeApiKey(apiKey);
          }
          break;
        case "openai":
          isValid = await checkOpenAiApiKey(apiKey);
          if (isValid) {
            await setOpenaiApiKey(apiKey);
          }
          break;
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

  return (
    <div
      key={modelKey}
      className="bg-white rounded-xl p-6 mb-6 shadow-sm hover:shadow-lg
       transition-all duration-200 border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <span className="text-indigo-600 text-sm font-bold">
            {modelName.charAt(0)}
          </span>
        </div>
        {modelName}配置
      </h3>

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
            输入API Key 并验证，输入完成后点击验证按钮，验证通过即可自动保存
          </label>
          <div className="flex gap-3">
            <input
              type="password"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                transition-all placeholder:text-gray-400"
              placeholder={`输入 ${modelName} API Key`}
              value={settings[modelKey].apiKey}
              onChange={handleChange(modelKey, "apiKey")}
            />
            <button
              onClick={() => verifyApiKey(settings[modelKey].apiKey)}
              disabled={isVerifying}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg
                shadow-sm hover:bg-indigo-500 active:bg-indigo-700
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline focus-visible:outline-2 
                focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>验证中...</span>
                </div>
              ) : (
                "验证API"
              )}
            </button>
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
