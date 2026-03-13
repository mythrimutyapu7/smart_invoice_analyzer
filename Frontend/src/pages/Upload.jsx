import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../auth";
import { uploadInvoice } from "../api";

export function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin", { replace: true });
    }
  }, [navigate]);

  const onUpload = async () => {
    if (!file) return;
    setStatus("Uploading…");
    try {
      await uploadInvoice({ file });
      setStatus("Upload complete. Invoice has been processed.");
      setFile(null);
    } catch (error) {
      if (error.message === "Unauthorized") {
        navigate("/signin", { replace: true });
        return;
      }
      setStatus(error.message || "Upload failed");
    }
  };

  return (
    <div className="page upload-page">
      <div className="page-header">
        <h2>Upload Invoice</h2>
        <button className="btn secondary" onClick={() => navigate("/dashboard")}>Back</button>
      </div>

      <div className="upload-card">
        <p className="muted">Select a PDF/image invoice to upload and process via OCR.</p>
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="btn primary" onClick={onUpload} disabled={!file}>
          Upload & Process
        </button>
        {status && <p className="muted">{status}</p>}
      </div>
    </div>
  );
}
