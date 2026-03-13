import { useCallback, useRef, useState } from "react";

export function UploadPanel({ onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setFile(file);
      await onUpload(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onUpload]
  );

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
    }
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  return (
    <div className="upload-card">
      <h2>Upload Invoice</h2>
      <p className="muted">
        Drag & drop a PDF/image or click to select. Invoices are processed via OCR and extracted automatically.
      </p>

      <label
        className={`upload-dropzone ${dragging ? "dragover" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          ref={inputRef}
          accept="application/pdf,image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
        <span className="upload-text">Drop invoice here or click to choose a file</span>
      </label>

      <button
        className="btn primary"
        disabled={!file}
        onClick={() => file && handleFile(file)}
        type="button"
      >
        Upload & Process
      </button>
    </div>
  );
}
