import { useState, useRef, useEffect } from "react";
import {
  Settings,
  HelpCircle,
  RefreshCw,
  Download,
  Copy,
  FileText,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const OptionsMenu = ({ isOpen, setIsOpen, content }) => {
  const menuRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");

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
      await navigator.clipboard.writeText(content);
      setCopyStatus("已复制");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      setCopyStatus("复制失败");
      console.error("复制失败:", err);
    }
  };

  const exportToPDF = async () => {
    try {
      // 创建一个临时的 div 元素
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-bottom: 20px;">DeepSeek 对话记录</h2>
          <div style="white-space: pre-wrap; line-height: 1.6;">
            ${content}
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            导出时间：${new Date().toLocaleString()}
          </div>
        </div>
      `;
      document.body.appendChild(element);

      // 使用 html2canvas 将内容转换为图片
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // 创建 PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 宽度
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.98),
        "JPEG",
        0,
        0,
        imgWidth,
        imgHeight
      );

      // 保存 PDF
      pdf.save(`对话记录_${new Date().toISOString().slice(0, 10)}.pdf`);

      // 清理临时元素
      document.body.removeChild(element);
    } catch (err) {
      console.error("PDF导出失败:", err);
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
      label: "导出PDF",
      onClick: exportToPDF,
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
