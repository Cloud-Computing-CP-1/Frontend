import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiBox, FiGitBranch, FiPlay, FiRefreshCw, FiSettings, FiTerminal } from "react-icons/fi";
import { UsegetCurrentProjectImage } from "../../React-Query/GetCurrentProjectImage";
import { UsegetProjectImages } from "../../React-Query/GetProjectImages";
import { projectRepository, type Project } from "../project.service";
import { EmptyState, StatusBadge } from "./WorkspaceUI";
import { formatTimestamp } from "../workspace.utils";
import BuildLogViewer from "./BuildLogViewer";
import DeploymentLink from "./DeploymentLink";
import ProjectDeployments from "./ProjectDeployments";

export default function ProjectActivity({ project, expanded = false }: { project: Project; expanded?: boolean }) {
  const current = UsegetCurrentProjectImage(String(project.id));
  const history = UsegetProjectImages(String(project.id));
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const images = [...(history.data || [])].filter(item => String(item.project_id) === String(project.id)).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const latest = images[0];
  const currentImage = current.data;
  const deployable = currentImage && ["READY", "SUCCESS", "SUCCEEDED", "COMPLETED"].includes(currentImage.status_.toUpperCase());
  const refresh = () => { void current.refetch(); void history.refetch(); };

  return <section className="dfw-panel dfw-activity">
    <div className="dfw-panel-heading"><div><span className="dfw-eyebrow">Selected project</span><h2>{project.projects_name}</h2></div><Link to={`/projects/${project.id}`} className="dfw-button dfw-icon-button" aria-label={`Open ${project.projects_name}`}><FiArrowUpRight /></Link></div>
    <div className="dfw-activity-body">
      <div className="dfw-inline-between"><span className="dfw-muted">Deployment status</span><StatusBadge status={project.statuss} /></div>
      <p className="dfw-branch"><FiGitBranch /> {project.branch}<span>·</span>{project.cloud_provider || "Provider not configured"}</p>
      <DeploymentLink url={project.deployment_url} projectName={project.projects_name} cloudProvider={project.cloud_provider} />
      <div className="dfw-current-image"><div className="dfw-inline-between"><h3><FiBox /> Current image</h3><button type="button" className="dfw-icon-button dfw-button" aria-label="Refresh project activity" disabled={current.isFetching || history.isFetching} onClick={refresh}><FiRefreshCw /></button></div>
        {current.isLoading ? <p role="status">Loading current image...</p> : current.isError ? <p role="alert">Could not load the current image. <button className="dfw-text-link" onClick={() => void current.refetch()}>Retry</button></p> : !currentImage ? <p>No current image selected. Start with your first build.</p> : <><div className="dfw-image-name">{currentImage.image_tags || `Image #${currentImage.id}`}</div><StatusBadge status={currentImage.status_} /><code className="dfw-image-uri">{currentImage.image_uri || "Image URI unavailable"}</code><p>Built {formatTimestamp(currentImage.build_completed_at || currentImage.created_at)}</p></>}
      </div>
      <div className="dfw-quick-actions" aria-label="Project quick actions">
        {deployable ? <Link className="dfw-button dfw-primary" to={`/projects/${project.id}/images/${currentImage.id}`}><FiPlay />{["RUNNING", "LIVE", "DEPLOYED"].includes(project.statuss.toUpperCase()) ? "Redeploy" : "Deploy image"}</Link> : <Link className="dfw-button dfw-primary" to="/build" state={{ repo: projectRepository(project), projectId: project.id }}><FiBox /> Build image</Link>}
        <button type="button" className="dfw-button" disabled={!currentImage?.image_digest} aria-expanded={Boolean(logsFor)} onClick={() => setLogsFor(logsFor ? null : currentImage?.image_digest || null)}><FiTerminal /> Logs</button>
        <Link className="dfw-button" to={`/projects/${project.id}?tab=settings`}><FiSettings /> Settings</Link>
      </div>
      {logsFor && <BuildLogViewer key={logsFor} buildId={logsFor} />}
      <ProjectDeployments key={project.id} projectId={String(project.id)} compact={!expanded} />
      <div className="dfw-subheading"><h3>{expanded ? "Build history" : "Recent builds"}</h3><span>{history.isSuccess ? `${images.length} total` : ""}</span></div>
      {history.isLoading ? <p role="status" className="dfw-muted">Loading builds...</p> : history.isError ? <p role="alert" className="dfw-muted">Could not load builds. <button className="dfw-text-link" onClick={() => void history.refetch()}>Retry</button></p> : !latest ? <EmptyState title="No builds yet">Your builds will appear here with their status and timestamps.</EmptyState> : <><p className="dfw-small dfw-muted">Latest build · {formatTimestamp(latest.build_completed_at || latest.created_at)}</p><div className="dfw-build-list">{images.slice(0, expanded ? images.length : 3).map(image => <Link key={image.id} className="dfw-build-row" to={`/projects/${project.id}/images/${image.id}`}><span className="dfw-build-dot" /><div><strong>{image.image_tags || `Image #${image.id}`}</strong><small>{formatTimestamp(image.build_start_at || image.created_at)}{expanded && <><br />Completed: {formatTimestamp(image.build_completed_at)}</>}</small></div><StatusBadge status={image.status_} /></Link>)}</div></>}
    </div>
    <div className="dfw-panel-footer"><Link className="dfw-text-link" to={`/projects/${project.id}`}>Open project workspace <FiArrowUpRight /></Link><Link className="dfw-text-link" to={`/projects/${project.id}?tab=environment`}>Environment →</Link></div>
  </section>;
}
