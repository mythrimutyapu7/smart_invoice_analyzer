import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated, signOut } from "../auth";
import { getSummary } from "../api";
import { SummaryCards } from "../components/SummaryCards";
import { CategoryChart } from "../components/CategoryChart";
import { MonthlyChart } from "../components/MonthlyChart";

export function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = getCurrentUser();

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSummary();
      setSummary(data);
    } catch (err) {
      // If token is invalid/expired, sign out and redirect to sign-in
      signOut();
      navigate("/signin", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin", { replace: true });
      return;
    }
    loadSummary();
  }, [navigate, loadSummary]);

  const handleLogout = () => {
    signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="page dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your invoices and spend categories.</p>
          {user && <p className="muted">Signed in as {user.name || user.email}</p>}
        </div>
        <div>
          <button className="btn secondary" onClick={() => navigate("/invoices")}>Invoices</button>
          <button className="btn secondary" onClick={() => navigate("/upload")}>Upload</button>
          <button className="btn secondary" onClick={() => navigate("/account")}>Account</button>
          <button className="btn danger" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      <section className="summary">
        <SummaryCards summary={summary} />
        <div className="card chart-card">
          <h2>Category Breakdown</h2>
          <CategoryChart data={summary?.categories ?? []} />
        </div>
        <div className="card chart-card">
          <h2>Monthly Spending</h2>
          <MonthlyChart data={summary?.monthly ?? []} />
        </div>
      </section>

      {loading && <p className="muted">Loading summary…</p>}
    </div>
  );
}
