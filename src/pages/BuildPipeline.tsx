import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeployProject } from "../React-Query/DeployProject";
import BuildDeploymentResult from "./Components/BuildDeploymentResult";
import { useLocation, Link } from "react-router-dom";
import {
  FiCloud,
  FiArrowLeft,
  FiPlay,
  FiCheckCircle,
  FiKey,
  FiPlus,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiLayers,
  FiGlobe,
  FiBox,
} from "react-icons/fi";
import BuildProgress from "./Components/BuildProgress";
import BuildDetails, { type BuildResult } from "./Components/BuildDetails";
import type { RepoItem } from "./Components/AllRepo";
import { UseStateContext } from "../context/AuthContext";
import { UsegetProjectEnv } from "../React-Query/GetProjectEnv";

interface EnvVar {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

const getBuildStatus = (status?: string) => status?.trim().toLowerCase() || "queued";
const isBuildSuccessful = (status?: string) => ["success", "succeeded", "completed", "ready"].includes(getBuildStatus(status));
const isBuildFailed = (status?: string) => ["failed", "error", "cancelled", "canceled", "stopped"].includes(getBuildStatus(status));

const BuildPipeline = () => {
  const location = useLocation();
  const { axiosInstance } = UseStateContext()!
  const passedRepo: RepoItem | undefined = location.state?.repo;
  const projectId = location.state?.projectId == null ? undefined : String(location.state.projectId);
  const deployment = useDeployProject(projectId || "");
  const queryClient = useQueryClient();
  const deployBusy = useRef(false);
  const [deployError, setDeployError] = useState("");
  const { data: projectEnv = [], isLoading: envLoading, isError: envLoadError, refetch: refetchEnv } = UsegetProjectEnv(projectId);
  const hasProjectEnv = projectEnv.length > 0;

  const repo: RepoItem = passedRepo || {
    id: "demo-repo-1",
    name: "ss-tour-and-travels",
    full_name: "kiran04-code/ss-tour-and-travels",
    default_branch: "main",
    language: "TypeScript",
    private: false,
    fork: false,
    updated_at: new Date().toISOString(),
  };
  // Flow: select repository -> configure -> build image -> deploy image -> live
  const [phase, setPhase] = useState<"config" | "building" | "image-built" | "deploying" | "live">("config");

  // Environment variables
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { id: "1", key: "NODE_ENV", value: "production", isSecret: false },
    { id: "2", key: "PORT", value: "3000", isSecret: false },
  ]);
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [bulkEnv, setBulkEnv] = useState("");
  const [envNotice, setEnvNotice] = useState("");
  const [envError, setEnvError] = useState("");
  const [hasImportedEnv, setHasImportedEnv] = useState(false);
  const [envSaved, setEnvSaved] = useState(false);
  const [envSaving, setEnvSaving] = useState(false);
  const [showStoredEnv, setShowStoredEnv] = useState(false);

  const markEnvDirty = () => {
    setEnvSaved(false);
    setEnvNotice("");
  };

  const importEnv = () => {
    const parsed = new Map<string, string>();
    const errors: number[] = [];
    bulkEnv.split(/\r?\n/).forEach((raw, index) => {
      const line = raw.trim();
      if (!line || line.startsWith("#")) return;
      const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) { errors.push(index + 1); return; }
      let value = match[2];
      if (value.startsWith('"') || value.startsWith("'")) {
        const quote = value[0];
        const close = value.lastIndexOf(quote);
        if (close < 1 || (value.slice(close + 1).trim() && !value.slice(close + 1).trim().startsWith("#"))) {
          errors.push(index + 1); return;
        }
        value = value.slice(1, close);
      } else {
        value = value.replace(/\s+#.*$/, "").trimEnd();
      }
      parsed.set(match[1], value);
    });
    if (errors.length || !parsed.size) {
      setEnvError(errors.length ? "Check KEY=value format on lines: " + errors.join(", ") + ". Use one variable per line." : "Paste at least one KEY=value line.");
      return;
    }
    setEnvVars(previous => {
      const merged = new Map(previous.filter(v => v.key.trim()).map(v => [v.key, v]));
      parsed.forEach((value, key) => {
        merged.set(key, { id: merged.get(key)?.id || crypto.randomUUID(), key, value, isSecret: true });
      });
      return [...merged.values()];
    });
    setShowSecretMap({});
    setBulkEnv("");
    setEnvError("");
    setHasImportedEnv(true);
    setEnvSaved(false);
    setEnvNotice(parsed.size + " variables imported. Review them below, then save before deploying.");
  };

  // Build configuration options
  const branch = repo.default_branch || "main";






  const [build, setBuild] = useState<BuildResult | null>(null);
  const [buildError, setBuildError] = useState("");
  const [pollError, setPollError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const requestBusy = useRef(false);
  const imageReadyRef = useRef<HTMLElement>(null);
  const shortImageId = build?.id || "";
  useEffect(() => {
    if (phase !== "building") return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "building" || !build?.id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await axiosInstance.get("/build/image/" + encodeURIComponent(build.id), { timeout: 20000 });
        if (cancelled) return;
        if (!response.data.Status || !response.data.responseData?.status) throw new Error("Status unavailable");
        const result: BuildResult = response.data.responseData;
        setBuild(result);
        setPollError("");
        if (isBuildSuccessful(result.status)) {
          setPhase("image-built");
          setEnvVars(vars => vars.map(v => v.key === "PORT" ? { ...v, value: String(result.project.port) } : v));
          return;
        }
        if (isBuildFailed(result.status)) {
          setBuildError(result.errorMessage || "Build " + result.status + ". You can retry below.");
          setPhase("config");
          return;
        }
      } catch {
        if (cancelled) return;
        setPollError("Unable to refresh build status. Retrying automatically; your build may still be running.");
      }
      if (!cancelled) timer = setTimeout(poll, 5000);
    };
    timer = setTimeout(poll, 3000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phase, build?.id, axiosInstance]);

  useEffect(() => {
    if (phase !== "image-built") return;
    const frame = window.requestAnimationFrame(() => {
      imageReadyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const addEnvVar = () => {
    const newId = Date.now().toString();
    setEnvVars((prev) => [...prev, { id: newId, key: "", value: "", isSecret: false }]);
    markEnvDirty();
  };

  const removeEnvVar = (id: string) => {
    setEnvVars((prev) => prev.filter((item) => item.id !== id));
    markEnvDirty();
  };

  const updateEnvVar = (id: string, field: "key" | "value" | "isSecret", val: string | boolean) => {
    setEnvVars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
    markEnvDirty();
  };

  const toggleShowSecret = (id: string) => {
    setShowSecretMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // STEP 1: Build Docker Image (Triggered by 'Build Image' button)
  const handleBuildImage = async () => {
    if (requestBusy.current || phase === "building") return;
    const repoUrl = passedRepo?.clone_url || passedRepo?.html_url;
    const repo_id = passedRepo?.id
    const default_branch = passedRepo?.default_branch;
    if (!repoUrl) {
      setBuildError("Select a GitHub repository before building.");
      return;
    }
    requestBusy.current = true;
    setPhase("building");
    setElapsed(0);
    setBuild(null);
    setBuildError("");
    setPollError("");
    deployment.reset();
    setDeployError("");
    try {
      const projectid = location.state?.projectId
      const response = await axiosInstance.post("/build/image", { repo: repoUrl, repo_id: repo_id, repo_branch: default_branch, project_id: projectid });
      const result: BuildResult = response.data.responseData;

      if (!response.data.Status || !result?.id || !result.image || !result.project || !result.repository) {
        throw new Error(response.data.Sendmessage || "The build service returned an incomplete response.");
      }
      setBuild(result);
      if (isBuildSuccessful(result.status)) {
        setPhase("image-built");
        setEnvVars(vars => vars.map(v => v.key === "PORT" ? { ...v, value: String(result.project.port) } : v));
      } else if (isBuildFailed(result.status)) {
        throw new Error(result.errorMessage || "Build " + result.status);
      }
    } catch (error) {
      setBuildError(error instanceof Error ? error.message : "Unable to start the build. Please retry.");
      setPhase("config");
    } finally {
      requestBusy.current = false;
    }
  };
  const saveEnv = async () => {
    if (!projectId) {
      setEnvError("Open a project to save its environment variables.");
      return;
    }
    if (bulkEnv.trim()) {
      setEnvError("Import or clear the pasted variables before saving.");
      return;
    }
    const keys = envVars.map(variable => variable.key);
    if (keys.some(key => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) || new Set(keys).size !== keys.length) {
      setEnvError("Give each variable a valid, unique name, or remove empty rows.");
      return;
    }
    setEnvSaving(true);
    setEnvError("");
    setEnvNotice("");
    try {
      const env = Object.fromEntries(envVars.map(variable => [variable.key, variable.value]));
      const response = await axiosInstance.post("/project/Addenv", { project_id: projectId, env }, { timeout: 10000 });
      if (!response.data.Status) throw new Error(response.data.Sendmessage || "The server did not save the variables.");
      const refreshed = await refetchEnv();
      if (refreshed.isError || !refreshed.data?.length) throw new Error("Saved variables could not be verified.");
      setEnvSaved(true);
      setEnvNotice("Environment variables saved for this project.");
      return true;
    } catch {
      setEnvSaved(false);
      setEnvError("Environment variables could not be saved. Please retry before deploying.");
    } finally {
      setEnvSaving(false);
    }
  };
  // STEP 2: Deploy Image to Cluster (Triggered by 'Deploy Image' button)
  const handleDeployImage = async () => {
    if (phase !== "image-built" || deployBusy.current || queryClient.isMutating({ mutationKey: ["deploy-project", projectId], exact: true })) return;
    if (!projectId || !build || !isBuildSuccessful(build.status)) {
      setDeployError("Open a project and finish building its image before deploying.");
      return;
    }
    if (projectId && (envLoading || envLoadError)) return;
    if (hasImportedEnv && !envSaved) {
      setEnvError("Save the imported environment variables before deploying.");
      return;
    }
    if (bulkEnv.trim()) {
      setEnvError("Import or clear the pasted variables before deploying.");
      return;
    }
    const keys = hasProjectEnv ? projectEnv.map(variable => variable.key) : envVars.map(v => v.key);
    if (!hasProjectEnv && (keys.some(key => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) || new Set(keys).size !== keys.length)) {
      setEnvError("Give each variable a valid, unique name, or remove empty rows.");
      return;
    }
    setEnvError("");
    setDeployError("");
    deployBusy.current = true;
    setPhase("deploying");
    try {
      if (!hasProjectEnv && !envSaved && !await saveEnv()) {
        setPhase("image-built");
        return;
      }
      const currentResponse = await axiosInstance.get("/project/get-current-ruining-image/" + encodeURIComponent(projectId));
      const currentImage = currentResponse.data.responseData;
      if (!currentResponse.data.Status || !currentImage?.image_uri || String(currentImage.project_id) !== projectId || String(currentImage.image_digest) !== build.id) {
        throw new Error("This build is no longer the project's current image. Open the project to review the current image before deploying.");
      }
      await deployment.mutateAsync();
      setPhase("live");
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : "Deployment failed. Check deployment history before trying again.");
      setPhase("image-built");
    } finally {
      deployBusy.current = false;
    }
  };

  return (
    <main className="build-pipeline min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col">

      {/* Top Navigation Header */}
      <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            to={location.state?.projectId ? `/projects/${location.state.projectId}` : "/dashboard"}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition text-xs font-semibold"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to {location.state?.projectId ? "Project" : "Dashboard"}</span>
          </Link>

          <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-xs">
              <FiCloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                  {repo.name}
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-secondary)] border border-[var(--border)] px-2 py-0.5 rounded-md font-mono">
                  {branch}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Status Badge */}
        <div className="flex items-center gap-3">
          {phase === "config" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] text-xs font-semibold border border-[var(--border)]">
              <FiKey className="w-3 h-3 text-[var(--text-muted)]" />
              1. Repository Selected
            </span>
          )}

          {phase === "building" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Building Docker Image…
            </span>
          )}

          {phase === "image-built" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 shadow-xs">
              <FiBox className="w-3.5 h-3.5" />
              Image Ready • Awaiting Deploy
            </span>
          )}

          {phase === "deploying" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              Deploying application…
            </span>
          )}

          {phase === "live" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {deployment.data?.status || "Deployment completed"}
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* Visual Pipeline Progress Stepper */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Step 1: Environment & Config */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "config"
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
              : "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Step 1</span>
                {phase !== "config" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FiKey className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Repository Selected</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Automatic build detection</p>
            </div>

            {/* Step 2: Build Image */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "building"
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
              : phase === "image-built" || phase === "deploying" || phase === "live"
                ? "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                : "bg-[var(--surface)] border-[var(--border)]/60 opacity-60 text-[var(--text-muted)]"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Step 2</span>
                {phase === "building" ? (
                  <span className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                ) : phase === "image-built" || phase === "deploying" || phase === "live" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FiBox className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Build Image</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Docker Container Build</p>
            </div>

            {/* Step 3: Verified Image Artifact */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "image-built"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/20"
              : phase === "deploying" || phase === "live"
                ? "bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                : "bg-[var(--surface)] border-[var(--border)]/60 opacity-60 text-[var(--text-muted)]"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Step 3</span>
                {phase === "image-built" ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ) : phase === "deploying" || phase === "live" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FiLayers className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Image Ready & ENV</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{phase === "config" || phase === "building" ? "Pending Build" : `ID: ${shortImageId}`}</p>
            </div>

            {/* Step 4: Deploy Image */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "deploying"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              : phase === "live"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-[var(--surface)] border-[var(--border)]/60 opacity-60 text-[var(--text-muted)]"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Step 4</span>
                {phase === "deploying" ? (
                  <span className="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                ) : phase === "live" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FiGlobe className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Deploy Image</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Deploy to cloud</p>
            </div>

          </div>
        </section>

        {deployError && <div role="alert" className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">{deployError}{projectId && <Link className="ml-2 underline" to={`/projects/${projectId}?tab=deployments`}>View deployment history</Link>}</div>}
        {!projectId && <p role="alert" className="text-sm text-amber-400">Open this build from a project to deploy it.</p>}
        {buildError && <div role="alert" className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">{buildError}</div>}
        {phase === "building" && (
          <BuildProgress status={getBuildStatus(build?.status)} repository={repo.full_name || repo.name} branch={branch} elapsed={elapsed} warning={pollError} />
        )}
        {/* Build the selected repository with automatic detection */}
        {phase === "config" && (
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <FiBox className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[var(--text-primary)] break-all">{repo.full_name || repo.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Branch: {branch}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Language and build settings are detected automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={handleBuildImage}
                className="h-11 px-6 rounded-xl bg-[var(--primary)] hover:bg-blue-700 text-white font-bold text-xs shadow-none transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <FiBox className="w-4 h-4" />
                <span>Build Image</span>
              </button>
            </div>
          </section>
        )}

        {/* PHASE 3: Image Built Artifact Screen (Show Image ID + 'Deploy Image' button) */}
        {phase === "image-built" && (
          <section ref={imageReadyRef} tabIndex={-1} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm animate-fadeIn focus:outline-none">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-xs">
                  <FiBox className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Image Built Successfully
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">Ready to deploy</span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">
                    Docker Container Image Artifact
                  </h3>
                </div>
              </div>


            </div>

            {build && <div className="mt-5"><BuildDetails build={build} message="Image build completed successfully" /></div>}

            <div className="mt-6 space-y-4">
              {/* Environment Variables Card */}
              <article className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs">
                {projectId && envLoading ? <p role="status" className="text-sm text-[var(--text-muted)] py-4">Checking this project's environment variables...</p>
                  : projectId && envLoadError ? <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">Could not load project environment variables. <button type="button" onClick={() => refetchEnv()} className="font-semibold underline cursor-pointer">Retry</button></div>
                    : hasProjectEnv ? <>
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4"><div><h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><FiKey className="w-4 h-4 text-blue-400" /> Environment configured</h3><p className="text-xs text-[var(--text-muted)] mt-1">{projectEnv.length} variables are saved for this project. The image is ready for deployment.</p></div><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">Ready to deploy</span></div>
                      <div className="mt-4 flex items-center justify-between gap-3"><h4 className="text-xs font-semibold text-[var(--text-secondary)]">Saved variables</h4><button type="button" onClick={() => setShowStoredEnv(value => !value)} aria-pressed={showStoredEnv} className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer">{showStoredEnv ? "Hide values" : "Show values"}</button></div>
                      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">{projectEnv.map(variable => <div key={variable.key} className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2"><dt className="text-xs font-mono font-semibold text-[var(--text-primary)] break-all">{variable.key}</dt><dd className="mt-1 text-xs font-mono text-[var(--text-secondary)] break-all">{showStoredEnv ? variable.value : "••••••••"}</dd></div>)}</dl>
                    </> : <>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border)]">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <FiKey className="w-4 h-4 text-blue-400" />
                      Deployment Environment Variables (ENV)
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Your image is ready. Add runtime variables for your application, then deploy the image.
                    </p>
                  </div>

                  <button
                    onClick={addEnvVar}
                    className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Add Variable</span>
                  </button>
                </div>

                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 p-4">
                  <label htmlFor="bulk-env" className="block text-sm font-bold text-[var(--text-primary)]">Paste multiple variables</label>
                  <p className="mt-1 mb-3 text-xs text-[var(--text-muted)]">Paste your .env contents, one KEY=value per line. Matching names will be updated; imported values are hidden in the review below.</p>
                  <textarea
                    id="bulk-env"
                    value={bulkEnv}
                    onChange={e => { setBulkEnv(e.target.value); setEnvError(""); markEnvDirty(); }}
                    placeholder={"NODE_ENV=production\nPORT=80\nAPI_URL=https://api.example.com"}
                    spellCheck={false}
                    autoComplete="off"
                    rows={5}
                    className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3 text-xs font-mono leading-6 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-[var(--text-muted)]">Supports comments, quoted values, and export KEY=value.</span>
                    <button type="button" onClick={importEnv} disabled={!bulkEnv.trim()} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">Import variables</button>
                  </div>
                </div>
                {envError && <p role="alert" className="mb-4 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">{envError}</p>}
                {envNotice && <p role="status" className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">{envNotice}</p>}
                <h4 className="mb-3 text-xs font-bold text-[var(--text-primary)]">Review variables ({envVars.length})</h4>
                {/* Env Vars Input List */}
                <div className="space-y-3">
                  {envVars.map((env) => (
                    <div
                      key={env.id}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[var(--surface-secondary)]/50 p-2.5 rounded-xl border border-[var(--border)]"
                    >
                      <input
                        type="text"
                        placeholder="KEY (e.g. PORT)"
                        value={env.key}
                        onChange={(e) => updateEnvVar(env.id, "key", e.target.value)}
                        className="w-full sm:w-1/3 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-mono font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                      />

                      <div className="relative flex-1">
                        <input
                          type={env.isSecret && !showSecretMap[env.id] ? "password" : "text"}
                          placeholder="VALUE"
                          value={env.value}
                          onChange={(e) => updateEnvVar(env.id, "value", e.target.value)}
                          className="w-full h-9 pl-3 pr-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />

                        {env.isSecret && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret(env.id)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                          >
                            {showSecretMap[env.id] ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => updateEnvVar(env.id, "isSecret", !env.isSecret)}
                          className={`text-[10px] font-medium px-2 py-1.5 rounded-md border transition cursor-pointer ${env.isSecret
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)]"
                            }`}
                        >
                          {env.isSecret ? "Secret" : "Plain"}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeEnvVar(env.id)}
                          className="w-8 h-8 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <FiKey className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>These variables are used when the container starts.</span>
                </div>
                {hasImportedEnv && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"><div><p className="text-xs font-semibold text-[var(--text-primary)]">{envSaved ? "Variables saved" : "Save your imported variables"}</p><p className="text-[11px] text-[var(--text-muted)] mt-1">{!location.state?.projectId ? "Open the build from a project to save variables." : envSaved ? "Changes will need to be saved again." : "Save these values to this project before deploying."}</p></div><button type="button" onClick={saveEnv} disabled={envSaved || envSaving || !location.state?.projectId} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">{envSaving ? "Saving..." : envSaved ? "Saved" : "Save environment variables"}</button></div>}
                    </>}
              </article>


              <div className="flex justify-end">
                {/* 'Deploy Image' Button */}
                <button
                  onClick={handleDeployImage}
                  disabled={!projectId || deployment.isPending || envSaving || Boolean(projectId && (envLoading || envLoadError)) || (hasImportedEnv && !envSaved)}
                  className="bg-[var(--primary)] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-none transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlay className="w-4 h-4 fill-current" />
                  <span>Deploy Application</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {phase === "deploying" && <section role="status" className="rounded-2xl border border-blue-500/30 bg-[var(--surface)] p-8 text-center"><FiCloud className="mx-auto mb-4 h-8 w-8 text-blue-400 animate-pulse" /><h2 className="font-semibold">Deploying your application</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Waiting for the cloud provider. This can take a few minutes.</p></section>}
        {phase === "live" && deployment.data && build && projectId && <BuildDeploymentResult result={deployment.data} build={build} projectId={projectId} branch={branch} onBuildAgain={handleBuildImage} />}
      </div>

    </main>
  );
};

export default BuildPipeline;
