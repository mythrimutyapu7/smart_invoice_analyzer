import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated, signOut, updateCurrentUser } from "../auth";

export function Account() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin", { replace: true });
    }
  }, [navigate]);

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

  const handleLogout = () => {
    signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="page account">
      <div className="page-header">
        <h2>Account</h2>
        <div className="controls">
          <button className="btn secondary" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="btn danger" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSave}>
        <h3>Profile</h3>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
        </label>

        <h3>Change Password</h3>
        <label>
          Current password
          <input
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
            placeholder="Current password"
          />
        </label>
        <label>
          New password
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            placeholder="New password"
          />
        </label>

        {error && <p className="error">{error}</p>}
        {message && <p className="muted success">{message}</p>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
