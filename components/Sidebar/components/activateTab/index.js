import React, { useCallback } from "react";
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
  const handleQuestionClick = useCallback((question, reason_content) => {
    if (!question) return;
    
    
    const message = {
      role: "user",
      content: question,
      isFromSuggestion: true
    };
    
    if (reason_content) {
      message.reason_content = reason_content;
    }
    
    onSubmit([message], false);
  }, [onSubmit]);

  const handleSubmit = useCallback((messages, isRetry = false) => {
    onSubmit(messages, isRetry);
  }, [onSubmit]);

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
          onQuestionClick={handleQuestionClick}
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
          onSubmit={handleSubmit}
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
