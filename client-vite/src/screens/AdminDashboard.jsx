import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import AdminLayout from "../components/admin dashboard/AdminLayout";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [overview, setOverview] = useState({
    totalBookings: 0,
    totalReviews: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalRooms: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState({});
  const [bookingRate, setBookingRate] = useState(0);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [overviewRes, monthlyRes, bookingRateRes, reviewRes] = await Promise.all([
          axios.get("/api/dashboard/overview", config),
          axios.get("/api/dashboard/monthly", config),
          axios.get("/api/stats/booking-rate?startDate=2025-01-01&endDate=2025-12-31", config),
          axios.get("/api/stats/review-stats", config),
        ]);

        setOverview(overviewRes.data);
        setMonthlyRevenue(monthlyRes.data.revenue);
        setBookingRate(bookingRateRes.data.bookingRate || 0);
        setReviewStats(reviewRes.data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu Dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Bar chart data (Doanh thu theo tháng)
  const barChartData = {
    labels: Object.keys(monthlyRevenue || {}),
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: Object.values(monthlyRevenue || {}),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `${v / 1_000_000}tr` },
      },
    },
  };

  // Doughnut chart (rating distribution)
  const doughnutData = {
    labels: ["⭐ 1", "⭐ 2", "⭐ 3", "⭐ 4", "⭐ 5"],
    datasets: [
      {
        data: Object.values(reviewStats.ratingDistribution),
        backgroundColor: ["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6"],
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bảng điều khiển</h1>
            <p className="text-gray-600 text-sm">Tổng quan dữ liệu hệ thống.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <i className="fas fa-sync-alt mr-2"></i>Làm mới
          </button>
        </div>

        {/* Loading/Error */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 text-center py-3 rounded-md">{error}</div>
        ) : (
          <>
            {/* Statistic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard icon="fa-book" color="blue" title="Đặt phòng" value={overview.totalBookings} />
              <StatCard icon="fa-users" color="green" title="Người dùng" value={overview.totalUsers} />
              <StatCard
                icon="fa-dollar-sign"
                color="yellow"
                title="Doanh thu"
                value={overview.totalRevenue.toLocaleString("vi-VN") + " VNĐ"}
              />
              <StatCard icon="fa-star" color="purple" title="Đánh giá" value={overview.totalReviews} />
              <StatCard icon="fa-hotel" color="pink" title="Phòng" value={overview.totalRooms} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Biểu đồ doanh thu */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Doanh thu theo tháng</h3>
                <Bar data={barChartData} options={barChartOptions} />
              </div>

              {/* Booking Rate */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Tỷ lệ đặt phòng</h3>
                <div className="relative w-40 h-40">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-blue-200"
                    style={{
                      background: `conic-gradient(#3b82f6 ${bookingRate}%, #e5e7eb ${bookingRate}% 100%)`,
                    }}
                  ></div>
                  <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-blue-600">{bookingRate.toFixed(1)}%</p>
                    <span className="text-gray-500 text-sm">Công suất</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Thống kê đánh giá</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                <Doughnut data={doughnutData} />
                <div className="text-center">
                  <p className="text-4xl font-bold text-yellow-500 mb-2">
                    ⭐ {reviewStats.averageRating.toFixed(2)}
                  </p>
                  <p className="text-gray-600">Điểm trung bình từ người dùng</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

// Reusable Stat Card Component
const StatCard = ({ icon, color, title, value }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
    pink: "bg-pink-100 text-pink-600",
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <i className={`fas ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
