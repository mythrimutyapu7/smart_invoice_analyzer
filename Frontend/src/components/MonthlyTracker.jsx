import { useEffect, useState } from "react";
import { getMonthlyInsights } from "../api";
import { formatCurrency } from "../utils";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const COLORS = ['#4318FF', '#00B5D8', '#FF6347', '#FFD700', '#8A2BE2', '#32CD32'];

export function MonthlyTracker({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ month: "", year: "" });

  useEffect(() => {
    setLoading(true);
    getMonthlyInsights(filters)
      .then(resp => {
        setData(resp);
        if (!filters.month) {
          setFilters({ month: resp.month, year: resp.year });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.month, filters.year, refreshTrigger]);

  if (loading && !data) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 className="muted" size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  if (!data) return null;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];

  const isGrowth = data.growthFactor > 0;
  const TrendIcon = isGrowth ? TrendingUp : TrendingDown;
  const trendColor = isGrowth ? '#D93025' : '#1E8E3E';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { borderDash: [2, 4] } }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const lineChartData = {
    labels: data.dailyTrend.map(d => d.day),
    datasets: [
      {
        label: 'Spending',
        data: data.dailyTrend.map(d => d.total),
        fill: true,
        backgroundColor: 'rgba(67, 24, 255, 0.2)',
        borderColor: '#4318FF',
        tension: 0.4
      }
    ]
  };

  const pieChartData = {
    labels: data.categoryBreakdown.map(c => c.name),
    datasets: [
      {
        data: data.categoryBreakdown.map(c => c.value),
        backgroundColor: COLORS,
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="card" style={{ marginBottom: 24, padding: 24, borderLeft: '4px solid #4318FF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Monthly Insights</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>Comparative insights against previous calendar month</p>
          </div>
          
          <div style={{ display: 'flex', gap: 8, background: 'rgba(67, 24, 255, 0.05)', padding: 4, borderRadius: 8, marginLeft: 16 }}>
            <select 
              value={filters.month} 
              onChange={e => setFilters(f => ({ ...f, month: parseInt(e.target.value) }))}
              style={{ border: 'none', background: 'none', padding: '4px 8px', fontWeight: 600, color: '#4318FF', cursor: 'pointer' }}
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select 
              value={filters.year} 
              onChange={e => setFilters(f => ({ ...f, year: parseInt(e.target.value) }))}
              style={{ border: 'none', background: 'none', padding: '4px 8px', fontWeight: 600, color: '#4318FF', cursor: 'pointer' }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', position: 'relative' }}>
          {loading && <Loader2 size={16} className="muted" style={{ position: 'absolute', left: -24, top: 12, animation: 'spin 1s linear infinite' }} />}
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(data.thisMonthTotal)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: trendColor, fontWeight: 600, fontSize: '0.9rem', justifyContent: 'flex-end', marginTop: 4 }}>
            <TrendIcon size={16} />
            <span>{Math.abs(data.growthFactor)}% vs {months[data.month === 1 ? 11 : data.month - 2]}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
        <div style={{ height: 280 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Daily Burn Rate</h3>
          <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div style={{ height: 280 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Month Categories</h3>
          <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
            <Pie data={pieChartData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
