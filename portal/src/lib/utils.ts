/**
 * Generates a consistent color for a given admin name.
 * Uses a simple hash so the same name always maps to the same color.
 */
export function getColorFromName(name: string): string {
  if (!name) return "#6c5ce7";
  const colors = [
    "#2e8555", "#e05c2a", "#6c5ce7", "#0984e3",
    "#00b894", "#d63031", "#fdcb6e", "#e84393",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

/**
 * Formats an ISO date string as a human-readable relative time.
 * e.g. "just now", "5 minutes ago", "2 hours ago", "Mar 3 at 2:22 PM"
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
