import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateJob() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:4000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          duration_minutes: duration,
          budget_min: budgetMin,
          budget_max: budgetMax,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Failed to create job");
        return;
      }

      setMsg("Job posted successfully ✅");

      setTimeout(() => navigate("/jobs"), 1000);

    } catch (err) {
      console.error(err);
      setMsg("Backend not reachable ❌");
    }
  }

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "auto" }}>
      <h2>Post New Job</h2>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br /><br />

        <textarea
          placeholder="Describe the job..."
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br /><br />

        <input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <br /><br />

        <input
          type="number"
          placeholder="Budget Min"
          value={budgetMin}
          onChange={(e) => setBudgetMin(e.target.value)}
        />
        <br /><br />

        <input
          type="number"
          placeholder="Budget Max"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
        />
        <br /><br />

        <button>Post Job</button>

      </form>

      <p>{msg}</p>

      <button onClick={() => navigate("/dashboard")}>⬅ Back</button>
    </div>
  );
}