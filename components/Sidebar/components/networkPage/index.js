import { Plus, Send, Trash2, Search } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useState, useMemo, useEffect } from "react";
import { super2brainModel } from "../../config/models.js";

import { MessageRenderer } from "./modules/MessageRenderer";

import { MessageList } from "../notesPage/modules/MessageList";

import { ModelSelector2 } from "../common/modelSelect2.js";

const NetworkSearch = ({
  userInput,
  setActivatePage,
  selectedModelProvider,
  selectedModelIsSupportsImage,
  setSelectedModelProvider,
  setSelectedModelIsSupportsImage,
  checkBalance,
  networkSelectedModel,
  setNetworkSelectedModel,
  message,
  isLoading,
  handleNetworkSubmit,
  setMessage,
  notesMessages,
  notesLoading,
  notesExpandedDocs,
  notesCopiedMessageId,
  setExpandedDocs,
  handleNotesSubmit,
  handleNotesCopy,
  handleNotesRegenerate,
  handleNotesReset,
  setMessages,
  searchEnabled,
  setSearchEnabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chatMode, setChatMode] = useState("network");
  const [networkTimer, setNetworkTimer] = useState(null);
  const [networkElapsedTime, setNetworkElapsedTime] = useState(0);
  const [notesTimer, setNotesTimer] = useState(null);
  const [notesElapsedTime, setNotesElapsedTime] = useState(0);

  const model = super2brainModel[networkSelectedModel]?.id || "选择模型";

  const handleModelSelect = (modelId) => {
    setNetworkSelectedModel(modelId);
    setIsOpen(false);
  };

  const [isSendAgain, setIsSendAgain] = useState(true);

  useEffect(() => {
    if (
      message.length === 0 ||
      (chatMode === "network" &&
        message[message.length - 1].isComplete === false)
    ) {
      setIsSendAgain(true);
    } else {
      setIsSendAgain(false);
    }
    if (
      notesMessages.length === 0 ||
      (chatMode === "notes" &&
        notesMessages[notesMessages.length - 1].isComplete === false)
    ) {
      setIsSendAgain(true);
    } else {
      setIsSendAgain(false);
    }
  }, [chatMode, message, notesMessages]);

  const handleReset = () => {
    if (chatMode === "network") {
      setQuery("");
      setMessage([]);
      stopTimer(true);
      setNetworkElapsedTime(0);
    } else {
      handleNotesReset();
      stopTimer(false);
      setNotesElapsedTime(0);
    }
  };

  const startTimer = (isNetwork = true) => {
    stopTimer(isNetwork);

    if (isNetwork) {
      setNetworkElapsedTime(0);
    } else {
      setNotesElapsedTime(0);
    }

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      if (isNetwork) {
        setNetworkElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      } else {
        setNotesElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);

    if (isNetwork) {
      setNetworkTimer(timerInterval);
    } else {
      setNotesTimer(timerInterval);
    }
  };

  const stopTimer = (isNetwork = true) => {
    if (isNetwork) {
      if (networkTimer) {
        clearInterval(networkTimer);
        setNetworkTimer(null);
      }
    } else {
      if (notesTimer) {
        clearInterval(notesTimer);
        setNotesTimer(null);
      }
    }
  };

  const handleMessageSubmit = async () => {
    if (
      !userInput ||
      !query.trim() ||
      (chatMode === "network" ? isLoading : notesLoading) ||
      isSendAgain
    )
      return;
    if (chatMode === "network") {
      const isEnough = await checkBalance(7, model, 3);
      if (!isEnough) return;
    } else {
      const isEnough = await checkBalance(4, model, 2);
      if (!isEnough) return;
    }

    const message = query;
    setQuery("");

    try {
      if (chatMode === "network") {
        setNetworkElapsedTime(0);
        startTimer(true);
        await handleNetworkSubmit(message);
      } else {
        setNotesElapsedTime(0);
        startTimer(false);
        await handleNotesSubmit(message);
      }
    } catch (error) {
      console.error("发送消息时出错:", error);
      stopTimer(chatMode === "network");
    }
  };

  useEffect(() => {
    stopTimer(true);
    stopTimer(false);
  }, [chatMode]);

  useEffect(() => {
    return () => {
      stopTimer(true);
      stopTimer(false);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.isComposing || e.keyCode === 229) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMessageSubmit();
    }
  };

  return (
    <div className="w-full h-[calc(100vh-8px)] rounded-xl flex flex-col bg-white">
      <div className="flex-shrink-0 py-4">
        <div className="flex justify-center gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-3xl w-fit mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 border border-gray-100/50">
          <button
            onClick={() => setChatMode("network")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${
                chatMode === "network"
                  ? "bg-indigo-50/90 text-indigo-600 shadow-[0_2px_12px_rgb(99,102,241,0.12)]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
              }`}
          >
            Web搜索
          </button>
          <button
            onClick={() => setChatMode("notes")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${
                chatMode === "notes"
                  ? "bg-indigo-50/90 text-indigo-600 shadow-[0_2px_12px_rgb(99,102,241,0.12)]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
              }`}
          >
            知识库搜索
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2 space-y-4">
        {chatMode === "network" ? (
          <MessageRenderer
            setMessage={setMessage}
            messages={message}
            setQuery={setQuery}
            elapsedTime={networkElapsedTime}
          />
        ) : (
          <MessageList
            messages={notesMessages}
            model={model}
            copiedMessageId={notesCopiedMessageId}
            expandedDocs={notesExpandedDocs}
            handleCopy={handleNotesCopy}
            handleRegenerate={handleNotesRegenerate}
            setExpandedDocs={setExpandedDocs}
            setQuery={setQuery}
            elapsedTime={notesElapsedTime}
          />
        )}
      </div>

      <div className="flex-shrink-0 bg-white p-2">
        <div className="mb-2 flex items-center justify-end">
          <div className="flex items-center gap-2">
            {((chatMode === "network" && message.length > 0) ||
              (chatMode === "notes" && notesMessages.length > 0)) && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-gray-600 bg-white border 
                  border-gray-200 rounded-full hover:text-red-600 hover:border-red-200 
                  hover:bg-red-50 transition-all duration-200 shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                清空对话
              </button>
            )}
            <button
              onClick={() => setSearchEnabled(!searchEnabled)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-200 
                ${
                  searchEnabled
                    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">开启搜索</span>
            </button>
          </div>
        </div>

        <div
          className="relative rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 
            focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
            focus-within:outline-indigo-600"
        >
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base 
              text-gray-900 outline-none resize-none h-24
              placeholder:text-gray-400 sm:text-sm/6"
            placeholder="请输入您的问题..."
          />
          <div className="p-2">
            <div className="flex items-center gap-2 justify-between">
              <ModelSelector2
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                model={model}
                selectedModel={networkSelectedModel}
                handleModelSelect={handleModelSelect}
                super2brainModel={super2brainModel}
                setActivatePage={setActivatePage}
                useInput={userInput}
                selectedModelProvider={selectedModelProvider}
                selectedModelIsSupportsImage={selectedModelIsSupportsImage}
                setSelectedModelProvider={setSelectedModelProvider}
                setSelectedModelIsSupportsImage={
                  setSelectedModelIsSupportsImage
                }
                setSelectedModel={setNetworkSelectedModel}
              />

              <div className="flex gap-2">
                <button
                  onClick={handleMessageSubmit}
                  disabled={
                    !userInput ||
                    !query.trim() ||
                    (chatMode === "network" ? isLoading : notesLoading) ||
                    isSendAgain
                  }
                  className={`button-tag-send p-2 rounded-xl
                flex items-center justify-center
                transition-all duration-200
                ${
                  !userInput ||
                  !query.trim() ||
                  (chatMode === "network" ? isLoading : notesLoading) ||
                  isSendAgain
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200"
                }
                shadow-sm hover:shadow-md`}
                >
                  <Send className="w-4 h-4" />
                </button>
                <Tooltip
                  style={{ borderRadius: "8px" }}
                  anchorSelect=".button-tag-send"
                  place="top"
                >
                  发送
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { NetworkSearch };
