import React, { useState, useEffect } from "react";
import {
  getUserInput,
  getDeepSeekApiKey,
  getClaudeApiKey,
  getOpenaiApiKey,
  getOllamaConfig,
  getLmstudioConfig,
  getCustomModelIds,
  getCustomConfig,
} from "../../../../public/storage";
import { Login } from "./modules/login";
import { NavBar } from "./modules/navBar";
import { ModelSettings } from "./modules/modelSetting";
import { BaseModel } from "./modules/baseModel";
import { About } from "./modules/about";

const SettingsContent = ({
  setModelList,
  modelList,
  webPreview,
  setWebPreview,
  settings,
  handleChange,
}) => {
  const [activeTab, setActiveTab] = useState("基础设置");

  const renderModelSettings = () => (
    <div className="px-6 overflow-y-auto flex-1">
      {Object.entries(settings).map(([modelKey]) => (
        <ModelSettings
          setModelList={setModelList}
          modelList={modelList}
          key={modelKey}
          modelKey={modelKey}
          settings={settings}
          handleChange={handleChange}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full h-[calc(100vh-8px)] rounded-xl flex flex-col bg-white">
      <div className="flex-none px-6 py-4 border-b border-gray-200">
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "基础设置" && (
          <div className="h-full overflow-y-auto">
            <BaseModel webPreview={webPreview} setWebPreview={setWebPreview} />
          </div>
        )}
        {activeTab === "模型设置" && (
          <div className="h-full overflow-y-auto">{renderModelSettings()}</div>
        )}
        {activeTab === "关于" && (
          <div className="h-full overflow-y-auto">
            <About />
          </div>
        )}
      </div>
    </div>
  );
};

export const SettingPage = ({
  setSettings,
  settings,
  webPreview,
  setWebPreview,
  onClose,
  updateDeepSeekConfig,
  userInput,
  setUserInput,
}) => {
  const [modelList, setModelList] = useState([]);

  const handleChange = (model, field) => (event) => {
    setSettings((prev) => ({
      ...prev,
      [model]: {
        ...prev[model],
        [field]: event.target.value,
      },
    }));
  };

  useEffect(() => {
    const fetchUserInput = async () => {
      const input = await getUserInput();
      setUserInput(input);
    };

    fetchUserInput();
  }, []);

  useEffect(() => {
    const fetchModelList = async () => {
      const modelList = await getCustomModelIds();
      setModelList(modelList);
    };

    fetchModelList();
  }, []);

  const loadModelConfigs = async () => {
    const [
      deepseekApiKey,
      claudeApiKey,
      openaiApiKey,
      ollamaConfig,
      lmstudioConfig,
      customConfig,
    ] = await Promise.all([
      getDeepSeekApiKey(),
      getClaudeApiKey(),
      getOpenaiApiKey(),
      getOllamaConfig(),
      getLmstudioConfig(),
      getCustomConfig(),
    ]);

    return {
      deepseek: { apiKey: deepseekApiKey },
      claude: { apiKey: claudeApiKey },
      openai: { apiKey: openaiApiKey },
      ollama: {
        url: ollamaConfig.url || "http://localhost:11434",
        apiKey: ollamaConfig.apiKey || "",
      },
      lmstudio: {
        url: lmstudioConfig.url || "http://localhost:1234",
        apiKey: lmstudioConfig.apiKey || "",
      },
      custom: {
        url: customConfig.url || "",
        apiKey: customConfig.apiKey || "",
      },
    };
  };

  useEffect(() => {
    loadModelConfigs().then((configs) => setSettings(configs));
  }, []);

  return (
    <>
      {userInput ? (
        <SettingsContent
          setModelList={setModelList}
          webPreview={webPreview}
          modelList={modelList}
          setWebPreview={setWebPreview}
          settings={settings}
          handleChange={handleChange}
        />
      ) : (
        <Login setUserInput={setUserInput} />
      )}
    </>
  );
};
