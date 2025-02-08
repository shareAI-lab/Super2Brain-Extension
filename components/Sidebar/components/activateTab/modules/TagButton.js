import { memo } from "react";
import { Tooltip } from "react-tooltip";

const TagButton = memo(
  ({ tag, isFirstTag, isAiThinking, onTagClick, useInput }) => {
    const getTagButtonClassName = () => {
      const baseClass = `tags-button-${tag.type}`;
      const commonClasses = `
      p-2 rounded-xl
      flex items-center justify-center
      transition-all duration-200
      shadow-sm hover:shadow-md
    `;

      const disabledStyle = "bg-gray-100 text-gray-400 cursor-not-allowed";

      const activeStyles = isFirstTag
        ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
        : "bg-white text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200";

      return `${baseClass} ${commonClasses} ${
        tag.disabled || isAiThinking ? disabledStyle : activeStyles
      }`;
    };

    return (
      <button
        onClick={() => {
          if (tag.type === "bookmark" && !useInput) return;
          onTagClick(tag.prompt, tag.type);
        }}
        disabled={tag.disabled || isAiThinking}
        className={getTagButtonClassName()}
      >
        <tag.icon
          className={`w-4 h-4 ${tag.type === "screenshot" ? "-rotate-90" : ""}`}
        />
        <Tooltip
          style={{ borderRadius: "8px" }}
          anchorSelect={`.tags-button-${tag.type}`}
          place="top"
        >
          {tag.type === "bookmark" && !useInput
            ? "请先登录才能将网页导入知识库"
            : tag.text}
        </Tooltip>
      </button>
    );
  }
);

TagButton.displayName = "TagButton";

export { TagButton };
