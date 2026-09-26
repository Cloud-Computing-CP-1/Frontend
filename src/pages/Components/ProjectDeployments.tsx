import { useState } from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiArrowUpRight, FiBox, FiChevronDown, FiClock, FiCloud, FiMapPin, FiRefreshCw } from "react-icons/fi";
import { UsegetProjectDeployments, type ProjectDeployment } from "../../React-Query/GetProjectDeployments";
import { cloudBrand, deploymentAddress } from "../deployment.utils";
import { formatTimestamp, statusTone } from "../workspace.utils";
import { StatusBadge } from "./WorkspaceUI";
import CopyDeploymentUrl from "./CopyDeploymentUrl";
import "./ProjectDeployments.css";

function DeploymentRow({ deployment, latest }: { deployment: ProjectDeployment; latest: boolean }) {
  const brand = cloudBrand(deployment.cloud_provider);
  const address = deploymentAddress(deployment.deployment_url);
  const service = deployment.provider_service?.replaceAll("_", " ") || "Cloud deployment";
  return <article className="deployment-record" data-deployment-id={deployment.id}>
    <div className="deployment-record-heading">
      <span className={`deployment-brand deployment-brand-${brand.tone}`}><brand.icon aria-hidden="true" /></span>
      <div className="deployment-record-title"><h3>{brand.name} <span>#{deployment.id}</span></h3><p>{service}</p></div>
      <div className="deployment-record-badges">{latest && <span className="deployment-latest">Latest</span>}<StatusBadge status={deployment.status} /></div>
    </div>
    <div className="deployment-record-meta">
      <span><FiMapPin aria-hidden="true" />{deployment.region || "Region not specified"}</span>
      <span><FiClock aria-hidden="true" />{formatTimestamp(deployment.created_at)}</span>
      {deployment.image_id != null && <Link to={`/projects/${deployment.project_id}/images/${deployment.image_id}`}><FiBox aria-hidden="true" />Image #{deployment.image_id}<FiArrowUpRight aria-hidden="true" /></Link>}
    </div>
    <div className="deployment-record-url">
      {address ? <><a href={address.href} target="_blank" rel="noopener noreferrer" title={address.href} aria-label={`Open deployment ${deployment.id} (opens in a new tab)`}>{address.label}<FiArrowUpRight aria-hidden="true" /></a><CopyDeploymentUrl key={address.href} url={address.href} /></> : <span className="deployment-no-url">No endpoint available for this deployment.</span>}
    </div>
    <details className="deployment-details">
      <summary>Deployment details<FiChevronDown aria-hidden="true" /></summary>
      <dl>
        <div><dt>Deployment ID</dt><dd>#{deployment.id}</dd></div>
        <div><dt>Last updated</dt><dd>{formatTimestamp(deployment.updated_at)}</dd></div>
        <div><dt>Hostname</dt><dd>{deployment.hostname || "Not available"}</dd></div>
        <div><dt>Provider service</dt><dd>{service}</dd></div>
        <div className="deployment-resource"><dt>Provider resource</dt><dd>{deployment.provider_resource_id || "Not available"}</dd></div>
      </dl>
    </details>
  </article>;
}

export default function ProjectDeployments({ projectId, compact = false }: { projectId: string; compact?: boolean }) {
  const deployments = UsegetProjectDeployments(String(projectId));
  const [status, setStatus] = useState("all");
  const items = deployments.data || [];
  const statuses = [...new Set(items.map(item => item.status))].sort();
  const filtered = status === "all" ? items : items.filter(item => item.status === status);
  const visible = compact ? items.slice(0, 3) : filtered;
  const running = items.filter(item => ["RUNNING", "LIVE", "DEPLOYED"].includes(item.status.toUpperCase())).length;
  const failed = items.filter(item => statusTone(item.status) === "danger").length;

  return <section className={`project-deployments ${compact ? "is-compact" : ""}`} aria-label="Project deployment history">
    <div className="deployment-section-heading">
      <div><span className="deployment-eyebrow">Deployment activity</span><h2>{compact ? "Recent deployments" : "Deployment history"}{deployments.isSuccess && <span className="deployment-count">{items.length}</span>}</h2><p>Every deployment for this project, newest first.</p></div>
      <button type="button" className="dfw-button" onClick={() => void deployments.refetch()} disabled={deployments.isFetching} aria-label="Refresh deployments"><FiRefreshCw className={deployments.isFetching ? "dfw-spin" : ""} /><span>Refresh</span></button>
    </div>
    {deployments.isPending ? <div className="deployment-loading" role="status"><FiCloud /><p>Loading your deployments...</p><div /><div /></div> : deployments.isError ? <div className="deployment-empty" role="alert"><FiCloud /><h3>Could not load deployments</h3><p>Please try again to get the latest deployment history.</p><button type="button" className="dfw-button" disabled={deployments.isFetching} onClick={() => void deployments.refetch()}>Try again</button></div> : !items.length ? <div className="deployment-empty"><FiCloud /><h3>Your first deployment starts here</h3><p>Deploy an image for this project. Its cloud provider, status, and application URL will appear here.</p><Link className="dfw-button" to={`/projects/${projectId}`}>View project builds<FiArrowUpRight /></Link></div> : <>
      {!compact && <>
        <div className="deployment-stats">
          <div><span><FiCloud />Total deployments</span><strong>{items.length}</strong></div>
          <div><span><FiActivity />Running</span><strong className="deployment-success">{running}</strong></div>
          <div><span><FiActivity />Failed</span><strong className={failed ? "deployment-danger" : ""}>{failed}</strong></div>
        </div>
        <div className="deployment-toolbar"><span>{filtered.length} {filtered.length === 1 ? "deployment" : "deployments"}</span><label>Filter by status<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{[...new Set([...statuses, ...(status === "all" ? [] : [status])])].map(value => <option key={value} value={value}>{value.replaceAll("_", " ").toLowerCase()}</option>)}</select></label></div>
      </>}
      <div className="deployment-records">{visible.map(item => <DeploymentRow key={item.id} deployment={item} latest={item.id === items[0]?.id} />)}</div>
      {!visible.length && <p className="deployment-filter-empty">No deployments match this status. <button type="button" onClick={() => setStatus("all")}>Show all deployments</button></p>}
      <div className="deployment-history-footer"><span>Reported deployment statuses · Refreshes every 30 seconds</span>{compact && <Link to={`/projects/${projectId}?tab=deployments`}>View all deployments<FiArrowUpRight /></Link>}</div>
    </>}
  </section>;
}
