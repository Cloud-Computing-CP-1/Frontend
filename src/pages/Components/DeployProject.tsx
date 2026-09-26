import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle, FiCloud, FiRefreshCw } from "react-icons/fi";
import { UsegetCurrentProjectImage } from "../../React-Query/GetCurrentProjectImage";
import { useDeployProject } from "../../React-Query/DeployProject";
import { deploymentAddress } from "../deployment.utils";
import "./ProjectDeployments.css";

export default function DeployProject({ projectId, imageId }: { projectId: string; imageId?: string }) {
  const current = UsegetCurrentProjectImage(projectId);
  const deployment = useDeployProject(projectId);
  const queryClient = useQueryClient();
  const pending = useIsMutating({ mutationKey: ["deploy-project", projectId], exact: true }) > 0;
  const image = current.data;
  const isCurrentImage = imageId == null || (image != null && String(image.id) === imageId);
  const ready = image?.image_uri && ["READY", "SUCCESS", "SUCCEEDED", "COMPLETED"].includes(image.status_.toUpperCase());
  const canDeploy = !current.isPending && !current.isError && !current.isFetching && Boolean(ready) && isCurrentImage;
  const address = deploymentAddress(deployment.data?.deploymentUrl);

  const deploy = () => {
    if (!canDeploy || queryClient.isMutating({ mutationKey: ["deploy-project", projectId], exact: true })) return;
    deployment.mutate();
  };

  return <section className="deployment-launch" aria-label="Deploy project">
    <div className="deployment-launch-heading">
      <div><h2><FiCloud aria-hidden="true" />Deploy current image</h2><p>{image ? <>Deploys <strong>{image.image_tags || `Image #${image.id}`}</strong> with this project’s environment variables.</> : "Deploy your current project image to the configured cloud provider."}</p></div>
      <button type="button" className="dfw-button dfw-primary" onClick={deploy} disabled={!canDeploy || pending} aria-busy={pending}>{pending ? <FiRefreshCw className="dfw-spin" /> : <FiCloud />}{pending ? "Deploying..." : "Deploy project"}</button>
    </div>
    {pending ? <p className="deployment-launch-message" role="status">Deploying your application. This can take a few minutes.</p>
      : current.isPending ? <p className="deployment-launch-message" role="status">Checking the current image...</p>
        : current.isError ? <p className="deployment-launch-message" role="alert">Could not load the current image. <button type="button" className="dfw-text-link" onClick={() => void current.refetch()}>Retry image check</button></p>
          : !image ? <p className="deployment-launch-message">Build an image before deploying this project.</p>
            : !isCurrentImage ? <p className="deployment-launch-message">This is a previous build. <Link className="dfw-text-link" to={`/projects/${projectId}/images/${image.id}`}>Open the current image to deploy it<FiArrowUpRight /></Link></p>
              : !ready ? <p className="deployment-launch-message">The current image must finish building and have an image URI before deployment.</p> : null}
    {deployment.isError && !pending && <p className="deployment-launch-message deployment-launch-error" role="alert">{deployment.error.message} <Link to={`/projects/${projectId}?tab=deployments`}>View deployment history</Link></p>}
    {deployment.isSuccess && !pending && <div className="deployment-launch-message deployment-launch-success" role="status"><span><FiCheckCircle />Deployment request completed{deployment.data.status ? ` (${deployment.data.status.toLowerCase().replaceAll("_", " ")})` : ""}.</span><div>{address && <a href={address.href} target="_blank" rel="noopener noreferrer">Open application<FiArrowUpRight /></a>}<Link to={`/projects/${projectId}?tab=deployments`}>View deployment history<FiArrowUpRight /></Link></div></div>}
  </section>;
}
