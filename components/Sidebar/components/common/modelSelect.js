import { AI_MODELS } from "../../config/models";
import { Bot, ChevronDown } from "lucide-react";

const ModelSelector = ({
  isOpen,
  setIsOpen,
  selectedModel,
  setSelectedModel,
  setScreenshotData,
}) => (
  <div className="relative">
    {isOpen && (
      <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-[200px] overflow-hidden">
        <div className="py-1.5">
          {Object.values(AI_MODELS).map((model) => (
            <div
              key={model.id}
              className={`px-4 py-2.5 cursor-pointer text-sm transition-all duration-200
                  hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent
                  flex items-center justify-between group
                  ${
                    selectedModel === model.id
                      ? "text-indigo-600 bg-indigo-50/50"
                      : "text-gray-600"
                  }`}
              onClick={() => {
                setSelectedModel(model.id);
                setIsOpen(false);
                if (!model.supportsImage) {
                  setScreenshotData(null);
                }
              }}
            >
              <span className="group-hover:text-indigo-600">{model.id}</span>
              {selectedModel === model.id && (
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

export { ModelSelector };