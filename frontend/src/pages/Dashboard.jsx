import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:4000/api/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("PROJECTS:", data);
        setProjects(Array.isArray(data) ? data : data.projects || []);
      })
      .catch(() => setError("Failed to load projects"));
  }, []);

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h2>Dashboard</h2>

      {/* ACTION BUTTONS */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => navigate("/jobs")}>🌍 Browse Jobs</button>

        {user?.role === "client" && (
          <>
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => navigate("/jobs/create")}
            >
              ➕ Post Job
            </button>
          </>
        )}
      </div>

      <hr />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Your Projects</h3>

      {projects.length === 0 && <p>No projects yet.</p>}

      {projects.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #444",
            padding: "12px",
            marginBottom: "10px",
            cursor: "pointer",
          }}
          onClick={() => navigate(`/projects/${p.id}`)}
        >
          <p>Status: {p.status}</p>
          <small>Project ID: {p.id}</small>
        </div>
      ))}
    </div>
  );
}