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
  const incomeTotals = data.map((d) => d.income || 0);
  const expenseTotals = data.map((d) => d.expense || 0);

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: "Income",
            data: incomeTotals,
            backgroundColor: "#E6F4EA",
            borderColor: "#1E8E3E",
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: "Expenses",
            data: expenseTotals,
            backgroundColor: "#FEE2E2",
            borderColor: "#D93025",
            borderWidth: 1,
            borderRadius: 4
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
