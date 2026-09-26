import { useState, type FormEvent } from "react";
import { FiArrowLeft, FiArrowRight, FiBox, FiGitBranch, FiGithub, FiKey, FiLayers, FiPlus, FiSearch, FiSettings } from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { UsergetUser } from "../React-Query/Auth";
import { UsegetMyrepo } from "../React-Query/GetMyRepo";
import { UsegetProjects } from "../React-Query/GetProjects";
import { useQueryClient } from "@tanstack/react-query";
import type { RepoItem } from "./Components/AllRepo";
import { projectRepository } from "./project.service";
import { UseStateContext } from "../context/AuthContext";
import CurrentProjectImage from "./Components/CurrentProjectImage";
import ProjectEnvironment from "./Components/ProjectEnvironment";
import WorkspaceLayout from "./Components/WorkspaceLayout";
import ProjectSettings from "./Components/ProjectSettings";
import DeploymentLink from "./Components/DeploymentLink";
import ProjectDeployments from "./Components/ProjectDeployments";
import DeployProject from "./Components/DeployProject";

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const showingEnvironment = searchParams.get("tab") === "environment";
  const showingSettings = searchParams.get("tab") === "settings";
  const showingDeployments = searchParams.get("tab") === "deployments";
  const { data: user, isLoading: userLoading, isError: userError } = UsergetUser();
  const { data: repos, isLoading: reposLoading, isError: reposError, refetch } = UsegetMyrepo();
  const { data: allProjects = [], isLoading: projectsLoading, isError: projectsError, refetch: refetchProjects } = UsegetProjects();
  const queryClient = useQueryClient();
  const userId = user?.id == null ? "" : String(user.id);
  const projects = allProjects.filter(item => String(item.user_id) === userId);
  const project = projects.find(item => String(item.id) === projectId);
  const [creating, setCreating] = useState(Boolean(location.state?.openCreate));
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RepoItem | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const repoList: RepoItem[] = Array.isArray(repos) ? repos : [];
  const filtered = repoList.filter(repo => `${repo.full_name} ${repo.name}`.toLowerCase().includes(search.toLowerCase()));

  const close = () => {
    setCreating(false);
    setName("");
    setSearch("");
    setSelected(null);
    setError("");
  };
  const { axiosInstance } = UseStateContext()!
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !userId || !name.trim() || !selected || saving) return;
    setSaving(true);
    try {
      const response = await axiosInstance.post("/project/create", {
        project_name: name.trim(),
        repo_name: selected.clone_url || selected.html_url,
        repo_id: selected.id,
        repo_owner: selected.owner?.login || selected.full_name.split("/")[0],
        repo_branch: selected.default_branch || "main",
        repo_email: user.email
      });
      if (!response.data.Status || response.data.responseData?.id == null) throw new Error("Project creation failed.");
      await queryClient.invalidateQueries({ queryKey: ["get-projects"] });
      close();
      navigate(`/projects/${response.data.responseData.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) return <main className="min-h-screen bg-[var(--background)] flex items-center justify-center text-sm text-[var(--text-secondary)]">Loading your projects...</main>;
  if (userError || !userId) return <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4"><div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 text-center"><p className="text-sm text-[var(--text-secondary)] mb-4">Please sign in to view your projects.</p><Link to="/login" className="text-[var(--primary)] font-semibold">Go to login</Link></div></main>;

  const projectRepositoryInfo = project ? projectRepository(project) : null;

  return <WorkspaceLayout user={user} active={showingDeployments ? "deployments" : showingEnvironment ? "environment" : showingSettings ? "settings" : "projects"} projectId={project?.id}>
    <section className="dfw-page-enter">
      <div>
        {projectsLoading ? <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-sm text-[var(--text-secondary)]">Loading projects...</div> : projectsError ? <div role="alert" className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-sm text-rose-400">Could not load projects. <button type="button" onClick={() => refetchProjects()} className="text-[var(--primary)] font-semibold cursor-pointer">Retry</button></div> : projectId ? project ? <>
          <Link to="/projects" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] mb-6"><FiArrowLeft /> All projects</Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-400 mb-2">Project workspace</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words text-[var(--text-primary)]">{project.projects_name}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Your deployments, image builds, and application configuration, in one place.</p>
            </div>
            <button type="button" onClick={() => navigate("/build", { state: { repo: projectRepositoryInfo, projectId: project.id } })} className="inline-flex items-center justify-center gap-2 shrink-0 bg-[var(--primary)] hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-xs font-semibold shadow-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><FiBox className="w-4 h-4" /> Build Image</button>
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-xs xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"><FiGithub className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[11px] text-[var(--text-muted)]">Source repository</p><p className="mt-1 break-all text-sm font-medium text-[var(--text-primary)]">{projectRepositoryInfo?.full_name}</p></div></div>
            <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]"><FiGitBranch /> {project.branch}</span><span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-400">{project.statuss}</span></div>
          </div>
          <DeploymentLink url={project.deployment_url} projectName={project.projects_name} cloudProvider={project.cloud_provider} />
          {!showingEnvironment && !showingSettings && <DeployProject key={project.id} projectId={String(project.id)} />}
          <nav aria-label="Project sections" className="mt-7 mb-6 flex flex-wrap gap-x-6 border-b border-[var(--border)]">
            <Link to={`/projects/${project.id}`} aria-current={!showingEnvironment && !showingSettings && !showingDeployments ? "page" : undefined} className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${!showingEnvironment && !showingSettings && !showingDeployments ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}><FiBox /> Overview & builds</Link>
            <Link to={`/projects/${project.id}?tab=deployments`} aria-current={showingDeployments ? "page" : undefined} className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${showingDeployments ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}><FiLayers /> Deployments</Link>
            <Link to={`/projects/${project.id}?tab=environment`} aria-current={showingEnvironment ? "page" : undefined} className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${showingEnvironment ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}><FiKey /> Environment variables</Link>
            <Link to={`/projects/${project.id}?tab=settings`} aria-current={showingSettings ? "page" : undefined} className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${showingSettings ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}><FiSettings /> Settings</Link>
          </nav>
          <div key={`${project.id}-${searchParams.get("tab")}`} className="dfw-page-enter">{showingEnvironment ? <ProjectEnvironment key={project.id} projectId={project.id} /> : showingSettings ? <ProjectSettings project={project} /> : showingDeployments ? <ProjectDeployments key={project.id} projectId={String(project.id)} /> : <><ProjectDeployments key={project.id} projectId={String(project.id)} compact /><CurrentProjectImage projectId={project.id} /></>}</div>
        </> : <div role="alert" className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8"><h1 className="font-semibold text-[var(--text-primary)]">Project not found</h1><Link to="/projects" className="text-[var(--primary)] text-sm mt-3 inline-block">Back to Projects</Link></div> : <>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8"><div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-400 mb-2">Your workspace</p><h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Projects</h1><p className="text-sm text-[var(--text-secondary)] mt-2">Your repositories, organized for image building.</p></div><button type="button" onClick={() => setCreating(true)} className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-xs font-semibold shadow-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><FiPlus className="w-4 h-4" /> Create Project</button></div>
          {projects.length ? <><div className="flex items-center justify-between mb-4"><h2 className="text-base font-semibold text-[var(--text-primary)]">Your projects</h2><span className="text-xs text-[var(--text-muted)]">{projects.length} {projects.length === 1 ? "project" : "projects"}</span></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{projects.map(item => <article key={item.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs hover:border-[var(--border-secondary)] hover:shadow-md transition-all flex flex-col"><div className="flex items-start justify-between gap-3"><span className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center"><FiLayers className="w-5 h-5" /></span><span className="text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-secondary)] border border-[var(--border)] rounded-full px-2.5 py-1">{item.statuss}</span></div><h3 className="text-base font-semibold break-words mt-5 text-[var(--text-primary)]">{item.projects_name}</h3><p className="text-xs text-[var(--text-secondary)] mt-1 break-all">{projectRepository(item).full_name}</p><div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-4"><FiGitBranch /> {item.branch}</div><DeploymentLink url={item.deployment_url} projectName={item.projects_name} cloudProvider={item.cloud_provider} /><div className="mt-5 pt-4 border-t border-[var(--border)]"><Link to={`/projects/${item.id}`} className="inline-flex items-center gap-2 text-[var(--primary)] text-xs font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Open project <FiArrowRight /></Link></div></article>)}</div></> : <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 sm:p-12 text-center"><FiGithub className="mx-auto text-blue-400 w-8 h-8" /><h2 className="text-base font-semibold mt-3 text-[var(--text-primary)]">No projects yet</h2><p className="text-sm text-[var(--text-secondary)] mt-2">Choose a GitHub repository to create your first project.</p><button type="button" onClick={() => setCreating(true)} className="mt-5 bg-[var(--primary)] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer">Create Project</button></div>}
        </>}
      </div>
    </section>
    {creating && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={close}><form onSubmit={create} role="dialog" aria-modal="true" aria-labelledby="create-project-title" onClick={event => event.stopPropagation()} className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl"><h2 id="create-project-title" className="text-lg font-semibold text-[var(--text-primary)]">Create Project</h2><label htmlFor="project-name" className="block text-xs font-semibold mt-5 mb-2 text-[var(--text-secondary)]">Project Name</label><input id="project-name" autoFocus maxLength={100} value={name} onChange={event => setName(event.target.value)} className="w-full border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]" placeholder="My project" /><label htmlFor="repo-search" className="block text-xs font-semibold mt-5 mb-2 text-[var(--text-secondary)]">Repository</label><div className="relative"><FiSearch className="absolute left-3 top-3 text-[var(--text-muted)]" /><input id="repo-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search repositories..." className="w-full border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]" /></div>
      <div className="mt-3 border border-[var(--border)] bg-[var(--surface-secondary)] rounded-lg max-h-56 overflow-y-auto" role="radiogroup" aria-label="Repositories">{reposLoading ? <p className="p-4 text-sm text-[var(--text-muted)]">Loading repositories...</p> : reposError ? <div className="p-4 text-sm text-rose-400" role="alert">Could not load repositories. <button type="button" onClick={() => refetch()} className="underline cursor-pointer">Retry</button></div> : filtered.length ? filtered.map(repo => <label key={repo.id} className={`flex items-start gap-3 p-3 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--surface)]/80 transition-colors ${selected?.id === repo.id ? "bg-blue-600/15 border-blue-500/30" : ""}`}><input type="radio" name="repository" checked={selected?.id === repo.id} onChange={() => { setSelected(repo); if (!name.trim()) setName(repo.name); }} className="mt-1 accent-blue-600" /><span className="min-w-0"><span className="block text-sm font-medium break-all text-[var(--text-primary)]">{repo.full_name}</span><span className="block text-xs text-[var(--text-muted)] mt-1">{repo.private ? "Private" : "Public"} · {repo.default_branch || "Default branch unavailable"}</span></span></label>) : <p className="p-4 text-sm text-[var(--text-muted)]">{repoList.length ? "No repositories match your search." : "No connected repositories found."}</p>}</div>
      {error && <p role="alert" className="text-xs text-rose-400 mt-3">{error}</p>}<div className="flex justify-end gap-3 mt-6"><button type="button" onClick={close} className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">Cancel</button><button type="submit" disabled={!name.trim() || !selected || !userId || saving} className="px-5 py-2 rounded-lg bg-[var(--primary)] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">{saving ? "Creating..." : "Create Project"}</button></div></form></div>}
  </WorkspaceLayout>;
}
