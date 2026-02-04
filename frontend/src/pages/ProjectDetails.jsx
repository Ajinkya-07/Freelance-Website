import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [fileType, setFileType] = useState("draft");
  const [selectedFile, setSelectedFile] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  const token = localStorage.getItem("token");

  // ---------------- FETCH PROJECT ----------------
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`http://localhost:4000/api/projects/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProject(data.project);
      })
      .catch(() => setError("Failed to load project"));
  }, [id]);

  // ---------------- FETCH FILES ----------------
  useEffect(() => {
    if (!token) return;

    fetch(`http://localhost:4000/api/files/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFiles(data.files || []);
      })
      .catch(() => console.error("Failed to load files"));
  }, [id]);

  

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

  return (
    <div style={{ padding: "40px" }}>
      <h2>Project #{project.id}</h2>

      <p>
        <b>Status:</b> {project.status}
      </p>

      <p>
        <b>Escrow:</b> ₹{project.escrow_amount}
      </p>

      <p>
        <b>Client ID:</b> {project.client_id}
      </p>

      <p>
        <b>Editor ID:</b> {project.editor_id}
      </p>

      <p>
        <b>Created:</b> {project.created_at}
      </p>

      <hr />

      {/* FILE LIST */}
      <h3>Files</h3>

      {files.length === 0 && <p>No files uploaded yet.</p>}

      {files.map((f) => (
        <div
          key={f.id}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            marginBottom: "6px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            📄 {f.file_name} ({f.file_type})
          </div>
          <button onClick={() => handleDownload(f.id, f.file_name)}>
            Download
          </button>
        </div>
      ))}

      <hr />

      {/* UPLOAD FORM — EDITOR ONLY */}
      {user?.role === "editor" && (
        <>
          <h3>Upload File</h3>

          <form onSubmit={handleUpload}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />

            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>

            <button type="submit">Upload</button>
          </form>

          {uploadMsg && <p>{uploadMsg}</p>}
        </>
      )}

      <br />

      <button onClick={() => navigate("/dashboard")}>⬅ Back</button>
    </div>
  );
}