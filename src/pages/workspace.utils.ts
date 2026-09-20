export function formatTimestamp(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not available";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function statusTone(status: string) {
  const normalized = status.toUpperCase();
  if (["RUNNING", "LIVE", "DEPLOYED", "READY", "SUCCESS", "SUCCEEDED", "COMPLETED"].includes(normalized)) return "success";
  if (["FAILED", "ERROR", "CRASHED"].includes(normalized)) return "danger";
  if (["BUILDING", "DEPLOYING", "PENDING", "QUEUED", "STARTING"].includes(normalized)) return "progress";
  return "neutral";
}
