import React, { useState, useEffect } from "react";
import { setItem, getItem, getUserInput } from "../../../../public/storage";
import { Login } from "./modules/login";
import { NavBar } from "./modules/navBar";
import { ModelSettings } from "./modules/modelSetting";
import { BaseModel } from "./modules/baseModel";

// 抽取设置内容组件
const SettingsContent = ({
  webPreview,
  setWebPreview,
  settings,
  handleChange,
}) => {
  const [activeTab, setActiveTab] = useState("基础设置");

  const renderModelSettings = () => (
    <div className="px-6 overflow-y-auto">
      {Object.entries(settings).map(([modelKey]) => (
        <ModelSettings
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
      <div className="px-6 py-4">
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div>
        {activeTab === "基础设置" && <BaseModel webPreview={webPreview} setWebPreview={setWebPreview} />}
        {activeTab === "模型设置" && renderModelSettings()}
      </div>
    </div>
  );
};

export const SettingPage = ({
  webPreview,
  setWebPreview,
  onClose,
  updateDeepSeekConfig,
}) => {
  const [userInput, setUserInput] = useState("");
  const [settings, setSettings] = useState({
    deepseek: {
      apiKey: "",
    },
    claude: {
      apiKey: "",
    },
    openai: {
      apiKey: "",
    },
  });

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

  const loadModelConfigs = async () => {
    const models = ["deepseek", "claude", "openai"];

    const configs = await Promise.all(
      models.map(async (model) => {
        const apiKey = (await getItem(`${model}ApiKey`)) || "";
        return [model, { apiKey }];
      })
    );

    return Object.fromEntries(configs);
  };

  // 在组件加载时获取已存储的配置
  useEffect(() => {
    loadModelConfigs().then((configs) => setSettings(configs));
  }, []);

  return (
    <>
      {userInput ? (
        <SettingsContent
          webPreview={webPreview}
          setWebPreview={setWebPreview}
          settings={settings}
          handleChange={handleChange}
        />
      ) : (
        <Login />
      )}
    </>
  );
};
