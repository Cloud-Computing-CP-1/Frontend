import { useState } from "react";
import { FiEye, FiEyeOff, FiKey, FiLock, FiRefreshCw, FiSearch } from "react-icons/fi";
import { UsegetProjectEnv } from "../../React-Query/GetProjectEnv";

export default function ProjectEnvironment({ projectId }: { projectId: string }) {
  const { data: variables = [], isLoading, isError, isFetching, refetch } = UsegetProjectEnv(projectId);
  const [search, setSearch] = useState("");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const filtered = variables.filter(variable => variable.key.toLowerCase().includes(search.toLowerCase()));

  const toggleValue = (key: string) => {
    setRevealed(previous => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return <section aria-labelledby="environment-heading" className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400"><FiKey className="h-5 w-5" /></span>
        <div>
          <h2 id="environment-heading" className="text-base font-semibold text-[var(--text-primary)]">Environment variables</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Saved configuration for this project.</p>
        </div>
      </div>
      <button type="button" disabled={isFetching} onClick={() => { setRevealed(new Set()); void refetch(); }} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 cursor-pointer">
        <FiRefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} /> Refresh
      </button>
    </div>

    {isLoading ? <div role="status" className="p-6 text-sm text-[var(--text-muted)]">Loading environment variables...</div>
      : isError ? <div role="alert" className="m-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">Could not load environment variables. <button type="button" onClick={() => void refetch()} className="font-semibold underline cursor-pointer">Try again</button></div>
      : variables.length === 0 ? <div className="px-6 py-14 text-center">
        <FiKey className="mx-auto h-7 w-7 text-[var(--text-muted)]" />
        <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">No environment variables yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">Variables saved during deployment setup will appear here for this project.</p>
      </div>
      : <>
        <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search environment variable names</span>
            <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]" />
          </label>
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span>{variables.length} {variables.length === 1 ? "variable" : "variables"}</span>
            {revealed.size > 0 && <button type="button" onClick={() => setRevealed(new Set())} className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary)] hover:underline cursor-pointer"><FiEyeOff /> Hide all values</button>}
          </div>
        </div>
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 border-b border-[var(--border)] px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:grid"><span>Name</span><span>Value</span></div>
        <dl className="divide-y divide-[var(--border)]">
          {filtered.map(variable => <div key={variable.key} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-start sm:gap-6 sm:px-6">
            <dt className="break-all font-mono text-xs font-semibold leading-8 text-[var(--text-primary)]">{variable.key}</dt>
            <dd className="flex min-w-0 items-start gap-3">
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-all rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] px-3 py-2 font-mono text-xs leading-5 text-[var(--text-secondary)]">{revealed.has(variable.key) ? (variable.value || "(empty)") : <><span aria-hidden="true">••••••••••••</span><span className="sr-only">Value hidden</span></>}</span>
              <button type="button" onClick={() => toggleValue(variable.key)} aria-label={`${revealed.has(variable.key) ? "Hide" : "Reveal"} ${variable.key} value`} aria-pressed={revealed.has(variable.key)} title={revealed.has(variable.key) ? "Hide value" : "Reveal value"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-blue-600 cursor-pointer">{revealed.has(variable.key) ? <FiEyeOff /> : <FiEye />}</button>
            </dd>
          </div>)}
        </dl>
        {filtered.length === 0 && <p role="status" className="p-8 text-center text-sm text-[var(--text-muted)]">No variable names match your search.</p>}
        <div className="flex items-start gap-2 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 px-5 py-4 text-xs leading-5 text-[var(--text-muted)] sm:px-6"><FiLock className="mt-0.5 shrink-0" /><p>Values are hidden by default. Reveal a value only when you need to inspect it.</p></div>
      </>}
  </section>;
}
