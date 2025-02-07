import React, { useState, useEffect } from "react";
import { setItem, getItem, getUserInput } from "../../../../public/storage";
import { Login } from "./modules/login";
import { CheckBoxs } from "./modules/check";
const renderModelSettings = (modelKey, modelName, settings, handleChange) => (
  <div
    key={modelKey}
    className="bg-gray-50 rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow"
  >
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-blue-600 text-sm font-bold">
          {modelName.charAt(0)}
        </span>
      </div>
      {modelName}配置
    </h3>

    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">
          API Key
        </label>
        <input
          type="password"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder={`输入 ${modelName} API Key`}
          value={settings[modelKey].apiKey}
          onChange={handleChange(modelKey, "apiKey")}
        />
      </div>
    </div>
  </div>
);

const ActionButton = ({ onClick, variant = "primary", children }) => {
  const styles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-100 text-gray-600 hover:bg-gray-200",
  };

  return (
    <button
      onClick={onClick}
      className={`w-1/2 ${styles[variant]} py-3 px-4 rounded-lg transition-colors font-medium`}
    >
      {children}
    </button>
  );
};

// 抽取设置内容组件
const SettingsContent = ({ onClose, handleSave, settings, handleChange }) => (
  <div className="h-full flex flex-col">
    {/* 头部固定 */}
    <div className="flex-none p-6 border-b">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">设置</h2>
      </div>
    </div>

    {/* 内容区域可滚动 */}
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        <CheckBoxs />


        
        {["deepseek", "claude", "openai"].map((model) =>
          renderModelSettings(
            model,
            model.charAt(0).toUpperCase() + model.slice(1),
            settings,
            handleChange
          )
        )}
      </div>
    </div>

    {/* 底部固定 */}
    <div className="flex-none p-6 border-t bg-white">
      <div className="flex gap-3">
        <ActionButton onClick={onClose} variant="secondary">
          返回
        </ActionButton>
        <ActionButton onClick={handleSave}>保存设置</ActionButton>
      </div>
    </div>
  </div>
);

export const SettingPage = ({ onClose, updateDeepSeekConfig }) => {
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

  const handleSave = async () => {
    const saveConfigs = Object.entries(settings).map(([model, config]) =>
      setItem(`${model}ApiKey`, config.apiKey)
    );

    await Promise.all(saveConfigs);

    if (updateDeepSeekConfig) {
      await updateDeepSeekConfig();
    }

    onClose();
  };

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
          onClose={onClose}
          handleSave={handleSave}
          settings={settings}
          handleChange={handleChange}
        />
      ) : (
        <Login />
      )}
    </>
  );
};
