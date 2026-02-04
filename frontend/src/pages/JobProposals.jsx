import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JobProposals() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [proposals, setProposals] = useState([]);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // =====================
    // FETCH PROPOSALS
    // =====================
    fetch(`http://localhost:4000/api/proposals/job/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log("PROPOSALS:", data);
        setProposals(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load proposals"));

    // =====================
    // FETCH JOB
    // =====================
    fetch(`http://localhost:4000/api/jobs/${id}`)
      .then(res => res.json())
      .then(setJob);

  }, [id]);

  // =====================
  // ACCEPT PROPOSAL
  // =====================
  const acceptProposal = async (proposalId) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/proposals/accept/${proposalId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("🎉 Proposal accepted — Project created!");

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Failed to accept proposal");
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Proposals</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {proposals.length === 0 && <p>No proposals yet.</p>}

      {proposals.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #444",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          <p><b>Editor:</b> {p.editor_name}</p>
          <p><b>Price:</b> ₹{p.price}</p>
          <p>{p.message}</p>

          <button onClick={() => acceptProposal(p.id)}>
            ✅ Accept Proposal
          </button>
        </div>
      ))}

      <br />

      <button onClick={() => navigate(-1)}>
        ⬅ Back
      </button>
    </div>
  );
}