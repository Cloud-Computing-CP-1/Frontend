import { FiBox, FiCheck, FiClock, FiGitBranch, FiLoader } from "react-icons/fi";
import "./BuildProgress.css";

interface Props {
  status?: string;
  repository: string;
  branch: string;
  elapsed: number;
  warning: string;
}

export default function BuildProgress({ status, repository, branch, elapsed, warning }: Props) {
  const normalizedStatus = status?.trim().toLowerCase();
  const stage = !normalizedStatus ? 0 : normalizedStatus === "queued" ? 1 : 2;
  const titles = ["Preparing your build", "Your build is in the queue", "Building your container image"];
  const descriptions = [
    "Sending your repository to the build engine and preparing the build request.",
    "Your request has been accepted. Waiting for an available build runner.",
    "Your build runner is working. We’ll show the image as soon as it’s ready.",
  ];
  return (
    <section className="build-progress-card">
      <div className="build-progress-top">
        <span className="build-progress-label"><i /> BUILD IN PROGRESS</span>
        <span className="build-progress-time"><FiClock /> {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")} <small>elapsed</small></span>
      </div>
      <div className="build-progress-body">
        <div className="build-orbit" aria-hidden="true">
          <span className="build-orbit-ring" />
          <span className="build-orbit-inner" />
          <div className="build-orbit-core"><FiBox /></div>
        </div>
        <div className="build-progress-copy">
          <h2 role="status" aria-live="polite">{titles[stage]}</h2>
          <p>{descriptions[stage]}</p>
          <div className="build-source"><span>{repository}</span><span><FiGitBranch />{branch}</span></div>
        </div>
      </div>
      <ol className="build-stage-list" aria-label="Build stages">
        {["Submit request", "Queue", "Build image", "Image ready"].map((label, index) => (
          <li key={label} className={index < stage ? "complete" : index === stage ? "current" : ""} aria-current={index === stage ? "step" : undefined}>
            <span className="build-stage-icon">{index < stage ? <FiCheck /> : index === stage ? <FiLoader /> : String(index + 1).padStart(2, "0")}</span>
            <div><strong>{label}</strong><small>{index < stage ? "Complete" : index === stage ? "In progress" : "Up next"}</small></div>
          </li>
        ))}
      </ol>
      <div className="build-progress-footer"><span><i /> Checking for updates automatically</span><span>You can keep this page open</span></div>
      <div className="build-indeterminate" role="progressbar" aria-label={titles[stage]}><span /></div>
      {warning && <p role="status" className="build-progress-warning">{warning}</p>}
    </section>
  );
}
