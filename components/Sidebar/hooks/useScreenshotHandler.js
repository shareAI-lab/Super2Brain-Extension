import { useState, useEffect, useCallback } from "react";

const useScreenshotHandler = () => {
    const [screenshotData, setScreenshotData] = useState(null);
  
    useEffect(() => {
      const handleScreenshotMessage = (message, sender, sendResponse) => {
        if (message.type === "SCREENSHOT_CAPTURED") {
          setScreenshotData(message.payload.dataUrl);
          sendResponse({ received: true });
        }
      };
  
      chrome.runtime.onMessage.addListener(handleScreenshotMessage);
      return () =>
        chrome.runtime.onMessage.removeListener(handleScreenshotMessage);
    }, []);
  
    const handleScreenshot = useCallback(async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        
        if (!tab) {
          throw new Error("未找到活动标签页");
        }
  
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "START_SCREENSHOT",
        });
        
        if (!response || !response.success) {
          throw new Error("启动截图失败");
        }
      } catch (error) {
        console.error("截图操作失败:", error);
      }
    }, []);
  
    return { screenshotData, setScreenshotData, handleScreenshot };
  };

  export { useScreenshotHandler };