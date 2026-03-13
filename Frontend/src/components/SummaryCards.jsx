import { formatCurrency } from "../utils";

export function SummaryCards({ summary }) {
  const latest = summary?.latest;

  return (
    <div className="card">
      <h2>Expense Summary</h2>
      <div className="summary-grid">
        <div>
          <h3>Total Invoices</h3>
          <p>{summary ? summary.invoiceCount : "—"}</p>
        </div>
        <div>
          <h3>Total Spent</h3>
          <p>{summary ? formatCurrency(summary.totalAmount) : "—"}</p>
        </div>
        <div>
          <h3>Latest Invoice</h3>
          <p>
            {latest ? `${latest.vendor || "—"} (${new Date(latest.date).toLocaleDateString()})` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
