import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement, 
  LineElement, 
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
// Dòng "import AdminLayout" không còn cần thiết nữa.
import { FiMessageSquare, FiBox, FiDollarSign } from "react-icons/fi"; 
import { BsThreeDotsVertical } from "react-icons/bs";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

// --- CÁC COMPONENT CON (Giữ nguyên) ---
const StatCard = ({ icon, title, value, change, changeType }) => {
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-500' : 'text-red-500';
  const arrow = isIncrease ? '↑' : '↓';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center gap-5">
      <div className="bg-slate-100 p-4 rounded-full">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {change && (
                <span className={`text-sm font-semibold ${changeColor} flex items-center`}>
                    {arrow} {change}%
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, headerContent, menu = true, colSpan = 'lg:col-span-8' }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 w-full ${colSpan}`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            {headerContent ? headerContent : (
              menu && <button className="text-gray-400 hover:text-gray-600"><BsThreeDotsVertical size={20} /></button>
            )}
        </div>
        <div>{children}</div>
    </div>
);

const StatisticsChart = () => {
  // ... (code của StatisticsChart giữ nguyên)
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: [180, 190, 170, 160, 175, 165, 170, 200, 230, 210, 240, 235],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.2)");
          gradient.addColorStop(1, "rgba(79, 70, 229, 0)");
          return gradient;
        },
        yAxisID: 'y', tension: 0.4, fill: true, pointRadius: 0,
      },
      {
        label: 'Orders',
        data: [40, 30, 50, 40, 55, 40, 60, 100, 110, 120, 150, 140],
        borderColor: 'rgb(96, 165, 250)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(96, 165, 250, 0.2)");
          gradient.addColorStop(1, "rgba(96, 165, 250, 0)");
          return gradient;
        },
        yAxisID: 'y1', tension: 0.4, fill: true, pointRadius: 0,
      }
    ]
  };
  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { type: 'linear', display: true, position: 'left', grid: { drawOnChartArea: true, color: 'rgba(200, 200, 200, 0.2)' } },
      y1: { type: 'linear', display: false, position: 'right', grid: { drawOnChartArea: false } },
    },
  };
  return <Line options={options} data={data} />;
};


// --- COMPONENT DASHBOARD CHÍNH ---
const AdminDashboard = () => {
  const [overview, setOverview] = useState({ totalBookings: 0, totalRevenue: 0, totalReviews: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState({});
  const [bookingRate, setBookingRate] = useState(75.55); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // ... (logic fetch data giữ nguyên)
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [overviewRes, monthlyRes] = await Promise.all([
          axios.get("/api/dashboard/overview", config),
          axios.get("/api/dashboard/monthly", config),
        ]);
        setOverview(overviewRes.data);
        setMonthlyRevenue(monthlyRes.data.revenue);
      } catch (err) {
        console.error("API Error:", err);
        setError("Không thể tải dữ liệu Dashboard. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  
  // ... (code cấu hình barChartData, barChartOptions, doughnutData, doughnutOptions giữ nguyên)
  const barChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      label: "Doanh thu", data: Object.values(monthlyRevenue || {}), backgroundColor: "#3b82f6",
      borderColor: "#3b82f6", borderWidth: 1, borderRadius: 6, barThickness: 15,
    }],
  };
  const barChartOptions = {
    responsive: true, plugins: { legend: { display: false } },
    scales: { y: { grid: { display: false } }, x: { grid: { display: false } } },
  };
  const doughnutData = {
    labels: ['Booked', 'Available'], datasets: [{
      data: [bookingRate, 100 - bookingRate], backgroundColor: ['#3b82f6', '#e5e7eb'],
      borderColor: ['#3b82f6', '#e5e7eb'], borderWidth: 0, cutout: '80%', borderRadius: 10,
    }],
  };
  const doughnutOptions = { responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } } };

  // ✅ SỬA LỖI: Bỏ AdminLayout ra khỏi loading và error
  if (loading) { 
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    ); 
  }
  if (error) { 
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 text-center p-4 rounded-lg">{error}</div>
      </div>
    ); 
  }

  const StatisticsFilterButtons = (
    <div className="flex items-center bg-slate-100 rounded-md p-1 text-sm font-semibold">
      <button className="px-3 py-1 rounded-md">Monthly</button>
      <button className="px-3 py-1 rounded-md">Quarterly</button>
      <button className="px-3 py-1 rounded-md bg-white shadow-sm text-blue-600">Annually</button>
    </div>
  );

  // ✅ SỬA LỖI: Bỏ AdminLayout ra khỏi return chính
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-6">

        {/* Hàng 1: Thống kê */}
        <div className="md:col-span-1 lg:col-span-3"><StatCard icon={<FiBox size={24} className="text-blue-500" />} title="Bookings" value={(overview.totalBookings || 0).toLocaleString()} change={9.05} changeType="decrease" /></div>
        <div className="md:col-span-1 lg:col-span-3"><StatCard icon={<FiDollarSign size={24} className="text-green-500" />} title="Revenue" value={`${((overview.totalRevenue || 0) / 1000000).toFixed(2)}tr`} change={5.5} changeType="increase" /></div>
        <div className="md:col-span-1 lg:col-span-3"><StatCard icon={<FiMessageSquare size={24} className="text-orange-500" />} title="Total Reviews" value={(overview.totalReviews || 0).toLocaleString()} change={2.8} changeType="increase" /></div>

        {/* Hàng 2: Biểu đồ */}
        <ChartCard title="Monthly Sales" colSpan="lg:col-span-6">
          <Bar data={barChartData} options={barChartOptions} />
        </ChartCard>
        <ChartCard title="Monthly Target" colSpan="lg:col-span-3">
           <div className="relative flex flex-col items-center justify-center">
              <div className="w-48 h-48"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
              <div className="absolute flex flex-col items-center">
                  <p className="text-4xl font-bold text-gray-800">{bookingRate.toFixed(2)}%</p>
                  <p className="text-sm font-semibold text-green-500 mt-1">+10%</p>
              </div>
           </div>
           <p className="text-center text-sm text-gray-500 mt-4">Keep up your good work!</p>
           <div className="mt-6 flex justify-around border-t pt-4">
              <div className="text-center"><p className="text-xs text-gray-400">Target</p><p className="font-semibold text-gray-700">$20K</p></div>
              <div className="text-center"><p className="text-xs text-gray-400">Revenue</p><p className="font-semibold text-green-500">$20K ↑</p></div>
              <div className="text-center"><p className="text-xs text-gray-400">Today</p><p className="font-semibold text-green-500">$20K ↑</p></div>
           </div>
        </ChartCard>

        {/* Hàng 3: Biểu đồ Statistics */}
        <ChartCard 
          title="Statistics" 
          subtitle="Target you've set for each month"
          colSpan="lg:col-span-9"
          menu={false}
          headerContent={StatisticsFilterButtons}
        >
          <StatisticsChart />
        </ChartCard>
        
      </div>
    </div>
  );
};

export default AdminDashboard;