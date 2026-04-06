import { formatCurrency } from "../utils";
import { Receipt, DollarSign, AlertCircle, Hourglass } from "lucide-react";

export function SummaryCards({ summary }) {
  return (
    <>
      <div className="colored-stat-card bg-purple">
        <div className="stat-icon">
          <Receipt size={24} />
        </div>
        <div className="stat-info">
          <p>{summary ? summary.invoiceCount : "—"}</p>
          <h3>Total Documents</h3>
        </div>
      </div>

      <div className="colored-stat-card bg-yellow">
        <div className="stat-icon">
          <Hourglass size={24} />
        </div>
        <div className="stat-info" style={{ minWidth: 100 }}>
          <p style={{ fontSize: '1.6rem' }}>
            {summary ? formatCurrency(summary.pendingAmount) : "—"}
          </p>
          <h3>Pending ({summary?.pendingCount || 0})</h3>
        </div>
      </div>
      
      <div className="colored-stat-card bg-red">
        <div className="stat-icon">
          <AlertCircle size={24} />
        </div>
        <div className="stat-info">
           <p style={{ fontSize: '1.6rem' }}>{summary ? formatCurrency(summary.overdueAmount) : "—"}</p>
           <h3>Overdue ({summary?.overdueCount || 0})</h3>
        </div>
      </div>
    </>
  );
}
