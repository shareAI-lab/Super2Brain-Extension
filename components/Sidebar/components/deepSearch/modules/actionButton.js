import { MessageSquarePlus, Save, Copy } from "lucide-react";
import { marked } from "marked";

import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ActionButtons = ({
  messages,
  setQuery,
  setMessages,
  setIsDeepThingActive,
  setShowTextArea,
}) => {
  const handleExportPDF = async () => {
    try {
      const userQuestion = messages[messages.length - 2]?.content || "对话记录";
      const content = messages[messages.length - 1].content;

      // 创建临时div并设置基本样式
      const tempDiv = document.createElement("div");
      tempDiv.className = "markdown-body";
      Object.assign(tempDiv.style, {
        
        position: "absolute", // 改为absolute
        width: "170mm",
        left: "-9999px", // 移到屏幕外
        top: 0,
        backgroundColor: "#ffffff",
        padding: "24px",
        margin: "0",
        visibility: "visible", // 保持可见性
      });

      // 使用DOMParser解析markdown内容
      const parsedContent = marked.parse(content);
      tempDiv.innerHTML = `
        <h2 style="margin-bottom: 1rem;">@deepSearch ${userQuestion}</h2>
        <div style="font-size: 14px;">${parsedContent}</div>
      `;
      document.body.appendChild(tempDiv);

      // 等待图片加载完成
      const loadImages = async () => {
        const images = tempDiv.getElementsByTagName("img");
        const imagePromises = Array.from(images).map((img) => {
          return new Promise((resolve, reject) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = resolve;
              img.onerror = reject;
            }
          });
        });
        await Promise.all(imagePromises);
      };

      await loadImages();

      // 使用html2canvas截图
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
      });

      // 创建PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");

      // 定义页面参数
      const pageWidth = 210; // A4宽度(mm)
      const pageHeight = 297; // A4高度(mm)
      const margins = {
        top: 10,
        bottom: 15, // 留出更多空间给页脚
        left: 10,
        right: 10,
      };

      // 计算实际可用宽度和图片尺寸
      const contentWidth = pageWidth - margins.left - margins.right;
      const contentHeight = pageHeight - margins.top - margins.bottom;

      // 保持宽高比计算图片尺寸
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      while (heightLeft > 0) {
        if (position === 0) {
          pdf.addImage(
            imgData,
            "PNG",
            margins.left,
            margins.top,
            imgWidth,
            imgHeight
          );
        } else {
          pdf.addPage();
          // 调整位置以显示下一部分图片
          pdf.addImage(
            imgData,
            "PNG",
            margins.left, // 左边距
            margins.top - position, // 向上偏移以显示下一部分
            imgWidth,
            imgHeight
          );
        }

        // 添加页脚
        const footer = `导出时间：${new Date().toLocaleString()} - 第 ${pageNumber} 页`;
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(footer, margins.left, pageHeight - 5);

        heightLeft -= contentHeight;
        position += contentHeight;
        pageNumber++;
      }

      pdf.save(`对话记录_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF导出失败:", err);
      alert("PDF导出失败: " + err.message);
    } finally {
      // 确保清理临时元素
      const tempDiv = document.querySelector(".markdown-body");
      if (tempDiv) {
        document.body.removeChild(tempDiv);
      }
    }
  };

  const handleCopyContent = () => {
    const content = messages[messages.length - 1].content;
    navigator.clipboard.writeText(content);
  };

  const handleNewChat = () => {
    setQuery("");
    setMessages([]);
    setShowTextArea(false);
    setIsDeepThingActive(false);
  };

  return (
    <div className="flex items-center gap-3 px-2 py-3">
      {messages.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 
            bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 
            hover:text-indigo-600 transition-colors"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="w-4 h-4" />
          新对话
        </motion.button>
      )}

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 
          bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 
          hover:text-indigo-600 transition-colors"
        onClick={handleExportPDF}
      >
        <Save className="w-4 h-4" />
        保存PDF
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 
          bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 
          hover:text-indigo-600 transition-colors"
        onClick={handleCopyContent}
      >
        <Copy className="w-4 h-4" />
        复制内容
      </motion.button>
    </div>
  );
};

export { ActionButtons };
