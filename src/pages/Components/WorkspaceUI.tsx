import type { ReactNode } from "react";
import { FiBox } from "react-icons/fi";
import { statusTone } from "../workspace.utils";
import { FiCheckCircle, FiClock, FiLoader, FiStopCircle, FiXCircle, FiHelpCircle } from "react-icons/fi";
import "./StatusBadge.css";

export function StatusBadge({ status }: { status?: string | null }) {
  const value = status || "Unknown";
  const normalized = value.trim().toUpperCase();
  const tone = statusTone(normalized);
  const waiting = ["PENDING", "QUEUED"].includes(normalized);
  const working = tone === "progress" && !waiting;
  const stopped = ["STOPPED", "PAUSED", "SUSPENDED"].includes(normalized);
  const Icon = waiting ? FiClock : working ? FiLoader : tone === "success" ? FiCheckCircle : tone === "danger" ? FiXCircle : stopped ? FiStopCircle : FiHelpCircle;
  return <span key={value} className={`dfw-status dfw-status-${tone}`} role="status"><Icon aria-hidden="true" className={`dfw-status-icon${working ? " dfw-status-loading" : waiting ? " dfw-status-waiting" : ""}`} />{value.replaceAll("_", " ").toLowerCase()}</span>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="dfw-empty"><span className="dfw-icon"><FiBox /></span><h2>{title}</h2><p>{children}</p>{action}</div>;
}

export function LoadingCards() {
  return <div role="status" className="dfw-loading"><span className="sr-only">Loading workspace...</span>{[0, 1, 2].map(item => <div key={item} className="dfw-skeleton" />)}</div>;
}
