import { Link } from "react-router-dom";
import { FiArrowUpRight, FiBox, FiCheck, FiChevronDown, FiClock, FiExternalLink, FiGitBranch, FiGlobe, FiInfo } from "react-icons/fi";
import type { DeploymentResult } from "../../React-Query/DeployProject";
import type { BuildResult } from "./BuildDetails";
import { deploymentAddress } from "../deployment.utils";
import { StatusBadge } from "./WorkspaceUI";
import CopyDeploymentUrl from "./CopyDeploymentUrl";
import "./ProjectDeployments.css";
import "./BuildDeploymentResult.css";

export default function BuildDeploymentResult({ result, build, projectId, branch, onBuildAgain }: { result: DeploymentResult; build: BuildResult; projectId: string; branch: string; onBuildAgain: () => void }) {
  const address = deploymentAddress(result.deploymentUrl);
  const successful = Boolean(address) && ["RUNNING", "LIVE", "DEPLOYED", "READY", "SUCCESS", "SUCCEEDED", "COMPLETED"].includes(result.status?.toUpperCase() || "");

  return <section aria-label="Deployment result" className={`build-result ${successful ? "is-successful" : ""}`}>
    <div className="build-result-topline">
      <span className="build-result-eyebrow"><span className="build-result-indicator" />{successful ? "Deployment complete" : "Deployment update"}</span>
      <StatusBadge status={result.status || "Status not provided"} />
    </div>
    <div className="build-result-hero">
      <div className="build-result-emblem" aria-hidden="true">{successful ? <FiCheck /> : <FiGlobe />}</div>
      <div className="build-result-message" role="status">
        <h2>{successful ? <>Deployed <span>successfully!</span></> : address ? "Your deployment update is here" : "Deployment URL not available yet"}</h2>
        <p className="build-result-description">{successful ? "Your deployment is complete. Your application may need a few minutes to finish starting." : address ? "View the latest deployment status and open your application using the link." : "Check your deployment history for the application URL and status updates."}</p>
        <span className="sr-only">Deployment response received</span>
      </div>
    </div>

    {address && <div className={`build-result-launch ${successful ? "has-startup-note" : ""}`}>
      <div className="build-result-site">
        <div className="build-result-site-bar"><FiGlobe aria-hidden="true" /><span>Application endpoint</span><FiArrowUpRight aria-hidden="true" /></div>
        <div className="build-result-site-body">
          <span className="build-result-site-label">Your application URL</span>
          <div className="build-result-address"><a href={address.href} target="_blank" rel="noopener noreferrer" title={address.href}>{address.label}<FiArrowUpRight aria-hidden="true" /></a></div>
          <p>Open your application in a new tab or copy its address to share.</p>
          <div className="build-result-actions">
            <a className="build-result-visit" href={address.href} target="_blank" rel="noopener noreferrer">Visit website<FiExternalLink aria-hidden="true" /></a>
            <CopyDeploymentUrl key={address.href} url={address.href} showLabel />
          </div>
        </div>
      </div>
      {successful && <aside className="build-result-startup" aria-labelledby="build-result-startup-title" role="note">
        <div className="build-result-startup-label"><FiClock aria-hidden="true" /><span>FIRST STARTUP</span><span>Up to 5 min</span></div>
        <h3 id="build-result-startup-title">Give your app a moment.</h3>
        <p>Your application can take <strong>up to 5 minutes</strong> to start.</p>
        <div className="build-result-startup-help"><FiInfo aria-hidden="true" /><p>Seeing <code>503 Service Unavailable</code>? This can happen during startup. Wait a few minutes, then refresh the application page.</p></div>
        <p className="build-result-startup-followup">Still seeing 503 after 5 minutes? Check your deployment history and application logs.</p>
      </aside>}
    </div>}

    <div className="build-result-context">
      <div><span className="build-result-meta-icon"><FiBox aria-hidden="true" /></span><div><span className="build-result-meta-label">Application</span><strong>{build.repository.name}</strong></div></div>
      <div><span className="build-result-meta-icon"><FiGitBranch aria-hidden="true" /></span><div><span className="build-result-meta-label">Source branch</span><strong>{branch}</strong></div></div>
      <div className="build-result-build-id"><span className="build-result-meta-label">Build</span><code title={build.id}>{build.id}</code></div>
    </div>
    <div className="build-result-bottom">
      <details className="build-result-details"><summary><FiBox aria-hidden="true" />Deployment details<FiChevronDown aria-hidden="true" /></summary>
        <dl>{[["Service", result.providerMetadata?.serviceName || "Not provided"], ["Container image", build.image.reference], ["Source branch", branch], ["Build ID", build.id], ["Hostname", result.hostname || "Not provided"], ["Provider resource", result.providerResourceId || "Not provided"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </details>
      <div className="build-result-footer"><Link to={`/projects/${projectId}?tab=deployments`}>View deployment history<FiArrowUpRight aria-hidden="true" /></Link><button type="button" onClick={onBuildAgain}><FiBox aria-hidden="true" />Build a new image</button></div>
    </div>
  </section>;
}
