import { useCallback, useEffect, useState } from "react";
import { getSummary, getFiltersLookup } from "../api";
import { SummaryCards } from "../components/SummaryCards";
import { CategoryChart } from "../components/CategoryChart";
import { MonthlyChart } from "../components/MonthlyChart";
import { Loader2, AlertCircle, Filter } from "lucide-react";

import { MonthlyTracker } from "../components/MonthlyTracker";

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
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
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard Overview</h2>
          <p className="page-subtitle">Track your spending and invoice analytics.</p>
        </div>
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

          <MonthlyTracker />

          <section className="card filter-bar" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, padding: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}><Filter size={18}/> Filters:</div>
            
            <select value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <select value={filters.vendor} onChange={e => updateFilter('vendor', e.target.value)}>
              <option value="">All Vendors</option>
              {lookup.vendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <select value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
              <option value="">All Categories</option>
              {lookup.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="date" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} />
              <span>to</span>
              <input type="date" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} />
            </div>
            
            <button className="btn secondary" onClick={() => setFilters({ vendor: "", category: "", status: "", startDate: "", endDate: "" })}>Clear</button>
          </section>

          <section className="summary-cards-wrapper">
            <SummaryCards summary={summary} />
          </section>
          
          <section className="charts-grid">
            <div className="card chart-card">
              <h2>Category Breakdown</h2>
              <CategoryChart data={summary?.categories ?? []} />
            </div>
            <div className="card chart-card">
              <h2>Monthly Spending</h2>
              <MonthlyChart data={summary?.monthly ?? []} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
