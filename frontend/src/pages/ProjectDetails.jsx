import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [error, setError] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [fileType, setFileType] = useState("draft");
  const [selectedFile, setSelectedFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // ---------------- FETCH PROJECT ----------------
  const fetchProject = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setProject(data.project);
    } catch {
      setError("Failed to load project");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProject();
  }, [id]);

  // ---------------- FETCH FILES ----------------
  useEffect(() => {
    if (!token) return;
    fetch(`http://localhost:4000/api/files/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => console.error("Failed to load files"));
  }, [id]);

  // ---------------- FETCH ACTIVITIES ----------------
  useEffect(() => {
    if (!token) return;
    fetch(`http://localhost:4000/api/projects/${id}/activity`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setActivities(data.activities || []))
      .catch(() => console.error("Failed to load activities"));
  }, [id]);

  // ---------------- FETCH MILESTONES ----------------
  useEffect(() => {
    if (!token) return;
    fetch(`http://localhost:4000/api/milestones/project/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMilestones(data.milestones || []))
      .catch(() => console.error("Failed to load milestones"));
  }, [id]);

  // ---------------- PROJECT ACTIONS ----------------
  const handleProjectAction = async (action, body = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/projects/${id}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Action failed");
      } else {
        alert(data.message || "Success!");
        fetchProject();
        // Refresh activities
        const actRes = await fetch(`http://localhost:4000/api/projects/${id}/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const actData = await actRes.json();
        setActivities(actData.activities || []);
      }
    } catch (err) {
      alert("Action failed");
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
      setShowRevisionModal(false);
      setShowHoldModal(false);
      setCancelReason("");
      setRevisionNotes("");
      setHoldReason("");
    }
  };

  const handleComplete = () => {
    if (confirm("Are you sure you want to mark this project as complete? This action cannot be undone.")) {
      handleProjectAction("complete", { feedback: "Project approved" });
    }
  };

  const handleCancel = () => {
    handleProjectAction("cancel", { reason: cancelReason });
  };

  const handleRequestRevision = () => {
    handleProjectAction("request-revision", { notes: revisionNotes });
  };

  const handleSubmitForReview = () => {
    if (confirm("Submit this project for client review?")) {
      handleProjectAction("submit-for-review", { message: "Ready for review" });
    }
  };

  const handlePutOnHold = () => {
    handleProjectAction("hold", { reason: holdReason });
    setShowHoldModal(false);
    setHoldReason("");
  };

  const handleResume = () => {
    if (confirm("Resume this project?")) {
      handleProjectAction("resume");
    }
  };



  // ---------------- UPLOAD ----------------
  async function handleUpload(e) {
    e.preventDefault();

    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("file_type", fileType);

    try {
      const res = await fetch(
        `http://localhost:4000/api/files/${id}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setUploadMsg(data.error || "Upload failed");
        return;
      }

      setUploadMsg("Upload successful ✅");
      setSelectedFile(null);

      // refresh file list
      const filesRes = await fetch(
        `http://localhost:4000/api/files/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const filesData = await filesRes.json();
      setFiles(filesData.files || []);

    } catch (err) {
      console.error(err);
      setUploadMsg("Upload error");
    }
  }

  // ---------------- DOWNLOAD ----------------
  async function handleDownload(fileId, fileName) {
    try {
      const res = await fetch(
        `http://localhost:4000/api/files/download/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        alert("Download failed");
        return;
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Download error");
    }
  }

  if (error) {
    return (
      <div style={{ padding: "40px", color: "red" }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Loading project...</h2>
      </div>
    );
  }

  // Define these after project is loaded
  const isClient = user?.id === project?.client_id;
  const isEditor = user?.id === project?.editor_id;

  const statusColors = {
    in_progress: "#3498db",
    under_review: "#f39c12",
    revision_requested: "#e74c3c",
    completed: "#27ae60",
    cancelled: "#95a5a6",
    on_hold: "#9b59b6",
  };

  const statusLabels = {
    in_progress: "In Progress",
    under_review: "Under Review",
    revision_requested: "Revision Requested",
    completed: "Completed",
    cancelled: "Cancelled",
    on_hold: "On Hold",
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0 }}>{project.job_title || `Project #${project.id}`}</h2>
          <p style={{ color: "#666", margin: "5px 0" }}>
            {isClient ? `Editor: ${project.editor_name}` : `Client: ${project.client_name}`}
          </p>
        </div>
        <span style={{
          padding: "8px 16px",
          borderRadius: "20px",
          backgroundColor: statusColors[project.status] || "#666",
          color: "white",
          fontWeight: "bold",
        }}>
          {statusLabels[project.status] || project.status}
        </span>
      </div>

      {/* Progress Bar */}
      {project.progress && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span>Progress</span>
            <span>{project.progress.percentage}% ({project.progress.completed}/{project.progress.total} milestones)</span>
          </div>
          <div style={{ height: "10px", backgroundColor: "#eee", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{
              width: `${project.progress.percentage}%`,
              height: "100%",
              backgroundColor: "#27ae60",
              transition: "width 0.3s",
            }} />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        padding: "15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        {/* Client Actions */}
        {isClient && project.status === "under_review" && (
          <>
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✅ Approve & Complete
            </button>
            <button
              onClick={() => setShowRevisionModal(true)}
              disabled={actionLoading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f39c12",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              🔄 Request Revision
            </button>
          </>
        )}

        {/* Editor Actions */}
        {isEditor && (project.status === "in_progress" || project.status === "revision_requested") && (
          <button
            onClick={handleSubmitForReview}
            disabled={actionLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: actionLoading ? "not-allowed" : "pointer",
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            {actionLoading ? "Submitting..." : "📤 Submit for Review"}
          </button>
        )}

        {/* Hold Button - Only for in_progress or revision_requested */}
        {(project.status === "in_progress" || project.status === "revision_requested") && (
          <button
            onClick={() => setShowHoldModal(true)}
            disabled={actionLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#9b59b6",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: actionLoading ? "not-allowed" : "pointer",
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            ⏸️ Put on Hold
          </button>
        )}

        {/* Resume Button - Only when on_hold */}
        {project.status === "on_hold" && (
          <button
            onClick={handleResume}
            disabled={actionLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: actionLoading ? "not-allowed" : "pointer",
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            {actionLoading ? "Resuming..." : "▶️ Resume Project"}
          </button>
        )}

        {/* Cancel Button - Not for completed or cancelled */}
        {project.status !== "completed" && project.status !== "cancelled" && (
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={actionLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: actionLoading ? "not-allowed" : "pointer",
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            ❌ Cancel Project
          </button>
        )}

        {/* Completed/Cancelled message */}
        {project.status === "completed" && (
          <span style={{ color: "#27ae60", fontWeight: "bold", padding: "10px" }}>
            🎉 This project has been completed!
          </span>
        )}
        {project.status === "cancelled" && (
          <span style={{ color: "#e74c3c", fontWeight: "bold", padding: "10px" }}>
            This project was cancelled. {project.cancellation_reason && `Reason: ${project.cancellation_reason}`}
          </span>
        )}
      </div>

      {/* Revision Notes Banner */}
      {project.status === "revision_requested" && project.revision_notes && (
        <div style={{
          padding: "15px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          marginBottom: "20px",
        }}>
          <strong>📝 Revision Notes:</strong>
          <p style={{ margin: "10px 0 0" }}>{project.revision_notes}</p>
          {project.revision_count > 0 && (
            <small style={{ color: "#666" }}>Revision #{project.revision_count}</small>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #eee" }}>
        {["overview", "files", "milestones", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              border: "none",
              backgroundColor: activeTab === tab ? "#3498db" : "transparent",
              color: activeTab === tab ? "white" : "#666",
              cursor: "pointer",
              borderRadius: "5px 5px 0 0",
              fontWeight: activeTab === tab ? "bold" : "normal",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 10px" }}>Project Details</h4>
            <p><strong>Escrow Amount:</strong> ${project.escrow_amount}</p>
            <p><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
            {project.completed_at && (
              <p><strong>Completed:</strong> {new Date(project.completed_at).toLocaleDateString()}</p>
            )}
          </div>
          <div style={{ padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 10px" }}>Statistics</h4>
            <p><strong>Files:</strong> {project.stats?.files?.total_files || 0}</p>
            <p><strong>Activities:</strong> {project.stats?.activityCount || 0}</p>
            <p><strong>Milestones:</strong> {project.stats?.milestones?.completed || 0}/{project.stats?.milestones?.total || 0}</p>
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div>
          <h3>Files</h3>
          {files.length === 0 && <p>No files uploaded yet.</p>}
          {files.map((f) => (
            <div
              key={f.id}
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                marginBottom: "8px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ marginRight: "10px" }}>📄</span>
                <strong>{f.file_name}</strong>
                <span style={{
                  marginLeft: "10px",
                  padding: "2px 8px",
                  backgroundColor: f.file_type === "final" ? "#27ae60" : "#3498db",
                  color: "white",
                  borderRadius: "10px",
                  fontSize: "12px",
                }}>
                  {f.file_type}
                </span>
              </div>
              <button
                onClick={() => handleDownload(f.id, f.file_name)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </div>
          ))}

          {/* Upload Form - Editor Only */}
          {isEditor && project.status !== "completed" && project.status !== "cancelled" && (
            <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
              <h4>Upload File</h4>
              <form onSubmit={handleUpload} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  style={{ padding: "8px" }}
                >
                  <option value="draft">Draft</option>
                  <option value="final">Final</option>
                </select>
                <button type="submit" style={{
                  padding: "8px 16px",
                  backgroundColor: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}>
                  Upload
                </button>
              </form>
              {uploadMsg && <p style={{ marginTop: "10px" }}>{uploadMsg}</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === "milestones" && (
        <div>
          <h3>Milestones</h3>
          {milestones.length === 0 && <p>No milestones yet.</p>}
          {milestones.map((m, idx) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px",
                marginBottom: "8px",
                borderRadius: "8px",
                backgroundColor: m.status === "completed" ? "#d4edda" : "#f8f9fa",
                border: "1px solid #ddd",
              }}
            >
              <span style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: m.status === "completed" ? "#27ae60" : "#ddd",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "15px",
              }}>
                {m.status === "completed" ? "✓" : idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <strong>{m.title}</strong>
                {m.description && <p style={{ margin: "5px 0 0", color: "#666", fontSize: "14px" }}>{m.description}</p>}
              </div>
              <span style={{
                padding: "4px 12px",
                borderRadius: "15px",
                fontSize: "12px",
                backgroundColor: m.status === "completed" ? "#27ae60" : m.status === "in_progress" ? "#f39c12" : "#ddd",
                color: m.status === "completed" || m.status === "in_progress" ? "white" : "#666",
              }}>
                {m.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "activity" && (
        <div>
          <h3>Activity Log</h3>
          {activities.length === 0 && <p>No activity yet.</p>}
          <div style={{ borderLeft: "2px solid #ddd", paddingLeft: "20px" }}>
            {activities.map((a) => (
              <div key={a.id} style={{ marginBottom: "15px", position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: "-26px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#3498db",
                }} />
                <p style={{ margin: 0, fontWeight: "bold" }}>{a.description}</p>
                <small style={{ color: "#666" }}>
                  by {a.user_name} • {new Date(a.created_at).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            maxWidth: "400px",
            width: "90%",
          }}>
            <h3 style={{ margin: "0 0 15px" }}>Cancel Project</h3>
            <p>Are you sure you want to cancel this project? This action cannot be undone.</p>
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "15px", minHeight: "80px" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Keep Project
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Cancelling..." : "Cancel Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            maxWidth: "400px",
            width: "90%",
          }}>
            <h3 style={{ margin: "0 0 15px" }}>Request Revision</h3>
            <p>Please describe what changes you'd like the editor to make:</p>
            <textarea
              placeholder="Revision notes..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "15px", minHeight: "100px" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRevisionModal(false)}
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={actionLoading || !revisionNotes.trim()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f39c12",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading || !revisionNotes.trim() ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Sending..." : "Request Revision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {showHoldModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            maxWidth: "400px",
            width: "90%",
          }}>
            <h3 style={{ margin: "0 0 15px" }}>Put Project on Hold</h3>
            <p>This will pause all work on the project. You can resume it later.</p>
            <textarea
              placeholder="Reason for putting on hold (optional)"
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "15px", minHeight: "80px" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowHoldModal(false); setHoldReason(""); }}
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handlePutOnHold}
                disabled={actionLoading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#9b59b6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Putting on Hold..." : "Put on Hold"}
              </button>
            </div>
          </div>
        </div>
      )}

      <br />
      <button onClick={() => navigate("/dashboard")} style={{
        padding: "10px 20px",
        cursor: "pointer",
      }}>⬅ Back to Dashboard</button>
    </div>
  );
}