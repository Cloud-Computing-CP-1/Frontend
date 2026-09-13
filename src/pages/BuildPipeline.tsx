import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  FiCloud,
  FiArrowLeft,
  FiPlay,
  FiCheckCircle,
  FiCopy,
  FiExternalLink,
  FiKey,
  FiPlus,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiLayers,
  FiGlobe,
  FiCheck,
  FiBox,
  FiServer,
  FiLock,
  FiRotateCcw,
} from "react-icons/fi";
import BuildProgress from "./Components/BuildProgress";
import BuildDetails, { type BuildResult } from "./Components/BuildDetails";
import type { RepoItem } from "./Components/AllRepo";
import { UseStateContext } from "../context/AuthContext";

interface EnvVar {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

const BuildPipeline = () => {
  const location = useLocation();
  const { axiosInstance } = UseStateContext()!
  const passedRepo: RepoItem | undefined = location.state?.repo;

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
    setEnvNotice(parsed.size + " variables imported. Review them below before deploying.");
  };

  // Build configuration options
  const branch = repo.default_branch || "main";
  const [copiedUrl, setCopiedUrl] = useState(false);



  // Streaming terminal logs
  const [, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [build, setBuild] = useState<BuildResult | null>(null);
  const [buildError, setBuildError] = useState("");
  const [pollError, setPollError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const requestBusy = useRef(false);
  const imageReadyRef = useRef<HTMLElement>(null);
  const getBuildStatus = (status?: string) => status?.trim().toLowerCase() || "queued";
  const isBuildSuccessful = (status?: string) => ["success", "succeeded", "completed", "ready"].includes(getBuildStatus(status));
  const isBuildFailed = (status?: string) => ["failed", "cancelled", "canceled", "stopped"].includes(getBuildStatus(status));
  const imageTag = build?.image.reference || "";
  const imageId = build?.id || "";
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

  const liveUrl = `https://${repo.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.deployforge.app`;
  const deploymentId = `dpl_${shortImageId}`;

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [phase]);

  const addEnvVar = () => {
    const newId = Date.now().toString();
    setEnvVars((prev) => [...prev, { id: newId, key: "", value: "", isSecret: false }]);
  };

  const removeEnvVar = (id: string) => {
    setEnvVars((prev) => prev.filter((item) => item.id !== id));
  };

  const updateEnvVar = (id: string, field: "key" | "value" | "isSecret", val: any) => {
    setEnvVars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const toggleShowSecret = (id: string) => {
    setShowSecretMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // STEP 1: Build Docker Image (Triggered by 'Build Image' button)
  const handleBuildImage = async () => {
    if (requestBusy.current || phase === "building") return;
    const repoUrl = passedRepo?.clone_url || passedRepo?.html_url;
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
    setLogs([]);
    try {
      const response = await axiosInstance.post("/build/image", { repo: repoUrl });
      const result: BuildResult = response.data.responseData;
      console.log(result)
      if (!response.data.Status || !result?.id || !result.image || !result.project || !result.repository) {
        throw new Error(response.data.Sendmessage || "The build service returned an incomplete response.");
      }
      setBuild(result);
      if (result.status) {
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

  // STEP 2: Deploy Image to Cluster (Triggered by 'Deploy Image' button)
  const handleDeployImage = () => {
    if (phase !== "image-built") return;
    if (bulkEnv.trim()) {
      setEnvError("Import or clear the pasted variables before deploying.");
      return;
    }
    const keys = envVars.map(v => v.key);
    if (keys.some(key => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) || new Set(keys).size !== keys.length) {
      setEnvError("Give each variable a valid, unique name, or remove empty rows.");
      return;
    }
    setEnvError("");
    setPhase("deploying");

    const deployLogs = [
      { text: `\n======================================================`, delay: 100 },
      { text: `🚀 INITIATING CLUSTER ROLLOUT FOR IMAGE ${shortImageId}`, delay: 300 },
      { text: `======================================================`, delay: 400 },
      { text: `[Kubernetes] ➔ Connecting to cluster control plane (us-east-1-cluster)...`, delay: 600 },
      { text: `[Kubernetes] ➔ Pulling verified image: ${imageTag}...`, delay: 900 },
      { text: `[Kubernetes] ➔ Injected runtime environment variables (${envVars.map((e) => e.key).join(", ")}).`, delay: 1200 },
      { text: `[Kubernetes] ➔ Provisioning Pod replica [deployforge-pod-${shortImageId}-8x92k]...`, delay: 1500 },
      { text: `[Kubernetes] ➔ Container started on port 3000 (status: Running).`, delay: 1800 },
      { text: `[Ingress]    ➔ Binding domain ${liveUrl} -> Cluster Ingress Controller...`, delay: 2100 },
      { text: `[Security]   ➔ Automatic TLS 1.3 certificate signed by Let's Encrypt CA.`, delay: 2400 },
      { text: `[Probes]     ➔ GET http://localhost:3000/healthz: HTTP 200 OK (latency: 14ms)`, delay: 2700 },
      { text: `✓ DEPLOYMENT IS LIVE! Edge CDN active across 240+ global PoPs.`, delay: 3000 },
    ];

    deployLogs.forEach(({ text, delay }) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, text]);
      }, delay);
    });

    setTimeout(() => {
      setPhase("live");
    }, 3400);
  };

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <main className="build-pipeline min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">

      {/* Top Navigation Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            to="/myDashboard"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition text-xs font-semibold"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FiCloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {repo.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                  {branch}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Status Badge */}
        <div className="flex items-center gap-3">
          {phase === "config" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              <FiKey className="w-3 h-3 text-slate-500" />
              1. Repository Selected
            </span>
          )}

          {phase === "building" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              Building Docker Image…
            </span>
          )}

          {phase === "image-built" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-xs">
              <FiBox className="w-3.5 h-3.5" />
              Image Ready • Awaiting Deploy
            </span>
          )}

          {phase === "deploying" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              Deploying Image to Cluster…
            </span>
          )}

          {phase === "live" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Production Live
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* Visual Pipeline Progress Stepper */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Step 1: Environment & Config */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "config"
                ? "bg-blue-50/70 border-blue-200 text-blue-900"
                : "bg-slate-50/80 border-slate-200 text-slate-700"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
                {phase !== "config" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FiKey className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Repository Selected</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Automatic build detection</p>
            </div>

            {/* Step 2: Build Image */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "building"
                ? "bg-blue-50/70 border-blue-200 text-blue-900"
                : phase === "image-built" || phase === "deploying" || phase === "live"
                  ? "bg-slate-50/80 border-slate-200 text-slate-700"
                  : "bg-white border-slate-200/60 opacity-60 text-slate-400"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</span>
                {phase === "building" ? (
                  <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                ) : phase === "image-built" || phase === "deploying" || phase === "live" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FiBox className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Build Image</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Docker Container Build</p>
            </div>

            {/* Step 3: Verified Image Artifact */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "image-built"
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20"
                : phase === "deploying" || phase === "live"
                  ? "bg-slate-50/80 border-slate-200 text-slate-700"
                  : "bg-white border-slate-200/60 opacity-60 text-slate-400"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
                {phase === "image-built" ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ) : phase === "deploying" || phase === "live" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FiLayers className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Image Ready & ENV</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{phase === "config" || phase === "building" ? "Pending Build" : `ID: ${shortImageId}`}</p>
            </div>

            {/* Step 4: Deploy Image */}
            <div className={`p-3.5 rounded-xl border transition ${phase === "deploying"
                ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                : phase === "live"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-white border-slate-200/60 opacity-60 text-slate-400"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 4</span>
                {phase === "deploying" ? (
                  <span className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                ) : phase === "live" ? (
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FiGlobe className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Deploy Image</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Cluster Rollout & SSL</p>
            </div>

          </div>
        </section>

        {buildError && <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{buildError}</div>}
        {phase === "building" && (
          <BuildProgress status={getBuildStatus(build?.status)} repository={repo.full_name || repo.name} branch={branch} elapsed={elapsed} warning={pollError} />
        )}
        {/* Build the selected repository with automatic detection */}
        {phase === "config" && (
          <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FiBox className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 break-all">{repo.full_name || repo.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">Branch: {branch}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Language and build settings are detected automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={handleBuildImage}
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <FiBox className="w-4 h-4" />
                <span>Build Image</span>
              </button>
            </div>
          </section>
        )}

        {/* PHASE 3: Image Built Artifact Screen (Show Image ID + 'Deploy Image' button) */}
        {phase === "image-built" && (
          <section ref={imageReadyRef} tabIndex={-1} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fadeIn focus:outline-none">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <FiBox className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Image Built Successfully
                    </span>
                    <span className="text-xs text-slate-400">Ready for Cluster Deployment</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Docker Container Image Artifact
                  </h3>
                </div>
              </div>


            </div>

            {build && <div className="mt-5"><BuildDetails build={build} message="Image build completed successfully" /></div>}

            <div className="mt-6 space-y-4">
              {/* Environment Variables Card */}
              <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FiKey className="w-4 h-4 text-blue-600" />
                      Deployment Environment Variables (ENV)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your image is ready. Add runtime variables for your application, then deploy the image.
                    </p>
                  </div>

                  <button
                    onClick={addEnvVar}
                    className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/70 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Add Variable</span>
                  </button>
                </div>

                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <label htmlFor="bulk-env" className="block text-sm font-bold text-slate-900">Paste multiple variables</label>
                  <p className="mt-1 mb-3 text-xs text-slate-500">Paste your .env contents, one KEY=value per line. Matching names will be updated; imported values are hidden in the review below.</p>
                  <textarea
                    id="bulk-env"
                    value={bulkEnv}
                    onChange={e => { setBulkEnv(e.target.value); setEnvError(""); setEnvNotice(""); }}
                    placeholder={"NODE_ENV=production\nPORT=80\nAPI_URL=https://api.example.com"}
                    spellCheck={false}
                    autoComplete="off"
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs font-mono leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">Supports comments, quoted values, and export KEY=value.</span>
                    <button type="button" onClick={importEnv} disabled={!bulkEnv.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">Import variables</button>
                  </div>
                </div>
                {envError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{envError}</p>}
                {envNotice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{envNotice}</p>}
                <h4 className="mb-3 text-xs font-bold text-slate-700">Review variables ({envVars.length})</h4>
                {/* Env Vars Input List */}
                <div className="space-y-3">
                  {envVars.map((env) => (
                    <div
                      key={env.id}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70"
                    >
                      <input
                        type="text"
                        placeholder="KEY (e.g. PORT)"
                        value={env.key}
                        onChange={(e) => updateEnvVar(env.id, "key", e.target.value)}
                        className="w-full sm:w-1/3 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                      />

                      <div className="relative flex-1">
                        <input
                          type={env.isSecret && !showSecretMap[env.id] ? "password" : "text"}
                          placeholder="VALUE"
                          value={env.value}
                          onChange={(e) => updateEnvVar(env.id, "value", e.target.value)}
                          className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                        />

                        {env.isSecret && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret(env.id)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-white text-slate-500 border-slate-200"
                            }`}
                        >
                          {env.isSecret ? "Secret" : "Plain"}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeEnvVar(env.id)}
                          className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
                  <FiKey className="w-3.5 h-3.5 text-slate-400" />
                  <span>These variables are used when the container starts.</span>
                </div>
              </article>


              <div className="flex justify-end">
                {/* 'Deploy Image' Button */}
                <button
                  onClick={handleDeployImage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 shrink-0"
                >
                  <FiPlay className="w-4 h-4 fill-current" />
                  <span>Deploy Application</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PHASE 5: Production Live Console (Vercel/Railway Production Grade UI) */}
        {phase === "live" && (
          <section className="space-y-6 animate-fadeIn">

            {/* Top Deployment Header Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">

                {/* Left: Project & Domain Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Production Ready
                    </span>

                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {deploymentId}
                    </span>

                    <span className="text-xs text-slate-400">
                      • Deployed 14 seconds ago
                    </span>
                  </div>

                  {/* Main Domain Link */}
                  <div className="flex items-center gap-2">
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl sm:text-2xl font-bold text-slate-900 hover:text-blue-600 transition flex items-center gap-2 group tracking-tight"
                    >
                      <span>{repo.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.deployforge.app</span>
                      <FiExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <FiLock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Automatic SSL TLS 1.3 Active • Global Edge Routing (240+ PoPs)</span>
                  </p>
                </div>

                {/* Right: Primary Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    onClick={copyLiveUrl}
                    className="h-10 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-2xs"
                  >
                    {copiedUrl ? <FiCheck className="w-4 h-4 text-emerald-600" /> : <FiCopy className="w-4 h-4 text-slate-500" />}
                    <span>{copiedUrl ? "Copied URL" : "Copy URL"}</span>
                  </button>

                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Visit Live Application</span>
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                </div>

              </div>

              {/* Production Metadata Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Cluster Instance</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <FiServer className="w-3.5 h-3.5f text-blue-600" />
                    AWS us-east-1 (1 Pod)
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Container Image</span>
                  <p className="font-mono text-xs font-bold text-slate-800 truncate" title={imageId}>
                    {build?.image.reference}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Source Git Branch</span>
                  <p className="font-semibold text-slate-800 font-mono">
                    main · commit 8f4e2b1
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Health Probe</span>
                  <p className="font-semibold text-emerald-700 flex items-center gap-1">
                    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    200 OK (14ms latency)
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Browser Preview Card (Vercel Style) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">

              {/* Browser Window Chrome */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                </div>

                {/* Mock Address Bar */}
                <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-1 text-xs text-slate-600 font-mono flex items-center gap-1.5 max-w-sm w-full shadow-2xs">
                  <FiLock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{liveUrl}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <button
                    onClick={copyLiveUrl}
                    className="hover:text-slate-600 p-1 rounded transition cursor-pointer"
                    title="Copy URL"
                  >
                    <FiCopy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-600 p-1 rounded transition"
                    title="Open in new tab"
                  >
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Preview Content Area */}
              <div className="p-8 bg-gradient-to-b from-slate-50 to-white min-h-[260px] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                  <FiGlobe className="w-7 h-7" />
                </div>

                <h4 className="text-base font-bold text-slate-900">
                  {repo.name} is running in production
                </h4>

                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Serving HTTP traffic with automatic SSL encryption and edge caching across global endpoints.
                </p>

                <div className="flex items-center gap-3 mt-5">
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>Open Live Preview</span>
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleBuildImage}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiRotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Redeploy Container</span>
                  </button>
                </div>
              </div>

            </div>

          </section>
        )}
      </div>

    </main>
  );
};

export default BuildPipeline;
