import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data.projects);
      setError("");
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to load projects.",
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError("Project name is required.");
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      await api.post("/projects", { name: newName.trim() });
      setNewName("");
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    const messages = {
      revoke: "Revoke this API key? Services using it will lose access.",
      regenerate:
        "Regenerate API key? The old key will stop working immediately.",
      delete: "Delete this project permanently? This cannot be undone.",
    };
    if (!confirm(messages[action])) return;
    setActionLoading(`${id}-${action}`);
    try {
      if (action === "revoke") await api.patch(`/projects/${id}/revoke`);
      else if (action === "regenerate")
        await api.patch(`/projects/${id}/regenerate`);
      else if (action === "delete") await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch {
      alert(`Failed to ${action} project. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const copyKey = (id, key) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const activeCount = projects.filter((p) => p.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">
                SMTP Middleware
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">smtp.vinasai.ca</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Projects",
              value: projects.length,
              color: "text-white",
            },
            {
              label: "Active Keys",
              value: activeCount,
              color: "text-emerald-400",
            },
            {
              label: "Revoked Keys",
              value: projects.length - activeCount,
              color: "text-red-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Global error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <svg
              className="w-5 h-5 text-red-400 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Create project */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Project
          </h2>
          <form onSubmit={createProject} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="e.g. Service A, Booking System..."
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setFormError("");
                }}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-800 border text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 transition-all ${
                  formError
                    ? "border-red-500/70 focus:ring-red-500/30"
                    : "border-slate-700 focus:ring-indigo-500/40 focus:border-indigo-500/60"
                }`}
              />
              {formError && (
                <p className="text-red-400 text-xs mt-1.5">{formError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
              {loading ? "Creating..." : "Create"}
            </button>
          </form>
        </div>

        {/* Projects list */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold text-base">Projects</h2>
            <span className="text-slate-500 text-sm">
              {projects.length} total
            </span>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <svg
                className="animate-spin w-6 h-6 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 font-medium text-sm">
                No projects yet
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Create your first project above
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {projects.map((p) => (
                <div
                  key={p._id}
                  className={`px-6 py-4 transition-all ${!p.isActive ? "opacity-50" : "hover:bg-slate-800/30"}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-semibold text-sm">
                          {p.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.isActive
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-emerald-400" : "bg-red-400"}`}
                          />
                          {p.isActive ? "Active" : "Revoked"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg font-mono border border-slate-700 truncate max-w-xs">
                          {p.apiKey.slice(0, 28)}...
                        </code>
                        <button
                          onClick={() => copyKey(p._id, p.apiKey)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                            copiedId === p._id
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 hover:text-white border-slate-700 hover:border-slate-600"
                          }`}
                        >
                          {copiedId === p._id ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-slate-600 text-xs">
                        Created{" "}
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · by {p.createdBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleAction(p._id, "regenerate")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all disabled:opacity-50"
                      >
                        <svg
                          className={`w-3.5 h-3.5 ${actionLoading === `${p._id}-regenerate` ? "animate-spin" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Regenerate
                      </button>

                      {p.isActive && (
                        <button
                          onClick={() => handleAction(p._id, "revoke")}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all disabled:opacity-50"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                          Revoke
                        </button>
                      )}

                      <button
                        onClick={() => handleAction(p._id, "delete")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
