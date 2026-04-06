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

export function MonthlyTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMonthlyInsights()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 className="muted" size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  if (!data) return null;

  const isGrowth = data.growthFactor > 0;
  const TrendIcon = isGrowth ? TrendingUp : TrendingDown;
  const trendColor = isGrowth ? '#D93025' : '#1E8E3E'; // Red if spent more, Green if spent less

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

  return (
    <div className="card" style={{ marginBottom: 24, padding: 24, borderLeft: '4px solid #4318FF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Current Month Analysis</h2>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>Comparative insights against previous calendar month</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(data.thisMonthTotal)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: trendColor, fontWeight: 600, fontSize: '0.9rem', justifyContent: 'flex-end', marginTop: 4 }}>
            <TrendIcon size={16} />
            <span>{Math.abs(data.growthFactor)}% vs last month</span>
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
