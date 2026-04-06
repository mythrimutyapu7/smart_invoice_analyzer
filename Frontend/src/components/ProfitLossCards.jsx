import { formatCurrency } from "../utils";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export function ProfitLossCards({ summary }) {
  if (!summary) return null;
  const isProfit = summary.netBalance >= 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
      <div className="card" style={{ padding: 24, borderLeft: '4px solid #1E8E3E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="muted" style={{ margin: 0, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Income</p>
          <h2 style={{ margin: '8px 0 0', fontSize: '1.8rem', color: '#1E8E3E' }}>{formatCurrency(summary.totalIncome || 0)}</h2>
        </div>
        <div style={{ background: '#E6F4EA', padding: 12, borderRadius: '50%', color: '#1E8E3E' }}>
          <TrendingUp size={24} />
        </div>
      </div>

      <div className="card" style={{ padding: 24, borderLeft: '4px solid #D93025', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="muted" style={{ margin: 0, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Expenses</p>
          <h2 style={{ margin: '8px 0 0', fontSize: '1.8rem', color: '#D93025' }}>{formatCurrency(summary.totalExpense || 0)}</h2>
        </div>
        <div style={{ background: '#FEE2E2', padding: 12, borderRadius: '50%', color: '#D93025' }}>
          <TrendingDown size={24} />
        </div>
      </div>

      <div className="card" style={{ padding: 24, borderLeft: `4px solid ${isProfit ? '#1E8E3E' : '#D93025'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isProfit ? '#F6FEF9' : '#FEF5F5' }}>
        <div>
          <p className="muted" style={{ margin: 0, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem' }}>Net {isProfit ? 'Profit' : 'Loss'}</p>
          <h2 style={{ margin: '8px 0 0', fontSize: '1.8rem', color: isProfit ? '#1E8E3E' : '#D93025' }}>
             {isProfit ? '+' : '-'}{formatCurrency(Math.abs(summary.netBalance || 0))}
          </h2>
        </div>
        <div style={{ background: isProfit ? '#E6F4EA' : '#FEE2E2', padding: 12, borderRadius: '50%', color: isProfit ? '#1E8E3E' : '#D93025' }}>
          <DollarSign size={24} />
        </div>
      </div>
    </div>
  );
}
