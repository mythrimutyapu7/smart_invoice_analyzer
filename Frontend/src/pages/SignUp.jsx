import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../auth";
import { UserPlus } from "lucide-react";

export function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <UserPlus size={48} />
          <h1>Create Account</h1>
          <p>Sign up for an invoice dashboard account</p>
        </div>
        
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="input-group">
            <label>Name</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
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
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Choose a password"
              required
            />
          </div>
          
          {error && <p className="error-text" style={{ fontSize: "0.85rem", marginTop: 8 }}>{error}</p>}
          
          <button className="btn primary" type="submit" disabled={loading} style={{ marginTop: 16, width: '100%' }}>
            {loading ? "Creating Account…" : "Sign Up"}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 24, fontSize: "0.9rem" }}>
          Already have an account? <Link to="/signin" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
