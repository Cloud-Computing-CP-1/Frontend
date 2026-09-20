import type { ReactNode } from "react";
import { FiBox } from "react-icons/fi";
import { statusTone } from "../workspace.utils";

export function StatusBadge({ status }: { status?: string | null }) {
  const value = status || "Unknown";
  return <span key={value} className={`dfw-status dfw-status-${statusTone(value)}`}><i aria-hidden="true" />{value.replaceAll("_", " ").toLowerCase()}</span>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="dfw-empty"><span className="dfw-icon"><FiBox /></span><h2>{title}</h2><p>{children}</p>{action}</div>;
}

export function LoadingCards() {
  return <div role="status" className="dfw-loading"><span className="sr-only">Loading workspace...</span>{[0, 1, 2].map(item => <div key={item} className="dfw-skeleton" />)}</div>;
}
