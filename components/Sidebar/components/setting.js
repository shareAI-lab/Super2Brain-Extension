import React, { useState } from "react";
import { X } from "lucide-react";
import { setDeepSeekBaseUrl, setDeepSeekApiKey } from "../../../public/storage";

export const SettingPage = ({ onClose, updateDeepSeekConfig }) => {
  const [settings, setSettings] = useState({
    baseUrl: "",
    apiKey: "",
  });

  const handleSave = async () => {
    await Promise.all([
      setDeepSeekBaseUrl(settings.baseUrl),
      setDeepSeekApiKey(settings.apiKey),
    ]);

    if (updateDeepSeekConfig) {
      await updateDeepSeekConfig();
    }

    onClose();
  };

  const handleChange = (field) => (event) => {
    setSettings((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">设置</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            DeepSeek Base URL
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="输入 DeepSeek Base URL"
            value={settings.baseUrl}
            onChange={handleChange("baseUrl")}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            DeepSeek API Key
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="输入 DeepSeek API Key"
            value={settings.apiKey}
            onChange={handleChange("apiKey")}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="w-1/2 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
          >
            返回
          </button>
          <button
            onClick={handleSave}
            className="w-1/2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};
