import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated, signOut } from "../auth";

export function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleSignOut = () => {
    signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="page home">
      <h2>Welcome to the Invoice Dashboard</h2>
      <p>
        Track, upload, and analyze your invoices. To begin, please sign in or sign up.
      </p>

      {isAuthenticated() ? (
        <div className="home-actions">
          <p className="muted">Signed in as {user?.name || user?.email}</p>
          <button className="btn primary" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
          <button className="btn danger" onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div className="home-actions">
          <Link className="btn primary" to="/signin">
            Sign In
          </Link>
          <Link className="btn secondary" to="/signup">
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}
