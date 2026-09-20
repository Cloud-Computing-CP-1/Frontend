import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Lock,
    Globe,
    GitFork,
    Star,
    ExternalLink,
    Calendar,
    X,
} from "lucide-react";
import { FiGithub, FiPlay } from "react-icons/fi";

export interface RepoItem {
    id: number | string;
    name: string;
    full_name: string;
    description?: string | null;
    private: boolean;
    fork: boolean;
    html_url?: string;
    homepage?: string | null;
    language?: string | null;
    stargazers_count?: number;
    forks_count?: number;
    watchers_count?: number;
    open_issues_count?: number;
    default_branch?: string;
    created_at?: string;
    pushed_at?: string;
    updated_at?: string;
    owner?:owner
    archived?: boolean;
    [key: string]: any;
}
interface owner {
    login:string
}
interface RepoShowProps {
    repos?: RepoItem[];
    onClose: () => void;
    onBuild?: (repo: RepoItem) => void;
}

const getLanguageColor = (lang?: string | null) => {
    if (!lang) return "#94a3b8";
    const colors: Record<string, string> = {
        TypeScript: "#3178c6",
        JavaScript: "#eab308",
        Python: "#3b82f6",
        HTML: "#ea580c",
        CSS: "#8b5cf6",
        Go: "#06b6d4",
        Rust: "#f97316",
        Java: "#d97706",
        PHP: "#6366f1",
        Ruby: "#ef4444",
        "C#": "#10b981",
        "C++": "#ec4899",
    };
    return colors[lang] || "#64748b";
};

const RepoShow = ({ repos = [], onClose, onBuild }: RepoShowProps) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);

    const handleBuild = (repo: RepoItem) => {
        if (onBuild) {
            onBuild(repo);
        }
        navigate("/build", { state: { repo } });
    };

    const filteredRepos = useMemo(() => {
        return repos.filter((repo) => {
            const matchesSearch =
                repo.name?.toLowerCase().includes(search.toLowerCase()) ||
                repo.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                (repo.description && repo.description.toLowerCase().includes(search.toLowerCase()));

            const matchesFilter =
                filter === "all"
                    ? true
                    : filter === "private"
                        ? repo.private
                        : filter === "public"
                            ? !repo.private
                            : filter === "fork"
                                ? repo.fork
                                : true;

            return matchesSearch && matchesFilter;
        });
    }, [repos, search, filter]);

    return (
        <div className="w-full h-full flex flex-col bg-[#f8fafc] overflow-y-auto">

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs shrink-0">
                <div className="w-full px-6 py-4">

                    {/* Header Title */}
                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                                <FiGithub className="w-5 h-5" />
                            </div>

                            <div>
                                <h1 className="text-lg font-semibold text-slate-900">
                                    Your repositories
                                </h1>

                                <p className="text-xs text-slate-500">
                                    Select a connected GitHub repository to build its container image
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg border border-slate-200
                            flex items-center justify-center hover:bg-slate-100 transition cursor-pointer text-slate-500 hover:text-slate-700"
                        >
                            <X className="w-4 h-4" />
                        </button>

                    </div>

                    {/* Search + Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">

                        <div className="relative flex-1">

                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2
                                w-4 h-4 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Search repositories..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 rounded-lg
                                border border-slate-200 bg-white text-sm
                                outline-none focus:border-blue-500
                                focus:ring-2 focus:ring-blue-100 transition"
                            />

                        </div>

                        <div className="flex gap-1.5 shrink-0">

                            {[
                                ["all", "All"],
                                ["public", "Public"],
                                ["private", "Private"],
                                ["fork", "Forks"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setFilter(value)}
                                    className={`px-3.5 h-9 rounded-lg text-xs font-medium
                                    border transition cursor-pointer
                                    ${filter === value
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}

                        </div>
                    </div>

                    {/* Compact Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pb-1">

                        <StatCard
                            label="Total"
                            value={repos.length}
                            icon={<FiGithub className="w-4 h-4" />}
                        />

                        <StatCard
                            label="Public"
                            value={repos.filter((repo) => !repo.private).length}
                            icon={<Globe className="w-4 h-4" />}
                        />

                        <StatCard
                            label="Private"
                            value={repos.filter((repo) => repo.private).length}
                            icon={<Lock className="w-4 h-4" />}
                        />

                        <StatCard
                            label="Forks"
                            value={repos.filter((repo) => repo.fork).length}
                            icon={<GitFork className="w-4 h-4" />}
                        />

                    </div>

                </div>
            </div>

            {/* Repository list */}
            <main className="w-full px-6 py-5 flex-1">

                <div className="flex items-center justify-between mb-4">

                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Repositories
                        </h2>

                        <p className="text-xs text-slate-500 mt-0.5">
                            Showing {filteredRepos.length} of {repos.length}
                        </p>
                    </div>

                </div>

                {filteredRepos.length === 0 ? (

                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">

                        <FiGithub className="w-10 h-10 mx-auto text-slate-300" />

                        <h3 className="mt-3 text-sm font-semibold text-slate-800">
                            No repositories found
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                            Try changing your search or filter.
                        </p>

                    </div>

                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">

                        {filteredRepos.map((repo) => (
                            <RepositoryCard
                                key={repo.id}
                                repo={repo}
                                onClick={() => setSelectedRepo(repo)}
                                onBuild={() => handleBuild(repo)}
                            />
                        ))}

                    </div>

                )}

            </main>

            {/* Details Modal */}
            {selectedRepo && (
                <RepositoryDetails
                    repo={selectedRepo}
                    onClose={() => setSelectedRepo(null)}
                    onBuild={() => handleBuild(selectedRepo)}
                />
            )}

        </div>
    );
};


/* -------------------------------- */
/* Streamlined Repository Card */
/* -------------------------------- */

interface RepositoryCardProps {
    repo: RepoItem;
    onClick: () => void;
    onBuild: () => void;
}

const RepositoryCard = ({ repo, onClick, onBuild }: RepositoryCardProps) => {
    const langColor = getLanguageColor(repo.language);

    return (
        <div
            onClick={onClick}
            className="bg-white border border-slate-200/90 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
        >

            <div>
                {/* Header: Name + Visibility */}
                <div className="flex items-start justify-between gap-2">

                    <div className="flex items-center gap-2.5 min-w-0">

                        <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                            <FiGithub className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">

                            <div className="flex items-center gap-2 flex-wrap">

                                <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                                    {repo.name}
                                </h3>

                                {repo.private ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                        <Lock className="w-2.5 h-2.5" />
                                        Private
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <Globe className="w-2.5 h-2.5" />
                                        Public
                                    </span>
                                )}

                                {repo.archived && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                        Archived
                                    </span>
                                )}

                            </div>

                        </div>

                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition" />

                </div>

                {/* Optional description (only if provided) */}
                {repo.description && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2">
                        {repo.description}
                    </p>
                )}
            </div>

            {/* Bottom Meta & Build Action */}
            <div className={`flex items-center justify-between gap-3 pt-3 border-t border-slate-100 ${repo.description ? "mt-3" : "mt-4"}`}>

                <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">

                    {/* Primary Language */}
                    {repo.language ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: langColor }}
                            />
                            <span>{repo.language}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400 text-xs">Plain</span>
                    )}

                    {/* Updated Date */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(repo.updated_at)}</span>
                    </div>

                    {/* Stars (only if > 0) */}
                    {Boolean(repo.stargazers_count && repo.stargazers_count > 0) && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{repo.stargazers_count}</span>
                        </div>
                    )}

                    {/* Forks (only if > 0) */}
                    {Boolean(repo.forks_count && repo.forks_count > 0) && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <GitFork className="w-3 h-3" />
                            <span>{repo.forks_count}</span>
                        </div>
                    )}

                </div>

                {/* Build Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBuild();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 shadow-xs bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/20"
                >
                    <FiPlay className="w-3 h-3 fill-current" />
                    <span>Select & Build</span>
                </button>

            </div>

        </div>
    );
};


/* -------------------------------- */
/* Details Modal (Full Properties) */
/* -------------------------------- */

interface RepositoryDetailsProps {
    repo: RepoItem;
    onClose: () => void;
    onBuild: () => void;
}

const RepositoryDetails = ({ repo, onClose, onBuild }: RepositoryDetailsProps) => {
    return (
        <div
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-xs
            flex items-center justify-center p-4"
            onClick={onClose}
        >

            <div
                className="bg-white w-full max-w-lg max-h-[85vh]
                overflow-y-auto rounded-2xl shadow-2xl border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10">

                    <div className="flex justify-between items-start">

                        <div className="flex gap-3">

                            <div className="w-10 h-10 rounded-xl bg-blue-50
                            flex items-center justify-center border border-blue-100 text-blue-600">
                                <FiGithub className="w-5 h-5" />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    {repo.name}
                                </h2>

                                <p className="text-xs text-slate-500 mt-0.5">
                                    {repo.full_name}
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 border border-slate-200
                            flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                    </div>

                </div>

                <div className="p-5 space-y-4">

                    {repo.description && (
                        <div>
                            <h4 className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Description</h4>
                            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {repo.description}
                            </p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div>
                        <h4 className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">Properties</h4>
                        <div className="grid grid-cols-2 gap-2.5">

                            <Detail label="Repository ID" value={repo.id} />

                            <Detail
                                label="Visibility"
                                value={repo.private ? "Private" : "Public"}
                            />

                            <Detail
                                label="Default branch"
                                value={repo.default_branch || "N/A"}
                            />

                            <Detail
                                label="Language"
                                value={repo.language || "N/A"}
                            />

                            <Detail
                                label="Stars"
                                value={repo.stargazers_count ?? 0}
                            />

                            <Detail
                                label="Forks"
                                value={repo.forks_count ?? 0}
                            />

                            <Detail
                                label="Open issues"
                                value={repo.open_issues_count ?? 0}
                            />

                            <Detail
                                label="Watchers"
                                value={repo.watchers_count ?? 0}
                            />

                            <Detail
                                label="Created"
                                value={formatDate(repo.created_at)}
                            />

                            <Detail
                                label="Last pushed"
                                value={formatDate(repo.pushed_at)}
                            />

                            <Detail
                                label="Archived"
                                value={repo.archived ? "Yes" : "No"}
                            />

                            <Detail
                                label="Fork"
                                value={repo.fork ? "Yes" : "No"}
                            />

                        </div>
                    </div>

                    {/* Build Button & External Links */}
                    <div className="pt-3 space-y-2">

                        <button
                            onClick={onBuild}
                            className="w-full h-10 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99]"
                        >
                            <FiPlay className="w-3.5 h-3.5 fill-current" />
                            <span>Select & Build Image</span>
                        </button>

                        <div className="flex gap-2.5">
                            {repo.html_url && (
                                <a
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 h-9 rounded-lg border border-slate-200 bg-white
                                    text-slate-700 flex items-center justify-center
                                    gap-1.5 text-xs font-medium hover:bg-slate-50 transition"
                                >
                                    <FiGithub className="w-3.5 h-3.5 text-slate-600" />
                                    Open on GitHub
                                </a>
                            )}

                            {repo.homepage && (
                                <a
                                    href={repo.homepage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 h-9 rounded-lg border
                                    border-slate-200 flex items-center
                                    justify-center gap-1.5 text-xs font-medium
                                    hover:bg-slate-50 text-slate-700 transition"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    Website
                                </a>
                            )}
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};


/* -------------------------------- */
/* Small Components */
/* -------------------------------- */

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
}

const StatCard = ({ label, value, icon }: StatCardProps) => (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3">

        <div className="flex items-center gap-1.5 text-slate-500">

            {icon}

            <span className="text-xs font-medium">
                {label}
            </span>

        </div>

        <div className="text-base font-semibold text-slate-900 mt-1">
            {value}
        </div>

    </div>
);


interface DetailProps {
    label: string;
    value: string | number;
}

const Detail = ({ label, value }: DetailProps) => (
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">

        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {label}
        </p>

        <p className="text-xs font-semibold text-slate-800 mt-0.5 break-all">
            {value}
        </p>

    </div>
);


const formatDate = (date?: string | null) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default RepoShow;
