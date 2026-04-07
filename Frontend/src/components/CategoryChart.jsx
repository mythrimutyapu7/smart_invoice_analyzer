import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export function CategoryChart({ data, onCategoryClick }) {
  const labels = data.map((d) => d._id || "Uncategorized");
  const totals = data.map((d) => d.total);

  return (
    <Pie
      data={{
        labels,
        datasets: [
          {
            data: totals,
            backgroundColor: [
              "#22c55e",
              "#38bdf8",
              "#fb7185",
              "#f97316",
              "#a855f7",
            ],
          },
        ],
      }}
      options={{
        plugins: {
          legend: { position: "bottom" },
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && onCategoryClick) {
            const idx = elements[0].index;
            onCategoryClick(labels[idx]);
          }
        },
        onHover: (event, chartElement) => {
          if (event.native && event.native.target) {
            event.native.target.style.cursor = chartElement && chartElement.length > 0 ? 'pointer' : 'default';
          }
        }
      }}
    />
  );
}
