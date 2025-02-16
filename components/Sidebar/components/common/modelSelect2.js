import { AI_MODELS2 } from "../../config/models";
import { Bot, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const ModelSelector2 = ({
  setActivatePage,
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
  const dropdownRef = useRef(null);

  useEffect(() => {
    const initializeModelList = async () => {
      setModelList([]);
    };

    initializeModelList();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const handleModelSelect = (model) => {
    if (!useInput) return;
    setSelectedModel(model.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-[200px] overflow-hidden">
          <div className="py-2">
            <ModelGroup
              title="By shareAI"
              models={Object.values(AI_MODELS2)}
              selectedModel={selectedModel}
              selectedModelProvider={selectedModelProvider}
              useInput={useInput}
              onModelSelect={handleModelSelect}
            />
          </div>
        </div>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 ml-1 flex items-center px-3 py-2
          cursor-pointer w-[200px] rounded-xl 
           text-white bg-indigo-500 hover:bg-indigo-400
          border border-indigo-300
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

const ModelGroup = ({
  title,
  models,
  selectedModel,
  selectedModelProvider,
  onModelSelect,
  useInput = true,
}) => {
  // 过滤出未禁用的模型
  const enabledModels = models.filter((model) => !model.disabled);

  // 如果没有启用的模型且不是自定义模型组，则不显示整个组
  if (enabledModels.length === 0) return null;

  return (
    <>
      <div className="px-4 py-2 flex items-center">
        <span className="text-gray-500 text-[11px] font-medium tracking-wider flex items-center">
          {title}
        </span>
      </div>

      {enabledModels.map((model) => (
        <div
          key={model.id}
          className={`px-4 py-2 text-sm transition-all duration-200
                    hover:bg-indigo-50 flex items-center justify-between group
                    ${
                      !useInput
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                    ${
                      selectedModel === model.id &&
                      selectedModelProvider === model.provider
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-600"
                    }`}
          onClick={() => onModelSelect(model)}
        >
          <span className="group-hover:text-indigo-600 pl-4">{model.id}</span>
          {selectedModel === model.id &&
            selectedModelProvider === model.provider && (
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
        </div>
      ))}
    </>
  );
};

export { ModelSelector2 };
