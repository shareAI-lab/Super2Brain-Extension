import {
  AI_MODELS,
  deepseekModel,
  claudeModel,
  openaiModel,
} from "../../config/models";
import { Bot, ChevronDown } from "lucide-react";
import {
  getDeepSeekApiKey,
  getClaudeApiKey,
  getOpenaiApiKey,
} from "../../../../public/storage";
import { useState, useEffect } from "react";

const ModelSelector = ({
  useInput,
  isOpen,
  setIsOpen,
  selectedModel,
  setSelectedModel,
  setScreenshotData,
  selectedModelProvider,
  selectedModelIsSupportsImage,
  setSelectedModelProvider,
  setSelectedModelIsSupportsImage,
}) => {
  const [modelList, setModelList] = useState([]);

  useEffect(() => {
    const initializeModelList = async () => {
      const [deepSeekKey, claudeKey, openaiKey] = await Promise.all([
        getDeepSeekApiKey(),
        getClaudeApiKey(),
        getOpenaiApiKey(),
      ]);

      const models = [
        ...Object.values(deepseekModel).map((model) => ({
          ...model,
          disabled: !deepSeekKey,
        })),
        ...Object.values(claudeModel).map((model) => ({
          ...model,
          disabled: !claudeKey,
        })),
        ...Object.values(openaiModel).map((model) => ({
          ...model,
          disabled: !openaiKey,
        })),
      ];

      setModelList(models);
    };

    initializeModelList();
  }, []);

  return (
    <div className="relative">
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-[200px] overflow-hidden">
          <div className="py-1.5">
            <div
              key="super2brain"
              className="px-4 py-2.5 text-sm flex items-center"
            >
              <span className="text-gray-800 font-medium">Super2Brain</span>
            </div>
            {Object.values(AI_MODELS).map((model) => (
              <div
                key={model.id}
                className={`px-4 py-2.5 text-sm transition-all duration-200
                    hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent
                    flex items-center justify-between group
                    ${
                      !useInput
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                    ${
                      selectedModel === model.id &&
                      selectedModelProvider === model.provider
                        ? "text-indigo-600 bg-indigo-50/50"
                        : "text-gray-600"
                    }`}
                onClick={() => {
                  if (!useInput) return;
                  setSelectedModel(model.id);
                  setSelectedModelProvider(model.provider);
                  setSelectedModelIsSupportsImage(model.supportsImage);
                  setIsOpen(false);
                  if (!model.supportsImage) {
                    setScreenshotData(null);
                  }
                }}
              >
                <span className="group-hover:text-indigo-600">{model.id}</span>
                {selectedModel === model.id &&
                  selectedModelProvider === model.provider && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
              </div>
            ))}
            <div
              key="super2brain"
              className="px-4 py-2.5 text-sm flex items-center"
            >
              <span className="text-gray-800 font-medium">官方模型</span>
            </div>
            {modelList.map((model) => (
              <div
                key={model.id}
                className={`px-4 py-2.5 text-sm transition-all duration-200
                    hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent
                    flex items-center justify-between group
                    ${
                      model.disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                    ${
                      selectedModel === model.id &&
                      selectedModelProvider === model.provider
                        ? "text-indigo-600 bg-indigo-50/50"
                        : "text-gray-600"
                    }`}
                onClick={() => {
                  if (model.disabled) return;
                  setSelectedModel(model.id);
                  setSelectedModelProvider(model.provider);
                  setSelectedModelIsSupportsImage(model.supportsImage);
                  setIsOpen(false);
                  if (!model.supportsImage) {
                    setScreenshotData(null);
                  }
                }}
              >
                <span className="group-hover:text-indigo-600">{model.id}</span>
                {selectedModel === model.id &&
                  selectedModelProvider === model.provider && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 ml-1 flex items-center px-3 py-2
          cursor-pointer w-[200px] rounded-xl 
          bg-gradient-to-r from-indigo-500 to-purple-500
          hover:from-indigo-600 hover:to-purple-600
          active:scale-[0.98] transition-all duration-200
          shadow-sm hover:shadow-md"
      >
        <Bot className="w-4 h-4 text-white" />
        <span className="text-sm text-white ml-2 font-medium">
          {selectedModel}
        </span>
        <ChevronDown className="w-4 h-4 ml-auto text-white/80" />
      </div>
    </div>
  );
};

export { ModelSelector };
