/**
 * 应用正则表达式模式. 如果提供了 replaceWith 则进行替换, 否则提取匹配内容.
 */
export const applyPattern = (value: string, pattern?: string, replaceWith?: string): string => {
  if (!pattern) return value;
  if (replaceWith) return value.replace(new RegExp(pattern, "i"), replaceWith);
  const match = value.match(new RegExp(pattern, "i"));
  return match?.[1] ?? match?.[0] ?? value;
};
