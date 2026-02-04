import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:4000/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        console.log("JOBS:", data);
        setJobs(data);
      })
      .catch(() => setError("Failed to load jobs"));
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h2>Open Jobs</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {jobs.length === 0 && <p>No jobs posted yet.</p>}
      
      <button
        onClick={() => navigate("/Dashboard")}
        style={{
        marginBottom: "20px",
        }}
      >
       ⬅ Back
      </button>

      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            border: "1px solid #444",
            padding: "12px",
            marginBottom: "10px",
            cursor: "pointer",
          }}
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          <h4>{job.title}</h4>
          <p>{job.description.slice(0, 100)}...</p>

          <p>
            💰 {job.budget_min || "?"} – {job.budget_max || "?"}
          </p>

          <small>Posted by: {job.client_name}</small>
        </div>
      ))}
    </div>
  );
}