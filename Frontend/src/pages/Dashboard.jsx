import { useCallback, useEffect, useState } from "react";
import { getSummary, getFiltersLookup, exportReport } from "../api";
import { SummaryCards } from "../components/SummaryCards";
import { CategoryChart } from "../components/CategoryChart";
import { MonthlyChart } from "../components/MonthlyChart";
import { Loader2, AlertCircle, Filter, LayoutDashboard, BarChart3, Download } from "lucide-react";

import { MonthlyTracker } from "../components/MonthlyTracker";
import { ProfitLossCards } from "../components/ProfitLossCards";

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [filters, setFilters] = useState({ vendor: "", category: "", status: "", startDate: "", endDate: "" });
  const [lookup, setLookup] = useState({ vendors: [], categories: [] });

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSummary(filters);
      setSummary(data);
    } catch (err) {
      // Handled by Layout / redirect
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    getFiltersLookup().then(setLookup).catch(console.error);
  }, []);

  const updateFilter = (key, val) => setFilters(p => ({ ...p, [key]: val }));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="page-title">Dashboard Overview</h2>
          <p className="page-subtitle">Track your spending and invoice analytics.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', background: 'none', border: 'none',
            borderBottom: activeTab === "overview" ? '2px solid #4318FF' : '2px solid transparent',
            color: activeTab === "overview" ? '#4318FF' : 'var(--text-secondary)',
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s'
          }}
        >
          <LayoutDashboard size={18} /> Monthly Insights
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', background: 'none', border: 'none',
            borderBottom: activeTab === "analytics" ? '2px solid #4318FF' : '2px solid transparent',
            color: activeTab === "analytics" ? '#4318FF' : 'var(--text-secondary)',
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s'
          }}
        >
          <BarChart3 size={18} /> Advanced Analytics
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 className="muted" size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {summary?.overdueCount > 0 && (
            <div className="alert-banner error" style={{ marginBottom: 24, padding: '16px 24px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: 600 }}>Action Required: You have {summary.overdueCount} overdue payment(s) totaling ${summary.overdueAmount}. Please review your invoices immediately.</span>
            </div>
          )}

          {activeTab === "overview" && (
            <MonthlyTracker />
          )}

          {activeTab === "analytics" && (
            <div style={{ animation: 'fade-in 0.3s ease-out' }}>
              <section className="card filter-bar" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, padding: 16, alignItems: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}><Filter size={18}/> Filters:</div>
                
                <select style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} value={filters.vendor} onChange={e => updateFilter('vendor', e.target.value)}>
                  <option value="">All Vendors</option>
                  {lookup.vendors.map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <select style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {lookup.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="date" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} />
                  <span className="muted">to</span>
                  <input type="date" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} />
                </div>
                
                <button className="btn secondary" onClick={() => setFilters({ vendor: "", category: "", status: "", startDate: "", endDate: "" })}>Clear Filters</button>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => exportReport(filters, 'csv')} style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#e0e7ff', color: '#4318FF' }}>
                    <Download size={16} /> Export CSV
                  </button>
                  <button className="btn" onClick={() => exportReport(filters, 'pdf')} style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#FEE2E2', color: '#DC2626' }}>
                    <Download size={16} /> Export PDF
                  </button>
                </div>
              </section>

              <ProfitLossCards summary={summary} />

              <section className="summary-cards-wrapper">
                <SummaryCards summary={summary} />
              </section>
              
              <section className="charts-grid">
                <div className="card chart-card">
                  <h2>Category Breakdown</h2>
                  <CategoryChart data={summary?.categories ?? []} />
                </div>
                <div className="card chart-card">
                  <h2>Historical Spending</h2>
                  <MonthlyChart data={summary?.monthly ?? []} />
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
