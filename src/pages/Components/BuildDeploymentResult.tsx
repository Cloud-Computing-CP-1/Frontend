import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiBox, FiCheck, FiChevronDown, FiExternalLink, FiGitBranch, FiGlobe } from "react-icons/fi";
import type { DeploymentResult } from "../../React-Query/DeployProject";
import type { BuildResult } from "./BuildDetails";
import { deploymentAddress } from "../deployment.utils";
import { StatusBadge } from "./WorkspaceUI";
import CopyDeploymentUrl from "./CopyDeploymentUrl";
import "./ProjectDeployments.css";
import "./BuildDeploymentResult.css";

const confetti = Array.from({ length: 32 }, (_, index) => ({
  left: `${(index * 37 + 7) % 100}%`,
  backgroundColor: ["#34d399", "#60a5fa", "#c4b5fd", "#fbbf24"][index % 4],
  animationDelay: `${(index % 8) * .1}s`,
  "--confetti-drift": `${((index * 29) % 160) - 80}px`,
  "--confetti-turn": `${index % 2 ? 480 : -420}deg`,
  borderRadius: index % 3 === 0 ? "50%" : "2px",
} as CSSProperties));

export default function BuildDeploymentResult({ result, build, projectId, branch, onBuildAgain }: { result: DeploymentResult; build: BuildResult; projectId: string; branch: string; onBuildAgain: () => void }) {
  const address = deploymentAddress(result.deploymentUrl);
  const successful = Boolean(address) && ["RUNNING", "LIVE", "DEPLOYED", "READY", "SUCCESS", "SUCCEEDED", "COMPLETED"].includes(result.status?.toUpperCase() || "");
  return <section aria-label="Deployment result" className={`build-result ${successful ? "is-successful" : ""}`}>
    {successful && <div className="build-result-confetti" aria-hidden="true">{confetti.map((style, index) => <i key={index} style={style} />)}</div>}
    <div className="build-result-topline"><span className="build-result-eyebrow"><span className="build-result-indicator" />{successful ? "Deployment complete" : "Deployment update"}</span><StatusBadge status={result.status || "Status not provided"} /></div>
    <div className="build-result-hero">
      <div className="build-result-message">
        <div className="build-result-emblem" aria-hidden="true">{successful ? <FiCheck /> : <FiGlobe />}</div>
        <div role="status">
          <h2>{successful ? <>Deployed<br /><span>successfully!</span></> : address ? "Your deployment update is here" : "Deployment URL not available yet"}</h2>
          <p className="build-result-description">{successful ? "Your website is ready for its next chapter. Open it, explore it, and share it with the world." : address ? "View the latest deployment status and open your application using the link." : "Check your deployment history for the application URL and status updates."}</p>
          <span className="sr-only">Deployment response received</span>
        </div>
      </div>
      {address && <div className="build-result-site">
        <div className="build-result-site-bar"><span className="build-result-window-dots" aria-hidden="true"><i /><i /><i /></span><span>Your website</span><FiGlobe aria-hidden="true" /></div>
        <div className="build-result-site-body">
          <span className="build-result-site-label">Application URL</span>
          <div className="build-result-address"><a href={address.href} target="_blank" rel="noopener noreferrer" title={address.href}>{address.label}<FiArrowUpRight aria-hidden="true" /></a></div>
          <p>This is your website’s address. Make it your next stop.</p>
          <div className="build-result-actions"><a className="build-result-visit" href={address.href} target="_blank" rel="noopener noreferrer">Visit website<FiExternalLink aria-hidden="true" /></a><CopyDeploymentUrl key={address.href} url={address.href} showLabel /></div>
        </div>
      </div>}
    </div>
    <div className="build-result-context"><div><span className="build-result-meta-icon"><FiBox aria-hidden="true" /></span><div><span className="build-result-meta-label">Application</span><strong>{build.repository.name}</strong></div></div><div><span className="build-result-meta-icon"><FiGitBranch aria-hidden="true" /></span><div><span className="build-result-meta-label">Source branch</span><strong>{branch}</strong></div></div><div className="build-result-build-id"><span className="build-result-meta-label">Build</span><code title={build.id}>{build.id}</code></div></div>
    <div className="build-result-bottom">
      <details className="build-result-details"><summary><FiBox aria-hidden="true" />Deployment details<FiChevronDown aria-hidden="true" /></summary>
        <dl>{[["Service", result.providerMetadata?.serviceName || "Not provided"], ["Container image", build.image.reference], ["Source branch", branch], ["Build ID", build.id], ["Hostname", result.hostname || "Not provided"], ["Provider resource", result.providerResourceId || "Not provided"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </details>
      <div className="build-result-footer"><Link to={`/projects/${projectId}?tab=deployments`}>View deployment history<FiArrowUpRight aria-hidden="true" /></Link><button type="button" onClick={onBuildAgain}><FiBox aria-hidden="true" />Build a new image</button></div>
    </div>
  </section>;
}
