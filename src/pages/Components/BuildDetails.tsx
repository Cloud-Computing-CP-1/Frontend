import { useState } from "react";
import { FiBox, FiCopy, FiCheck } from "react-icons/fi";

export interface BuildResult {
  id: string;
  providerBuildId: string;
  status: string;
  repository: { url: string; owner: string; name: string };
  project: { language: string; framework: string; port: number; dockerfileGenerated: boolean };
  image: { registry: string; repository: string; tag: string; reference: string; pullCommand: string };
  errorMessage?: string;
  logsUrl?: string;
}

export default function BuildDetails({ build, message }: { build: BuildResult; message: string }) {
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setCopyError("");
    } catch {
      setCopyError("Copy unavailable. Select and copy the text below.");
    }
  };
  const fields = [
    ["Build ID", build.id], ["Provider build ID", build.providerBuildId],
    ["Status", build.status], ["Repository URL", build.repository.url],
    ["Owner", build.repository.owner], ["Repository name", build.repository.name],
    ["Language", build.project.language], ["Framework", build.project.framework],
    ["Container port", String(build.project.port)],
    ["Dockerfile generated", build.project.dockerfileGenerated ? "Yes" : "No"],
    ["Registry", build.image.registry], ["Image repository", build.image.repository],
    ["Image tag", build.image.tag],
  ];
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><FiBox /></div>
        <div><h2 className="text-sm font-bold text-slate-900">Build details</h2>
          <p className="text-xs text-slate-500 mt-1">API message: {message} · Request accepted</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(([label, value]) => (
          <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
            <dt className="text-[10px] uppercase tracking-wide font-bold text-slate-500">{label}</dt>
            <dd className="text-xs text-slate-900 mt-1.5 break-all font-mono">{value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
      {[["Image reference", build.image.reference], ["Pull command", build.image.pullCommand]].map(([label, value]) => (
        <div key={label} className="mt-4 p-4 bg-slate-900 rounded-xl text-slate-100">
          <div className="flex justify-between items-center gap-3 mb-2">
            <span className="text-xs text-blue-300 font-semibold">{label}</span>
            <button onClick={() => copy(value, label)} className="flex items-center gap-1.5 text-xs p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
              {copied === label ? <FiCheck /> : <FiCopy />}{copied === label ? "Copied" : "Copy"}
            </button>
          </div>
          <code className="text-xs break-all">{value}</code>
        </div>
      ))}
      {copyError && <p role="status" className="text-xs text-amber-700 mt-3">{copyError}</p>}
      {build.errorMessage && <p role="alert" className="text-sm text-rose-700 mt-4">{build.errorMessage}</p>}
      {build.logsUrl?.startsWith("https://") && <a className="inline-block text-blue-600 text-xs mt-4 underline" href={build.logsUrl} target="_blank" rel="noreferrer">Open provider logs</a>}
    </section>
  );
}
