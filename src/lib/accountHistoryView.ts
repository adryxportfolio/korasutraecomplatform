export function isAccountHistoryView(search: string) {
  const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(normalizedSearch).get("view") === "history";
}
