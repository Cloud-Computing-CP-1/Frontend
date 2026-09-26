import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

export default function CopyDeploymentUrl({ url, showLabel = false }: { url: string; showLabel?: boolean }) {
  const [result, setResult] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setResult("Copied!");
    } catch { setResult("Could not copy. Select and copy the link."); }
  }
  return <span className="deployment-copy">
    <button type="button" className={`dfw-button ${showLabel ? "" : "dfw-icon-button"}`} aria-label="Copy deployment URL" title="Copy deployment URL" onClick={() => void copy()}>{result === "Copied!" ? <FiCheck /> : <FiCopy />}{showLabel && <span>{result === "Copied!" ? "Copied!" : "Copy link"}</span>}</button>
    <span role="status" className={result ? "deployment-copy-feedback" : "sr-only"}>{result}</span>
  </span>;
}
