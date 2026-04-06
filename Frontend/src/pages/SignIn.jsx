import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../auth";
import { LogIn } from "lucide-react";

export function SignIn() {
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
      await signIn({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <LogIn size={48} />
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>
        
        <form className="auth-form" onSubmit={onSubmit}>
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
              placeholder="Enter your password"
              required
            />
          </div>
          
          {error && <p className="error-text" style={{ fontSize: "0.85rem", marginTop: 8 }}>{error}</p>}
          
          <button className="btn primary" type="submit" disabled={loading} style={{ marginTop: 16, width: '100%' }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        
        <p className="muted" style={{ marginTop: 24, fontSize: "0.9rem" }}>
          Don't have an account? <Link to="/signup" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
