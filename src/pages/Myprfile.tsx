import {
  FiCheckCircle,
  FiCloud,
  FiGitBranch,
  FiGithub,
  FiPlay,
  FiSettings,
  FiExternalLink,
  FiActivity,
  FiLayers,
  FiClock,
  FiArrowUpRight,
} from "react-icons/fi";

import { UsergetUser } from "../React-Query/Auth";
import { Link, useNavigate } from "react-router-dom";
import { UsegetMyrepo } from "../React-Query/GetMyRepo";
import { useState } from "react";
import RepoShow from "./Components/AllRepo";

const Myprfile = () => {
  const navigate = useNavigate();
  const [isrepoShow, setIsRepoShow] = useState(false);
  const { data: user, isLoading, isError } = UsergetUser();
  const { data: repos } = UsegetMyrepo();

  const displayName = user?.username || "kiran";
  const userEmail = user?.email || "kr551344@gmail.com";
  
  const initials =
    displayName
      ?.split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KR";

  const repoList = Array.isArray(repos) ? repos : [];
  const latestRepo = repoList[0] || {
    name: "cloud-course-project",
    full_name: "kiran04-code/cloud-course-project",
    default_branch: "main",
    updated_at: new Date().toISOString(),
  };

  const recentDeployments = [
    {
      id: "dep-184",
      name: "production-api",
      branch: "main",
      commit: "8f4e2b1",
      commitMsg: "feat: add multi-cloud routing & health probes",
      time: "2m ago",
      env: "Production",
      status: "Success",
      duration: "1m 24s",
    },
    {
      id: "dep-183",
      name: "cloud-course-project",
      branch: "main",
      commit: "c2b810f",
      commitMsg: "chore: update container cluster manifest",
      time: "14m ago",
      env: "Preview",
      status: "Success",
      duration: "48s",
    },
    {
      id: "dep-182",
      name: "frontend-dashboard",
      branch: "feat/repo-explorer",
      commit: "4d9a112",
      commitMsg: "ui: optimize responsive modal & repository view",
      time: "1h ago",
      env: "Production",
      status: "Success",
      duration: "2m 05s",
    },
    {
      id: "dep-181",
      name: "auth-worker-service",
      branch: "main",
      commit: "7e3c98a",
      commitMsg: "sec: token verification pipeline upgrade",
      time: "3h ago",
      env: "Staging",
      status: "Deployed",
      duration: "1m 10s",
    },
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 animate-pulse mb-4 shadow-sm">
          <FiCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Loading your workspace…</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Deploy Forge servers</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <FiActivity className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Unable to load dashboard</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            Your session may have expired. Please sign in again to access your workspace.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            Go to Login Page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row relative">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 px-4 py-6 flex flex-col shrink-0 justify-between">
        <div>
          {/* Logo */}
          <div className="px-3 flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 mb-8">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <FiCloud className="w-4 h-4" />
            </div>
            <span>
              Deploy <span className="text-blue-600">Forge</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            <a
              href="#overview"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl
                     bg-blue-50 text-blue-600 font-semibold text-xs transition border border-blue-100/60 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <FiCloud className="w-4 h-4 text-blue-600" />
                <span>Overview</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </a>

            <a
              href="#projects"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl
                     text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium text-xs transition"
            >
              <div className="flex items-center gap-3">
                <FiLayers className="w-4 h-4" />
                <span>Projects</span>
              </div>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">3</span>
            </a>

            <a
              href="#deployments"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl
                     text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium text-xs transition"
            >
              <div className="flex items-center gap-3">
                <FiPlay className="w-4 h-4" />
                <span>Deployments</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </a>

            <button
              onClick={() => setIsRepoShow(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl
                     text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium text-xs transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <FiGithub className="w-4 h-4" />
                <span>Repositories</span>
              </div>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">
                {repoList.length > 0 ? repoList.length : "100"}
              </span>
            </button>

            <a
              href="#settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                     text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium text-xs transition"
            >
              <FiSettings className="w-4 h-4" />
              <span>Settings</span>
            </a>
          </nav>
        </div>

        {/* User Card in Sidebar */}
        <div className="mt-8 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs font-semibold text-slate-900 truncate">
                {displayName}
              </strong>
              <span className="block text-[11px] text-slate-400 truncate">
                {userEmail}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 px-4 sm:px-8 md:px-10 lg:px-12 py-8 md:py-9 overflow-y-auto max-w-7xl">

        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-600 mb-2">
              <FiCloud className="w-3 h-3" />
              WORKSPACE OVERVIEW
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {displayName}.
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Here is what is happening with your cloud deployments today.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsRepoShow(true)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <FiGithub className="w-4 h-4 text-slate-600" />
              <span>Browse repositories</span>
            </button>

            <button
              onClick={() => setIsRepoShow(true)}
              className="flex items-center gap-2
                     bg-blue-600 hover:bg-blue-700 active:scale-95
                     text-white px-5 py-2.5 rounded-xl
                     shadow-md shadow-blue-500/25
                     text-xs font-semibold transition cursor-pointer"
            >
              <FiPlay className="w-3.5 h-3.5" />
              <span>Select repository</span>
            </button>
          </div>
        </header>

        {/* 3 Metric Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          <article className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100/70
                          flex items-center justify-center
                          text-blue-600 shrink-0">
                <FiCloud className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Active Projects
                </p>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <strong className="text-2xl font-bold text-slate-900">
                    3
                  </strong>
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                    +1 this month
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Multi-cloud AWS & GCP
                </span>
              </div>
            </div>
          </article>

          <article className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/70
                          flex items-center justify-center
                          text-emerald-600 shrink-0">
                <FiCheckCircle className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Success Rate
                </p>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <strong className="text-2xl font-bold text-slate-900">
                    99.8%
                  </strong>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Healthy
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  All systems operational
                </span>
              </div>
            </div>
          </article>

          <article className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100/70
                          flex items-center justify-center
                          text-purple-600 shrink-0">
                <FiGitBranch className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  GitHub Connected
                </p>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <strong className="text-2xl font-bold text-slate-900">
                    1 account
                  </strong>
                  <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-md">
                    {repoList.length > 0 ? `${repoList.length} repos` : "100 repos"}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Auto-sync enabled
                </span>
              </div>
            </div>
          </article>

        </section>

        {/* GitHub + Build Row */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5 mb-6">

          {/* GitHub Connection Card */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FiGithub className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    GitHub connection
                  </h2>
                </div>

                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>

              {/* User Profile info */}
              <div className="flex items-center gap-3.5 mb-5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-slate-900">
                    {displayName}
                  </strong>
                  <small className="text-xs text-slate-400 block truncate">
                    {userEmail}
                  </small>
                </div>

                <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  OAuth Active
                </span>
              </div>

              {/* Repository preview box */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/80 flex items-center justify-center text-blue-600 shrink-0">
                    <FiGitBranch className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <strong className="block text-xs font-bold text-slate-900 truncate">
                      {latestRepo.name}
                    </strong>
                    <small className="text-[11px] text-slate-400 block truncate">
                      {latestRepo.default_branch || "main"} · Last active recently
                    </small>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate("/build", { state: { repo: latestRepo } })}
                    className="cursor-pointer text-white bg-blue-600 hover:bg-blue-700 active:scale-95 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <FiPlay className="w-3 h-3" />
                    <span>Build</span>
                  </button>

                  <button
                    onClick={() => setIsRepoShow(true)}
                    className="cursor-pointer text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View all ({repoList.length > 0 ? repoList.length : "100"})</span>
                    <FiArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
              <span>Automatic webhook synchronization active</span>
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => setIsRepoShow(true)}>
                Manage Repositories →
              </span>
            </div>
          </article>

          {/* Latest Build Card */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <FiPlay className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Latest build
                  </h2>
                </div>

                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Passed
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900">
                    #184 · production build
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    main branch
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden mt-3">
                  <div className="h-full w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full" />
                </div>

                <div className="flex justify-between mt-2.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    Commit <b className="text-blue-600 font-semibold font-mono">8f4e2b1</b>
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3 h-3 text-slate-400" />
                    1m 24s
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              <span>Deployed to US-East cluster</span>
              <a href="#deployments" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View Build Logs <FiExternalLink className="w-3 h-3" />
              </a>
            </div>
          </article>

        </section>

        {/* Recent Deployments Table/List */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <FiCloud className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent deployments
                </h2>
                <p className="text-[11px] text-slate-400">
                  History of latest automated builds & production releases
                </p>
              </div>
            </div>

            <button className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer">
              View all builds
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentDeployments.map((dep) => (
              <div
                key={dep.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-3 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-xs font-bold text-slate-900 truncate">
                        {dep.name}
                      </strong>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        {dep.branch}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                        {dep.env}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">
                      {dep.commitMsg}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs justify-between sm:justify-end">
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                    {dep.commit}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {dep.time}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                    {dep.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </section>

      {/* Repository Full Modal */}
      {isrepoShow && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 md:p-6"
          onClick={() => setIsRepoShow(false)}
        >
          <div
            className="relative w-full max-w-6xl h-[90vh] bg-[#f8fafc] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <RepoShow
              onClose={() => setIsRepoShow(false)}
              repos={repoList}
            />
          </div>
        </div>
      )}

    </main>
  );
};

export default Myprfile;
