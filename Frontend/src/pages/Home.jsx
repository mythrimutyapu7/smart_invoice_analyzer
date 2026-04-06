import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated, signOut } from "../auth";
import { ArrowRight, LayoutDashboard, LogIn, FileText } from "lucide-react";

export function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleSignOut = () => {
    signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="home-page">
      <div className="hero-glow"></div>
      <div className="hero-content">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div className="stat-icon purple" style={{ width: 64, height: 64, borderRadius: 20 }}>
            <FileText size={32} />
          </div>
        </div>
        <h1 className="hero-title">Smart Invoice Analyzer</h1>
        <p className="hero-subtitle">
          Track, upload, and analyze your invoices with state-of-the-art NLP models. To begin, please sign in or sign up for an account.
        </p>

        {isAuthenticated() ? (
          <div>
            <p className="muted" style={{ marginBottom: 24 }}>Welcome back, {user?.name || user?.email}</p>
            <div className="hero-actions">
              <button className="btn primary hero-btn" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard size={20} />
                Go to Dashboard
              </button>
              <button className="btn secondary hero-btn" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        ) : (
          <div className="hero-actions">
            <Link className="btn primary hero-btn" to="/signin">
              <LogIn size={20} />
              Sign In
            </Link>
            <Link className="btn secondary hero-btn" to="/signup">
              Create Account
              <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
