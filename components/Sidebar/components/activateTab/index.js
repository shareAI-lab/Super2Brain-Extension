import React from "react";
import { ChatMessageList } from "./modules/ChatMessageList";
import { TextareaRef } from "./modules/textarea";

const ActivateTabChatPanel = ({
  useInput,
  selectedModelProvider,
  selectedModelIsSupportsImage,
  setSelectedModelProvider,
  setSelectedModelIsSupportsImage,
  getCurrentUrlMessages,
  isAiThinking,
  copiedMessageId,
  onCopy,
  onRetry,
  onSubmit,
  clearCurrentUrlMessages,
  currentUrl,
  selectedModel,
  setSelectedModel,
  isContentReady,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl">
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          messages={getCurrentUrlMessages()}
          isAiThinking={isAiThinking}
          copiedMessageId={copiedMessageId}
          onCopy={onCopy}
          onRetry={onRetry}
        />
      </div>
      <div className="p-4 bg-white w-full">
        <TextareaRef
          isContentReady={isContentReady}
          useInput={useInput}
          selectedModelProvider={selectedModelProvider}
          selectedModelIsSupportsImage={selectedModelIsSupportsImage}
          setSelectedModelProvider={setSelectedModelProvider}
          setSelectedModelIsSupportsImage={setSelectedModelIsSupportsImage}
          onSubmit={onSubmit}
          onReset={clearCurrentUrlMessages}
          currentUrl={currentUrl}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isAiThinking={isAiThinking}
        />
      </div>
    </div>
  );
};

export { ActivateTabChatPanel };
