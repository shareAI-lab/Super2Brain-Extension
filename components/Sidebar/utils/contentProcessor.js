const processImageByModel = (item, model) => {
  if (item.type !== "image_url") return "";

  const imageUrl = item.image_url.url;
  const isClaudeModel = /claude/i.test(model);

  return isClaudeModel
    ? `<image>${imageUrl}</image>`
    : `![image](${imageUrl})`;
};

export const processContent = (content, model, imageData = null) => {
  if (!Array.isArray(content)) {
    const messages = [{ type: "text", text: content }];
    if (imageData) {
      messages.push({
        type: "image_url",
        image_url: { url: imageData },
      });
    }
    return messages;
  }

  const typeHandlers = {
    text: (item) => item.text,
    image_url: (item) => processImageByModel(item, model),
    default: () => "",
  };

  return content
    .map((item) => (typeHandlers[item.type] || typeHandlers.default)(item))
    .filter(Boolean)
    .join("\n");
}; 