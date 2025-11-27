export const safeText = (content) => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  if (typeof content === 'object') return content.text || content.label || content.value || "";
  return String(content);
};

