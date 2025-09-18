export const formatDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatDateTime = (isoDate: string): string =>
  new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const daysSince = (isoDate: string): number => {
  const target = new Date(isoDate).getTime();
  const diff = Date.now() - target;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const formatRelative = (isoDate: string): string => {
  const diffDays = daysSince(isoDate);
  if (diffDays <= 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "1 day ago";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} wk${diffWeeks > 1 ? "s" : ""} ago`;
  }
  return formatDate(isoDate);
};
