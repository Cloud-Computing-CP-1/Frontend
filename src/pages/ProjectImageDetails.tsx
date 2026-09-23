import { FiArrowLeft, FiBox, FiGitBranch } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { UsergetUser } from "../React-Query/Auth";
import { UsegetProjects } from "../React-Query/GetProjects";
import { UsegetProjectImages } from "../React-Query/GetProjectImages";
import WorkspaceLayout from "./Components/WorkspaceLayout";
import ProjectEnvironment from "./Components/ProjectEnvironment";
import { StatusBadge } from "./Components/WorkspaceUI";
import { projectRepository } from "./project.service";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function ProjectImageDetails() {
  const { projectId = "", imageId = "" } = useParams();
  const { data: user, isLoading: userLoading, isError: userError } = UsergetUser();
  const { data: projects = [], isLoading: projectsLoading, isError: projectsError, refetch: refetchProjects } = UsegetProjects();
  const project = projects.find(item => String(item.id) === projectId && String(item.user_id) === String(user?.id));
  const { data: images = [], isLoading: imagesLoading, isError: imagesError, refetch } = UsegetProjectImages(projectId, Boolean(project));
  const image = images.find(item => String(item.id) === imageId && String(item.project_id) === projectId);

  return <WorkspaceLayout user={user} active="deployments" projectId={project?.id}>
    <div className="dfw-page-enter">
      <Link to={projectId ? `/projects/${projectId}` : "/projects"} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] mb-6"><FiArrowLeft /> Back to project</Link>
      {userLoading || projectsLoading || imagesLoading ? <p role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-muted)]">Loading image...</p>
        : userError ? <div role="alert" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-secondary)]">Please <Link to="/login" className="text-[var(--primary)] font-semibold">sign in</Link> to view this image.</div>
          : projectsError || imagesError ? <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-sm text-rose-400">Could not load image details. <button type="button" onClick={() => { refetchProjects(); if (project) refetch(); }} className="font-semibold underline cursor-pointer">Retry</button></div>
            : !project || !image ? <div role="alert" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-secondary)]">Image not found for this project.</div>
              : <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2">Saved image</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Deploy {project.projects_name}</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Review the selected image. This page uses the existing build; it does not build the repository again.</p>
                <section className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 shadow-xs" aria-label="Selected image details">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-5"><div className="flex items-start gap-3 min-w-0"><span className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0"><FiBox className="w-5 h-5" /></span><div className="min-w-0"><h2 className="text-base font-semibold break-all text-[var(--text-primary)]">{image.image_tags || `Image #${image.id}`}</h2><p className="text-xs text-[var(--text-muted)] mt-1 break-all">{projectRepository(project).full_name}</p></div></div><StatusBadge status={image.status_} /></div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 text-sm"><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Branch</dt><dd className="mt-1 inline-flex items-center gap-1.5 text-[var(--text-primary)]"><FiGitBranch /> {image.branch}</dd></div><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Built</dt><dd className="mt-1 text-[var(--text-primary)]">{formatDate(image.build_completed_at || image.created_at)}</dd></div><div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Image URI</dt><dd className="mt-1 font-mono text-xs text-blue-300 break-all">{image.image_uri || "Unavailable"}</dd></div><div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Build ID</dt><dd className="mt-1 font-mono text-xs text-[var(--text-secondary)] break-all">{image.image_digest || "Unavailable"}</dd></div></dl>
                </section>
                <div className="mt-5"><ProjectEnvironment key={projectId} projectId={projectId} /></div>
                <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-300">Deployment from a saved image is not connected to a backend deployment action yet.</div>
              </>}
    </div>
  </WorkspaceLayout>;
}
