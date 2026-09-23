import { FiBox, FiGitBranch, FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";
import { UsegetProjectImages } from "../../React-Query/GetProjectImages";

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

const statusStyle = (status: string) => {
  const normalized = status.toLowerCase();
  if (["ready", "success", "succeeded", "completed"].includes(normalized)) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (["failed", "error", "cancelled"].includes(normalized)) return "border-rose-500/30 bg-rose-500/10 text-rose-400";
  if (["building", "pending", "queued"].includes(normalized)) return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  return "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]";
};

export default function ProjectImages({ projectId, currentImageId }: { projectId: string; currentImageId?: string }) {
  const { data: images = [], isLoading, isError, isFetching, refetch } = UsegetProjectImages(projectId);
  const sortedImages = [...images]
    .filter(image => String(image.project_id) === projectId)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return <section className="mt-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs" aria-labelledby="project-images-heading">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <div className="flex items-center gap-2"><h2 id="project-images-heading" className="text-base font-semibold text-[var(--text-primary)]">Image builds</h2>{!isLoading && !isError && <span className="rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">{sortedImages.length}</span>}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Images created from this project, newest first.</p>
      </div>
      <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]/80 disabled:opacity-50 cursor-pointer">
        <FiRefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
      </button>
    </div>

    {isLoading ? <p role="status" className="text-sm text-[var(--text-muted)] py-6">Loading images...</p>
      : isError ? <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">Could not load project images. <button type="button" onClick={() => refetch()} className="font-semibold underline cursor-pointer">Retry</button></div>
      : sortedImages.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center"><FiBox className="w-7 h-7 mx-auto text-[var(--text-muted)]" /><p className="text-sm font-semibold text-[var(--text-primary)] mt-3">No images yet</p><p className="text-xs text-[var(--text-muted)] mt-1">Build an image to see it here.</p></div>
      : <div className="space-y-3">{sortedImages.map(image => <article key={image.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 p-4 sm:p-5 hover:border-[var(--border-secondary)] transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0"><span className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0"><FiBox className="w-4 h-4" /></span><div className="min-w-0"><p className="text-sm font-semibold text-[var(--text-primary)] break-all">{image.image_tags || `Image #${image.id}`}</p><p className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1"><FiGitBranch /> {image.branch}</p></div></div>
          <div className="flex items-center gap-2 shrink-0">{currentImageId === image.id && <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold text-blue-400">Current</span>}<span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle(image.status_)}`}>{image.status_}</span></div>
        </div>
        {image.image_uri && <div className="mt-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Image URI</p><p className="mt-1 text-xs font-mono text-blue-300 break-all">{image.image_uri}</p></div>}
        {image.image_digest && <div className="mt-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Build ID</p><p className="mt-1 text-xs font-mono text-[var(--text-secondary)] break-all">{image.image_digest}</p></div>}
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--text-secondary)]"><span>Started: {formatDate(image.build_start_at)}</span><span>Completed: {formatDate(image.build_completed_at)}</span></div>{["ready", "success", "succeeded", "completed"].includes(image.status_.toLowerCase()) ? <Link to={`/projects/${projectId}/images/${image.id}`} className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Deploy image</Link> : <button type="button" disabled title="This image is not ready to deploy" className="rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] cursor-not-allowed">Deploy image</button>}</div>
      </article>)}</div>}
  </section>;
}
