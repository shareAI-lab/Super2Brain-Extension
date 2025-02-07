import { useState, useEffect, useCallback } from "react";

const useScreenshotHandler = () => {
    const [screenshotData, setScreenshotData] = useState(null);
  
    useEffect(() => {
      const handleScreenshotMessage = (message) => {
        if (message.type === "SCREENSHOT_CAPTURED") {
          setScreenshotData(message.payload.dataUrl);
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
        await chrome.tabs.sendMessage(tab.id, { type: "START_SCREENSHOT" });
      } catch (error) {
        console.error("截图失败:", error);
      }
    }, []);
  
    return { screenshotData, setScreenshotData, handleScreenshot };
  };

  export { useScreenshotHandler };