import { useState } from "react";
import { uploadInvoice, confirmInvoice } from "../api";
import { UploadCloud, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const navigate = useNavigate();

  const onUpload = async () => {
    if (!file) return;
    setStatus("Extracting data and analyzing footprints...");
    try {
      const resp = await uploadInvoice({ file });
      setStatus("Extraction complete. Please review the details closely.");
      
      const parsed = resp.extractedData || {};
      setReviewData({
        fileName: resp.fileName,
        extractedData: parsed,
        warnings: resp.warnings || [],
        vendor: parsed.vendor || "",
        amount: parsed.total || 0,
        type: "expense",
        invoiceNo: parsed.invoiceNo || "",
        date: parsed.issueDate || new Date().toISOString().slice(0, 10),
        category: parsed.category || "Uncategorized"
      });
      setReviewMode(true);
    } catch (error) {
      setStatus(error.message || "Upload failed");
    }
  };

  const onConfirm = async () => {
    setStatus("Authorizing and saving to database...");
    try {
      await confirmInvoice({
        fileName: reviewData.fileName,
        extractedData: reviewData.extractedData,
        vendor: reviewData.vendor,
        amount: reviewData.amount,
        type: reviewData.type,
        invoiceNo: reviewData.invoiceNo,
        date: reviewData.date,
        category: reviewData.category
      });
      setStatus("Invoice saved successfully! Redirecting...");
      setTimeout(() => navigate('/invoices'), 1500);
    } catch (error) {
      setStatus(error.message || "Confirmation failed");
    }
  };

  const updateReviewField = (key, val) => {
    setReviewData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Upload Invoice</h2>
          <p className="page-subtitle">Upload a PDF or image. All uploads automatically run through intelligent Duplicate & Anomaly scans.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'left' }}>
        {!reviewMode ? (
          <div style={{ textAlign: 'center' }}>
            <div className="upload-dropzone">
              <UploadCloud className="upload-icon" />
              <span className="upload-text">Drag & drop or click to upload</span>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Supports PDF, JPG, PNG</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            
            {file && (
              <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>Selected file:</p>
                <p className="muted" style={{ margin: '4px 0 0' }}>{file.name}</p>
              </div>
            )}

            <button className="btn primary" onClick={onUpload} disabled={!file} style={{ marginTop: 24, width: '100%' }}>
              Upload & Scan
            </button>
            {status && <p className="muted" style={{ marginTop: 16 }}>{status}</p>}
          </div>
        ) : (
          <div>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>Review Extraction Details</h3>
            
            {reviewData.warnings && reviewData.warnings.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {reviewData.warnings.map((w, idx) => (
                  <div key={idx} className="alert-banner error" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontWeight: 600 }}>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1, padding: 12, border: reviewData.type === 'expense' ? '2px solid #D93025' : '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', background: reviewData.type === 'expense' ? '#FEE2E2' : 'transparent' }} onClick={() => updateReviewField('type', 'expense')}>
                <input type="radio" checked={reviewData.type === 'expense'} readOnly style={{ marginRight: 8 }} />
                <span style={{ fontWeight: 600, color: reviewData.type === 'expense' ? '#D93025' : 'inherit' }}>Accounts Payable (Expense)</span>
              </div>
              <div style={{ flex: 1, padding: 12, border: reviewData.type === 'income' ? '2px solid #1E8E3E' : '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', background: reviewData.type === 'income' ? '#E6F4EA' : 'transparent' }} onClick={() => updateReviewField('type', 'income')}>
                <input type="radio" checked={reviewData.type === 'income'} readOnly style={{ marginRight: 8 }} />
                <span style={{ fontWeight: 600, color: reviewData.type === 'income' ? '#1E8E3E' : 'inherit' }}>Accounts Receivable (Income)</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>{reviewData.type === 'income' ? 'Client Name' : 'Vendor Name'}</label>
                <input style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={reviewData.vendor} onChange={e => updateReviewField('vendor', e.target.value)} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Invoice No</label>
                <input style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={reviewData.invoiceNo} onChange={e => updateReviewField('invoiceNo', e.target.value)} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Total Amount</label>
                <input type="number" step="0.01" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={reviewData.amount} onChange={e => updateReviewField('amount', parseFloat(e.target.value) || 0)} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Issue Date</label>
                <input type="date" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={reviewData.date?.slice(0,10)} onChange={e => updateReviewField('date', e.target.value)} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Category</label>
                <input style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} value={reviewData.category} onChange={e => updateReviewField('category', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button className="btn secondary" style={{ flex: 1 }} onClick={() => { setFile(null); setReviewMode(false); setStatus(null); }}>
                Cancel & Re-Upload
              </button>
              <button className="btn primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={onConfirm}>
                <CheckCircle size={18} /> Confirm & Save
              </button>
            </div>

            {status && <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>{status}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
