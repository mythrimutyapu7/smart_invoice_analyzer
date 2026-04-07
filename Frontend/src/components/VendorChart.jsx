import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function VendorChart({ data }) {
  const labels = data.map((d) => d._id || "Unknown Vendor");
  const totals = data.map((d) => d.total);

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: "Total Spent",
            data: totals,
            backgroundColor: "#4318FF",
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` $${context.raw.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value}`
            }
          }
        }
      }}
    />
  );
}
