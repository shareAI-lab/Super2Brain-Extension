import { useState, useRef, useEffect } from "react";
import {
  Settings,
  HelpCircle,
  RefreshCw,
  Download,
  Copy,
  FileText,
} from "lucide-react";

const OptionsMenu = ({ isOpen, setIsOpen, lastResponse }) => {
  const menuRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState(""); // 用于显示复制状态

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const copyConversation = async () => {
    try {
      await navigator.clipboard.writeText(lastResponse);
      setCopyStatus("已复制");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      setCopyStatus("复制失败");
      console.error("复制失败:", err);
    }
  };

  const menuItems = [
    {
      icon: <RefreshCw className="w-4 h-4" />,
      label: "重置对话",
      onClick: () => console.log("重置被点击"),
    },
    {
      icon: <Copy className="w-4 h-4" />,
      label: copyStatus || "复制回答",
      onClick: copyConversation,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: "导出为PDF",
      onClick: () => console.log("导出PDF被点击"),
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-gray-200 z-50 overflow-hidden">
          <div className="py-1.5">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
              >
                <span className="text-gray-500">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { OptionsMenu };
