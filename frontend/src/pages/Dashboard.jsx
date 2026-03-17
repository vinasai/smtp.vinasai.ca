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
  const revokedCount = projects.length - activeCount;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80"
        style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-slate-900 flex items-center justify-center shadow-sm flex-shrink-0">
              <svg
                className="w-[18px] h-[18px] text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[14.5px] font-bold text-slate-900 leading-none tracking-tight">
                SMTP Middleware
              </p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">
                smtp.vinasai.ca
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 cursor-pointer text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-all duration-150 shadow-sm"
          >
            <svg
              className="w-[14px] h-[14px]"
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
            Log out
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Page title */}
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none">
            Projects
          </h1>
          <p className="text-[13.5px] text-slate-400 mt-1.5">
            Manage API keys and service access control.
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Projects",
              value: projects.length,
              valueClass: "text-slate-900",
              iconBg: "bg-slate-100",
              iconColor: "text-slate-500",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              ),
            },
            {
              label: "Active Keys",
              value: activeCount,
              valueClass: "text-emerald-600",
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-500",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ),
            },
            {
              label: "Revoked Keys",
              value: revokedCount,
              valueClass: "text-red-500",
              iconBg: "bg-red-50",
              iconColor: "text-red-400",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-slate-200/80 p-4 flex items-center gap-3.5 transition-shadow duration-200 hover:shadow-md"
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center flex-shrink-0`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {stat.icon}
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.09em]">
                  {stat.label}
                </p>
                <p
                  className={`text-[28px] font-bold leading-none mt-0.5 ${stat.valueClass}`}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Global error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3">
            <svg
              className="w-4 h-4 text-red-400 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[13px] text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* ── Create project ── */}
        <div
          className="bg-white border border-slate-200/80 overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-[13.5px] font-semibold text-slate-700">
              New Project
            </h2>
          </div>

          <div className="px-5 py-4">
            <form onSubmit={createProject} className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="e.g. Booking System, Notification Service…"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setFormError("");
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-[13.5px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 outline-none focus:bg-white focus:ring-[3px] ${
                    formError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                  }`}
                />
                {formError && (
                  <p className="text-[12px] text-red-500 font-medium mt-1.5">
                    {formError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-xl transition-all duration-150 flex items-center gap-2 whitespace-nowrap shadow-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-3.5 h-3.5 opacity-70"
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
                    Creating…
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
                        strokeWidth={2.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Projects list ── */}
        <div
          className="bg-white border border-slate-200/80 rounded-xl overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[13.5px] font-semibold text-slate-700">
              All Projects
            </h2>
            <span className="text-[12px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {projects.length} total
            </span>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <svg
                className="animate-spin w-5 h-5 text-slate-400"
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
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-600">
                  No projects yet
                </p>
                <p className="text-[12.5px] text-slate-400 mt-0.5">
                  Create your first project above
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map((p) => (
                <div
                  key={p._id}
                  className={`px-5 py-4 transition-colors duration-150 ${
                    !p.isActive ? "opacity-50" : "hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      {/* Name + badge */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[14px] font-semibold text-slate-900">
                          {p.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                              : "bg-red-50 text-red-500 ring-1 ring-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-red-400"}`}
                          />
                          {p.isActive ? "Active" : "Revoked"}
                        </span>
                      </div>

                      {/* API key row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-[11.5px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg truncate max-w-[220px]">
                          {p.apiKey.slice(0, 28)}…
                        </code>
                        <button
                          onClick={() => copyKey(p._id, p.apiKey)}
                          className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                            copiedId === p._id
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {copiedId === p._id ? (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3"
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
                              Copy key
                            </>
                          )}
                        </button>
                      </div>

                      {/* Meta */}
                      <p className="text-[11.5px] text-slate-400">
                        Created{" "}
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · by {p.createdBy}
                      </p>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0 pt-0.5">
                      {/* Regenerate */}
                      <button
                        onClick={() => handleAction(p._id, "regenerate")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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

                      {/* Revoke */}
                      {p.isActive && (
                        <button
                          onClick={() => handleAction(p._id, "revoke")}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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

                      {/* Delete */}
                      <button
                        onClick={() => handleAction(p._id, "delete")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
