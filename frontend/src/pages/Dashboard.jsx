import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data.projects);
    } catch {
      setError("Failed to load projects");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/projects", { name: newName.trim() });
      setNewName("");
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const revokeProject = async (id) => {
    if (!confirm("Revoke this API key?")) return;
    await api.patch(`/projects/${id}/revoke`);
    fetchProjects();
  };

  const regenerateKey = async (id) => {
    if (!confirm("Regenerate API key? The old key will stop working.")) return;
    await api.patch(`/projects/${id}/regenerate`);
    fetchProjects();
  };

  const deleteProject = async (id) => {
    if (!confirm("Delete this project permanently?")) return;
    await api.delete(`/projects/${id}`);
    fetchProjects();
  };

  const copyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>SMTP Middleware</h1>
          <p style={styles.subtitle}>Manage projects & API keys</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Create New Project</h2>
        <form onSubmit={createProject} style={styles.form}>
          <input
            type="text"
            placeholder="Project name (e.g. Service A)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.createBtn} disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Projects ({projects.length})</h2>
        {projects.length === 0 ? (
          <p style={styles.empty}>No projects yet. Create one above.</p>
        ) : (
          projects.map((p) => (
            <div
              key={p._id}
              style={{ ...styles.projectRow, opacity: p.isActive ? 1 : 0.5 }}
            >
              <div style={styles.projectInfo}>
                <div style={styles.projectName}>
                  {p.name}
                  <span
                    style={{
                      ...styles.badge,
                      background: p.isActive ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {p.isActive ? "Active" : "Revoked"}
                  </span>
                </div>
                <div style={styles.apiKeyRow}>
                  <code style={styles.apiKey}>{p.apiKey.slice(0, 24)}...</code>
                  <button
                    onClick={() => copyKey(p._id, p.apiKey)}
                    style={styles.copyBtn}
                  >
                    {copiedId === p._id ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div style={styles.meta}>
                  Created {new Date(p.createdAt).toLocaleDateString()} by{" "}
                  {p.createdBy}
                </div>
              </div>
              <div style={styles.actions}>
                <button
                  onClick={() => regenerateKey(p._id)}
                  style={styles.regenBtn}
                >
                  Regenerate
                </button>
                {p.isActive && (
                  <button
                    onClick={() => revokeProject(p._id)}
                    style={styles.revokeBtn}
                  >
                    Revoke
                  </button>
                )}
                <button
                  onClick={() => deleteProject(p._id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  subtitle: { margin: 0, color: "#888", fontSize: "14px" },
  logoutBtn: {
    padding: "8px 16px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a2e",
  },
  form: { display: "flex", gap: "12px" },
  input: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
  },
  createBtn: {
    padding: "10px 20px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  error: { color: "red", fontSize: "14px", marginTop: "8px" },
  empty: { color: "#aaa", textAlign: "center", padding: "24px 0" },
  projectRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid #f0f0f0",
    gap: "12px",
    flexWrap: "wrap",
  },
  projectInfo: { flex: 1 },
  projectName: {
    fontWeight: "600",
    fontSize: "16px",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  badge: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "20px",
    color: "#fff",
    fontWeight: "500",
  },
  apiKeyRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  apiKey: {
    background: "#f5f5f5",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "13px",
    color: "#555",
  },
  copyBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    background: "#e0e7ff",
    color: "#4f46e5",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
  meta: { fontSize: "12px", color: "#aaa" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  regenBtn: {
    padding: "6px 12px",
    background: "#fef3c7",
    color: "#d97706",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  revokeBtn: {
    padding: "6px 12px",
    background: "#fee2e2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  deleteBtn: {
    padding: "6px 12px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
};
