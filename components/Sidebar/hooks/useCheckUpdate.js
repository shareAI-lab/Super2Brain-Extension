import { useEffect, useState } from "react";

const useCheckUpdate = () => {
  const [updateInfo, setUpdateInfo] = useState({
    isUpdate: false,
    currentVersion: "",
    newVersion: "",
    releaseNotes: "",
    fixNotes: "",
    chromeUpdateUrl: "",
    edgeUpdateUrl: "",
    isDismissed: false,
    updateDocs: "",
  });

  const checkUpdate = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkUpdate",
      });

      setUpdateInfo(prev => ({
        isUpdate: response?.updateAvailable || false,
        currentVersion: response?.currentVersion || "",
        newVersion: response?.version || "",
        releaseNotes: response?.releaseNotes || "",
        fixNotes: response?.fixNotes || "",
        choremUpdateUrl: response?.choremUpdateUrl || "",
        edgeUpdateUrl: response?.edgeUpdateUrl || "",
        updateDocs: response?.updateDocs || "",
        isDismissed: prev.isDismissed
      }));
    } catch (error) {
      console.error("检查更新失败:", error);
    }
  };

  const dismissUpdate = () => {
    setUpdateInfo(prev => ({
      ...prev,
      isDismissed: true
    }));
  };

  useEffect(() => {
    checkUpdate();

    const interval = setInterval(checkUpdate, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...updateInfo,
    dismissUpdate,
  };
};

export { useCheckUpdate };
