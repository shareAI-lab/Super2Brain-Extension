import React from "react";
import { ChatMessageList } from "./modules/ChatMessageList";
import { TextareaRef } from "./modules/textarea";

const ActivateTabChatPanel = ({
  pageContent,
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
  setActivatePage,
  currentUrlRelatedQuestions,
  currentUrlLoading,
}) => {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8px)] overflow-hidden bg-white rounded-xl">
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          currentUrlRelatedQuestions={currentUrlRelatedQuestions}
          currentUrlLoading={currentUrlLoading}
          currentUrl={currentUrl}
          messages={getCurrentUrlMessages()}
          isAiThinking={isAiThinking}
          copiedMessageId={copiedMessageId}
          onCopy={onCopy}
          onRetry={onRetry}
        />
      </div>
      <div className="p-4 bg-white w-full">
        <TextareaRef
          pageContent={pageContent}
          setActivatePage={setActivatePage}
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
