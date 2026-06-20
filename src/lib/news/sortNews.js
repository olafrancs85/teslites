function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function isTodayDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return false;
  const now = new Date();
  // Use local date (getFullYear/getMonth/getDate) for "today" comparisons
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isTeslaItem(item) {
  const text = `${item.title ?? ""} ${item.description ?? ""} ${item.source ?? ""}`.toLowerCase();
  return /\btesla\b/i.test(text);
}

function compareNews(a, b) {
  // Priority order:
  // 1) isToday (true first)
  // 2) isTesla (true first)
  // 3) publishedAt (most recent first)

  const aToday = isTodayDate(a.publishedAt ?? a.published) ? 1 : 0;
  const bToday = isTodayDate(b.publishedAt ?? b.published) ? 1 : 0;
  if (aToday !== bToday) return bToday - aToday; // today-first

  const aTesla = isTeslaItem(a) ? 1 : 0;
  const bTesla = isTeslaItem(b) ? 1 : 0;
  if (aTesla !== bTesla) return bTesla - aTesla; // Tesla-first within same day-group

  // Fallback to published date (most recent first)
  const dateA = parseDate(a.publishedAt ?? a.published);
  const dateB = parseDate(b.publishedAt ?? b.published);

  if (dateA && dateB) return dateB.getTime() - dateA.getTime();
  if (dateA && !dateB) return -1;
  if (!dateA && dateB) return 1;

  return 0;
}

function sortNews(items) {
  return [...items].sort(compareNews);
}

module.exports = {
  sortNews,
  compareNews,
};
