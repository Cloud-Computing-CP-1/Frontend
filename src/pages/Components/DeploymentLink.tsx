import { FiArrowUpRight } from "react-icons/fi";
import { cloudBrand, deploymentAddress } from "../deployment.utils";
import CopyDeploymentUrl from "./CopyDeploymentUrl";
import "./ProjectDeployments.css";

export default function DeploymentLink({ url, projectName, cloudProvider }: { url?: string | null; projectName: string; cloudProvider?: string | null }) {
  const address = deploymentAddress(url);
  if (!address) return null;
  const brand = cloudBrand(cloudProvider);

  return <div className="deployment-endpoint">
    <span className={`deployment-brand deployment-brand-${brand.tone}`}><brand.icon aria-hidden="true" /></span>
    <div className="deployment-endpoint-content">
      <span className="deployment-eyebrow">Application endpoint</span>
      <a className="deployment-domain" href={address.href} target="_blank" rel="noopener noreferrer" title={address.href} aria-label={`Visit ${projectName} (opens in a new tab)`}>{address.label}<FiArrowUpRight aria-hidden="true" /></a>
      <span className="deployment-provider">{cloudProvider?.trim() ? `Deployed on ${brand.name}` : "Deployment URL"}</span>
    </div>
    <CopyDeploymentUrl key={address.href} url={address.href} />
  </div>;
}
