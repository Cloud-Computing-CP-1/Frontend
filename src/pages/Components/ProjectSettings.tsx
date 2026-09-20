import { FiGitBranch, FiGithub } from "react-icons/fi";
import { Link } from "react-router-dom";
import { projectRepository, type Project } from "../project.service";
import { StatusBadge } from "./WorkspaceUI";
import { formatTimestamp } from "../workspace.utils";

export default function ProjectSettings({ project }: { project: Project }) {
  return <section className="dfw-panel"><div className="dfw-panel-heading"><div><h2>Project settings</h2><p>Repository and configuration details.</p></div><StatusBadge status={project.statuss} /></div><dl className="dfw-details">
    <div><dt>Project name</dt><dd>{project.projects_name}</dd></div>
    <div><dt>Project ID</dt><dd className="dfw-mono">{project.id}</dd></div>
    <div><dt><FiGithub /> Repository</dt><dd>{projectRepository(project).full_name}</dd></div>
    <div><dt><FiGitBranch /> Branch</dt><dd>{project.branch}</dd></div>
    <div><dt>Cloud provider</dt><dd>{project.cloud_provider || "Not configured"}</dd></div>
    <div><dt>Created</dt><dd>{formatTimestamp(project.created_at)}</dd></div>
    <div><dt>Last updated</dt><dd>{formatTimestamp(project.updated_at)}</dd></div>
  </dl><div className="dfw-panel-footer"><span>Manage saved configuration in Environment.</span><Link className="dfw-text-link" to={`/projects/${project.id}?tab=environment`}>Environment variables →</Link></div></section>;
}
