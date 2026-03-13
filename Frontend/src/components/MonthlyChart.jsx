import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function MonthlyChart({ data }) {
  const labels = data.map((d) => d._id);
  const totals = data.map((d) => d.total);

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: "Total",
            data: totals,
            backgroundColor: "rgba(56, 189, 248, 0.75)",
          },
        ],
      }}
      options={{
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (typeof value === "number") {
                  return new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(value);
                }
                return value;
              },
            },
          },
        },
      }}
    />
  );
}
