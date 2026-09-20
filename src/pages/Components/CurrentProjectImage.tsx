import { FiBox, FiGitBranch, FiRefreshCw } from "react-icons/fi";
import { UsegetCurrentProjectImage } from "../../React-Query/GetCurrentProjectImage";
import ProjectImages from "./ProjectImages";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function CurrentProjectImage({ projectId }: { projectId: string }) {
  const { data: image, isLoading, isError, isFetching, refetch } = UsegetCurrentProjectImage(projectId);

  return <>
    <section className="mt-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs" aria-labelledby="current-image-heading">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div><h2 id="current-image-heading" className="text-base font-semibold text-slate-900">Application running on this image</h2><p className="text-xs text-slate-500 mt-1">The image currently selected for this project.</p></div>
        <button type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh current image" className="w-8 h-8 shrink-0 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"><FiRefreshCw className={isFetching ? "animate-spin" : ""} /></button>
      </div>
      {isLoading ? <p role="status" className="text-sm text-slate-500 py-4">Loading current image...</p>
        : isError ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Could not load the current image. <button type="button" onClick={() => refetch()} className="font-semibold underline cursor-pointer">Retry</button></div>
        : !image ? <div className="rounded-xl border border-dashed border-slate-200 p-6 flex items-center gap-3"><span className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><FiBox /></span><p className="text-sm text-slate-500">No current image yet. Build an image to add one.</p></div>
          : <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-900 break-all">{image.image_tags || `Image #${image.id}`}</p><p className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-1"><FiGitBranch /> {image.branch}</p></div><span className="rounded-full bg-white border border-blue-200 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Current · {image.status_}</span></div>
            {image.image_uri && <div className="mt-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Image URI</p><p className="mt-1 text-xs font-mono text-slate-800 break-all">{image.image_uri}</p></div>}
            <div className="mt-4 pt-3 border-t border-blue-100 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500"><span>Build ID: <span className="font-mono break-all">{image.image_digest || "—"}</span></span><span>Built: {formatDate(image.build_completed_at || image.created_at)}</span></div>
          </div>}
    </section>
    <ProjectImages projectId={projectId} currentImageId={image?.id} />
  </>;
}
