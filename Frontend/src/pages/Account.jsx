import { useState } from "react";
import { getCurrentUser, updateCurrentUser } from "../auth";

export function Account() {
  const user = getCurrentUser();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updates = { name, email };
      if (newPassword) {
        updates.currentPassword = currentPassword;
        updates.newPassword = newPassword;
      }

      await updateCurrentUser(updates);
      setMessage("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Account Settings</h2>
          <p className="page-subtitle">Manage your profile and security credentials.</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSave} style={{ maxWidth: 600 }}>
        <h3 style={{ marginTop: 0, marginBottom: 24 }}>Profile Information</h3>
        
        <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
          <div className="input-group">
            <label>Name</label>
            <input 
              className="input-field" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Your name" 
            />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              className="input-field" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              placeholder="you@example.com" 
            />
          </div>
        </div>

        <h3 style={{ marginBottom: 24 }}>Change Password</h3>
        
        <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
          <div className="input-group">
            <label>Current password</label>
            <input
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="input-group">
            <label>New password</label>
            <input
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Leave blank to keep current"
            />
          </div>
        </div>

        {error && <p className="error-text" style={{ fontSize: '0.9rem', marginBottom: 16 }}>{error}</p>}
        {message && <p className="success-text" style={{ fontSize: '0.9rem', marginBottom: 16 }}>{message}</p>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
