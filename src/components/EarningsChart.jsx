import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatIDR } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EarningsChart = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return null;
  }

  const data = {
    labels: activities.map(act => act.name),
    datasets: [
      {
        label: 'Honorarium (Rp)',
        data: activities.map(act => act.nominal),
        backgroundColor: '#2563eb', // Matches --primary
        borderRadius: 6,
        barThickness: 'flex',
        maxBarThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Cleaner look without legend since title explains it
      },
      title: {
        display: true,
        text: 'Proporsi Pendapatan per Kegiatan',
        align: 'start',
        font: {
          family: "'Inter', system-ui, sans-serif",
          size: 16,
          weight: 600
        },
        padding: {
          bottom: 20
        },
        color: '#0f172a' // Matches --text-main
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: "'Inter', system-ui, sans-serif", size: 13 },
        bodyFont: { family: "'Inter', system-ui, sans-serif", size: 14, weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = '';
            if (context.parsed.y !== null) {
              label += formatIDR(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9', // Very subtle grid lines
          drawBorder: false,
        },
        border: { display: false },
        ticks: {
          callback: function(value) {
            if (value >= 1000000) {
              return 'Rp ' + (value / 1000000) + ' Jt';
            }
            if (value >= 1000) {
              return 'Rp ' + (value / 1000) + 'k';
            }
            return value;
          },
          font: {
            family: "'Inter', system-ui, sans-serif",
            color: '#64748b' // Matches --text-muted
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        border: { display: false },
        ticks: {
          font: {
            family: "'Inter', system-ui, sans-serif",
            color: '#64748b'
          }
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <Bar data={data} options={options} />
    </div>
  );
};

export default EarningsChart;
