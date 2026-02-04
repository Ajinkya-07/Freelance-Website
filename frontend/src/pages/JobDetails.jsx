import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [job, setJob] = useState(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  const [myProposal, setMyProposal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // =========================
    // FETCH JOB
    // =========================
    fetch(`http://localhost:4000/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setJob(data);
      });

    // =========================
    // EDITOR: CHECK MY PROPOSAL
    // =========================
    if (user?.role === "editor") {
      fetch(`http://localhost:4000/api/proposals/job/${id}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => setMyProposal(data))
        .catch(() => {});
    }

  }, [id]);

  // =========================
  // SUBMIT PROPOSAL
  // =========================
  const submitProposal = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/proposals/job/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price,
            message,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Proposal submitted ✅");

      setMyProposal(data);

    } catch (err) {
      console.error(err);
      alert("Failed to submit proposal");
    }
  };

  if (error) {
    return <h2 style={{ textAlign: "center", color: "red" }}>{error}</h2>;
  }

  if (!job) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  const isOwner = user?.id === job.client_id;

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>{job.title}</h2>

      <p>{job.description}</p>

      <p>💰 {job.budget_min} – {job.budget_max}</p>
      <p>⏱ {job.duration_minutes} mins</p>

      <hr />

      {/* ============================
            CLIENT VIEW
      ============================ */}
      {user?.role === "client" && isOwner && (
        <>
          <button
            onClick={() => navigate(`/jobs/${job.id}/proposals`)}
          >
            View Proposals
          </button>
        </>
      )}

      {/* ============================
          EDITOR ALREADY APPLIED
      ============================ */}
      {user?.role === "editor" && myProposal && (
        <p style={{ color: "lightgreen" }}>
          ✅ You already submitted a proposal
        </p>
      )}

      {/* ============================
          APPLY FORM (EDITOR)
      ============================ */}
      {user?.role === "editor" &&
        !isOwner &&
        !myProposal && (
          <>
            <h3>Apply to this job</h3>

            <input
              placeholder="Your price"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />

            <br /><br />

            <textarea
              placeholder="Cover message"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />

            <br /><br />

            <button onClick={submitProposal}>
              Submit Proposal
            </button>
          </>
        )}

      <br />

      <button onClick={() => navigate(-1)}>
        ⬅ Back
      </button>
    </div>
  );
}