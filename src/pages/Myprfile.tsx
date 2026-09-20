import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiActivity, FiArrowUpRight, FiBox, FiGitBranch, FiLayers, FiPlus, FiRefreshCw, FiSearch } from "react-icons/fi";
import { UsergetUser } from "../React-Query/Auth";
import { UsegetProjects } from "../React-Query/GetProjects";
import WorkspaceLayout from "./Components/WorkspaceLayout";
import { EmptyState, LoadingCards, StatusBadge } from "./Components/WorkspaceUI";
import { formatTimestamp } from "./workspace.utils";
import ProjectActivity from "./Components/ProjectActivity";
import ProjectEnvironment from "./Components/ProjectEnvironment";
import ProjectSettings from "./Components/ProjectSettings";
import { projectRepository } from "./project.service";

const pages = {
  overview: { title: "Workspace overview", description: "Your projects, builds, and application configuration." },
  deployments: { title: "Deployments", description: "Inspect project status, current images, and build history." },
  environment: { title: "Environment", description: "Inspect the saved configuration for each project." },
  settings: { title: "Workspace settings", description: "Your account and connected project configuration." },
};

export default function Myprfile() {
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = UsergetUser();
  const { data = [], isLoading, isError, isFetching, refetch } = UsegetProjects(Boolean(user?.id) && !userError);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const viewParam = params.get("view");
  const view = viewParam === "deployments" || viewParam === "environment" || viewParam === "settings" ? viewParam : "overview";
  const page = pages[view];
  const projects = data.filter(project => String(project.user_id) === String(user?.id)).sort((a, b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at));
  const selected = projects.find(project => String(project.id) === params.get("project")) || projects[0];
  const filtered = projects.filter(project => `${project.projects_name} ${projectRepository(project).full_name}`.toLowerCase().includes(search.toLowerCase()));
  const selectProject = (id: string) => setParams(previous => { const next = new URLSearchParams(previous); next.set("project", id); return next; });
  const running = projects.filter(project => ["RUNNING", "LIVE", "DEPLOYED"].includes(project.statuss.toUpperCase())).length;
  const stopped = projects.filter(project => ["STOPPED", "PAUSED", "SUSPENDED"].includes(project.statuss.toUpperCase())).length;
  const failed = projects.filter(project => ["FAILED", "ERROR", "CRASHED"].includes(project.statuss.toUpperCase())).length;
  const createAction = <Link className="dfw-button dfw-primary" to="/projects" state={{ openCreate: true }}><FiPlus /> New project</Link>;

  return <WorkspaceLayout user={user} active={view}>
    <header className="dfw-page-header"><div><p className="dfw-eyebrow">Personal workspace</p><h1>{page.title}</h1><p>{page.description}</p></div><div className="dfw-header-actions"><button type="button" className="dfw-button dfw-icon-button" aria-label="Refresh projects" disabled={isFetching || !user} onClick={() => void refetch()}><FiRefreshCw className={isFetching ? "dfw-spin" : ""} /></button>{user && createAction}</div></header>
    {userLoading ? <LoadingCards /> : userError || !user ? <section className="dfw-panel"><EmptyState title="Your workspace could not be loaded" action={<div className="dfw-quick-actions"><button className="dfw-button" onClick={() => void refetchUser()}>Try again</button><Link className="dfw-button dfw-primary" to="/login">Login</Link></div>}>Check your connection or sign in to continue.</EmptyState></section> : isLoading ? <LoadingCards /> : isError ? <section className="dfw-panel"><EmptyState title="Could not load projects" action={<button className="dfw-button" onClick={() => void refetch()}>Try again</button>}>Your projects could not be fetched. Please try again.</EmptyState></section> : <div key={view} className="dfw-page-enter">
      {view === "overview" && <section className="dfw-stats" aria-label="Project statistics">{[
        { label: "Total projects", value: projects.length, detail: "Connected repositories", icon: FiLayers },
        { label: "Running", value: running, detail: "Reported as running or deployed", icon: FiActivity },
        { label: "Stopped", value: stopped, detail: "Stopped, paused, or suspended", icon: FiBox },
        { label: "Failed", value: failed, detail: "Projects reporting an error", icon: FiActivity },
      ].map(stat => <article className="dfw-stat" key={stat.label}><div><span>{stat.label}</span><stat.icon /></div><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}</section>}
      {view === "settings" && <section className="dfw-panel dfw-account-panel"><div className="dfw-panel-heading"><div><h2>Account</h2><p>Your connected workspace profile.</p></div></div><dl className="dfw-details"><div><dt>Name</dt><dd>{user.username || "Not provided"}</dd></div><div><dt>Email</dt><dd>{user.email || "Not provided"}</dd></div></dl></section>}
      {!projects.length ? <section className="dfw-panel"><EmptyState title="Your next project starts here" action={createAction}>Connect a GitHub repository to create a project, build your first image, and configure its environment.</EmptyState></section> : view === "overview" ? <div className="dfw-overview-grid">
        <section className="dfw-panel dfw-project-list"><div className="dfw-panel-heading"><div><h2>Projects <span className="dfw-count">{projects.length}</span></h2><p>Select a project to inspect its activity.</p></div><Link className="dfw-text-link" to="/projects">View all <FiArrowUpRight /></Link></div>
          <div className="dfw-search"><FiSearch /><input type="search" aria-label="Search projects" placeholder="Search projects or repositories..." value={search} onChange={event => setSearch(event.target.value)} /></div>
          {filtered.length ? <div className="dfw-project-rows">{filtered.map(project => <article key={project.id} className={`dfw-project-row ${selected?.id === project.id ? "is-selected" : ""}`}><button type="button" aria-pressed={selected?.id === project.id} onClick={() => selectProject(String(project.id))} className="dfw-project-select"><span className="dfw-project-top"><span className="dfw-icon"><FiBox /></span><strong>{project.projects_name}</strong><StatusBadge status={project.statuss} /></span><span className="dfw-repo-name">{projectRepository(project).full_name}</span><span className="dfw-project-meta"><span><FiGitBranch /> {project.branch}</span><span>Updated {formatTimestamp(project.updated_at || project.created_at)}</span></span></button><Link to={`/projects/${project.id}`} className="dfw-project-open" aria-label={`Open ${project.projects_name}`}><FiArrowUpRight /></Link></article>)}</div> : <EmptyState title="No matching projects">Try another project or repository name.</EmptyState>}
          <div className="dfw-panel-footer"><span>Project status comes from your workspace.</span><Link className="dfw-text-link" to="/projects" state={{ openCreate: true }}><FiPlus /> Add project</Link></div>
        </section>
        {selected && <ProjectActivity key={selected.id} project={selected} />}
      </div> : <>
        <div className="dfw-project-picker"><label htmlFor="workspace-project">Project</label><select id="workspace-project" value={selected?.id} onChange={event => selectProject(event.target.value)}>{projects.map(project => <option key={project.id} value={project.id}>{project.projects_name}</option>)}</select>{selected && <Link className="dfw-text-link" to={`/projects/${selected.id}`}>Open project <FiArrowUpRight /></Link>}</div>
        {selected && (view === "environment" ? <ProjectEnvironment key={selected.id} projectId={String(selected.id)} /> : view === "settings" ? <ProjectSettings key={selected.id} project={selected} /> : <ProjectActivity key={selected.id} project={selected} expanded />)}
      </>}
    </div>}
  </WorkspaceLayout>;
}
