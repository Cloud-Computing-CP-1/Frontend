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
      <Link to={projectId ? `/projects/${projectId}` : "/projects"} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6"><FiArrowLeft /> Back to project</Link>
      {userLoading || projectsLoading || imagesLoading ? <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading image...</p>
        : userError ? <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm">Please <Link to="/login" className="text-blue-600 font-semibold">sign in</Link> to view this image.</div>
          : projectsError || imagesError ? <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-rose-700">Could not load image details. <button type="button" onClick={() => { refetchProjects(); if (project) refetch(); }} className="font-semibold underline cursor-pointer">Retry</button></div>
            : !project || !image ? <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm">Image not found for this project.</div>
              : <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-2">Saved image</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Deploy {project.projects_name}</h1>
                <p className="text-sm text-slate-500 mt-2">Review the selected image. This page uses the existing build; it does not build the repository again.</p>
                <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs" aria-label="Selected image details">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5"><div className="flex items-start gap-3 min-w-0"><span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0"><FiBox className="w-5 h-5" /></span><div className="min-w-0"><h2 className="text-base font-semibold break-all">{image.image_tags || `Image #${image.id}`}</h2><p className="text-xs text-slate-500 mt-1 break-all">{projectRepository(project).full_name}</p></div></div><StatusBadge status={image.status_} /></div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 text-sm"><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Branch</dt><dd className="mt-1 inline-flex items-center gap-1.5 text-slate-700"><FiGitBranch /> {image.branch}</dd></div><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Built</dt><dd className="mt-1 text-slate-700">{formatDate(image.build_completed_at || image.created_at)}</dd></div><div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Image URI</dt><dd className="mt-1 font-mono text-xs text-slate-700 break-all">{image.image_uri || "Unavailable"}</dd></div><div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Build ID</dt><dd className="mt-1 font-mono text-xs text-slate-700 break-all">{image.image_digest || "Unavailable"}</dd></div></dl>
                </section>
                <div className="mt-5"><ProjectEnvironment key={projectId} projectId={projectId} /></div>
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">Deployment from a saved image is not connected to a backend deployment action yet.</div>
              </>}
    </div>
  </WorkspaceLayout>;
}
