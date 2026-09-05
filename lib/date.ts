/**
 * Format a Date object according to the active locale
 */
export function formatLocalizedDate(date: Date, locale: string): string {
  if (locale === "zh-cn") {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    return `${month}月${day}日 ${dayNames[date.getDay()]}`;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
