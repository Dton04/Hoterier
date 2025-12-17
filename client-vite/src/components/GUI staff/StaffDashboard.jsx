import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiBox, FiDollarSign } from "react-icons/fi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatCard = ({ icon, title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center gap-5">
    <div className="bg-slate-100 p-4 rounded-full">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const StaffDashboard = () => {
  const [overview, setOverview] = useState({ totalBookings: 0, totalRevenue: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hotel-based revenue filters
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [groupBy, setGroupBy] = useState("month");
  const [dateStart, setDateStart] = useState(new Date().toISOString().slice(0, 10));
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearsOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const [hotelRevenueTotal, setHotelRevenueTotal] = useState(null);
  const [hotelRevenueChart, setHotelRevenueChart] = useState({ labels: [], values: [] });

  const groupLabelText =
    groupBy === 'day'
      ? (dateStart === dateEnd ? `ngày ${dateStart}` : `từ ${dateStart} đến ${dateEnd}`)
      : groupBy === 'month'
      ? `tháng ${selectedMonth}/${selectedYear}`
      : `năm ${selectedYear}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const raw = JSON.parse(localStorage.getItem("userInfo"));
        const user = raw?.user || raw;
        const ownerEmail = String(user?.email || "").toLowerCase();
        const token = user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [overviewRes, monthlyRes] = await Promise.all([
          axios.get("/api/dashboard/overview", { ...config, params: { ownerEmail } }),
          axios.get("/api/dashboard/monthly", { ...config, params: { ownerEmail } }),
        ]);

        setOverview({
          totalBookings: overviewRes.data.totalBookings || 0,
          totalRevenue: overviewRes.data.totalRevenue || 0,
        });
        setMonthlyRevenue(monthlyRes.data.revenue || {});

        // Fetch all hotels then filter by ownerEmail
        const hotelsRes = await axios.get("/api/hotels", config);
        const ownHotels = (hotelsRes.data || []).filter(h => String(h.email || "").toLowerCase() === ownerEmail);
        setHotels(ownHotels.map(h => ({ id: h._id, name: h.name })));
        setSelectedHotelId(ownHotels.length ? ownHotels[0]._id : "");
      } catch (err) {
        console.error("StaffDashboard API Error:", err);
        setError("Không thể tải dữ liệu Staff Dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch revenue by staff-owned hotels with filters
  useEffect(() => {
    const fetchHotelRevenue = async () => {
      try {
        const raw = JSON.parse(localStorage.getItem("userInfo"));
        const user = raw?.user || raw;
        const ownerEmail = String(user?.email || "").toLowerCase();
        const token = user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        let startDate, endDate;
        if (groupBy === 'day') {
          startDate = dateStart; endDate = dateEnd;
        } else if (groupBy === 'month') {
          startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10);
          endDate = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10);
        } else {
          startDate = new Date(selectedYear, 0, 1).toISOString().slice(0, 10);
          endDate = new Date(selectedYear, 11, 31).toISOString().slice(0, 10);
        }

        const params = { ownerEmail, startDate, endDate, groupBy };
        if (selectedHotelId) params.hotelId = selectedHotelId;

        const { data } = await axios.get('/api/stats/revenue/by-owner-hotels', { ...config, params });

        let total = 0;
        if (data.revenueByHotel) {
          Object.values(data.revenueByHotel).forEach(hotelMap => {
            Object.values(hotelMap).forEach(v => { total += v; });
          });
        } else if (data.totalRevenue) {
          total = data.totalRevenue;
        }
        setHotelRevenueTotal(total);

        // Chuẩn hóa dữ liệu biểu đồ cho khách sạn được chọn
        const selectedHotelName = hotels.find(h => h.id === selectedHotelId)?.name;
        const hotelMap = selectedHotelName ? data.revenueByHotel?.[selectedHotelName] : null;
        if (hotelMap && groupBy === 'month') {
          const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const values = Array(12).fill(0);
          Object.entries(hotelMap).forEach(([key, amount]) => {
            const [y, m] = key.split('-');
            if (parseInt(y, 10) === selectedYear) {
              const mi = parseInt(m, 10) - 1;
              if (mi >= 0 && mi < 12) values[mi] = amount;
            }
          });
          setHotelRevenueChart({ labels, values });
        } else if (hotelMap && groupBy === 'day') {
          const entries = Object.entries(hotelMap).sort((a,b)=> a[0].localeCompare(b[0]));
          const labels = entries.map(([d]) => {
            const [y,m,day] = d.split('-');
            return `${day}/${m}`;
          });
          const values = entries.map(([_,v]) => v);
          setHotelRevenueChart({ labels, values });
        } else if (hotelMap && groupBy === 'year') {
          const entries = Object.entries(hotelMap).filter(([k])=> /^\d{4}$/.test(k)).sort((a,b)=> parseInt(a[0],10)-parseInt(b[0],10));
          const labels = entries.map(([y])=> y);
          const values = entries.map(([_,v])=> v);
          setHotelRevenueChart({ labels, values });
        } else {
          setHotelRevenueChart({ labels: [], values: [] });
        }
      } catch (e) {
        console.error('Failed to fetch hotel revenue', e);
        setHotelRevenueTotal(null);
        setHotelRevenueChart({ labels: [], values: [] });
      }
    };
    fetchHotelRevenue();
  }, [selectedHotelId, groupBy, dateStart, dateEnd, selectedMonth, selectedYear]);

  const twelveMonthsData = Array(12).fill(0);
  Object.entries(monthlyRevenue || {}).forEach(([ym, amount]) => {
    const parts = ym.split("-");
    if (parts.length === 2) {
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) twelveMonthsData[m - 1] = amount;
    }
  });

  const barChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      label: "Doanh thu",
      data: twelveMonthsData,
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
      borderWidth: 1,
      borderRadius: 6,
      barThickness: 15,
    }],
  };

  const barChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { grid: { display: false } }, x: { grid: { display: false } } },
  };

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

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-6">
        <div className="md:col-span-1 lg:col-span-3">
          <StatCard
            icon={<FiBox size={24} className="text-blue-500" />}
            title="Bookings"
            value={(overview.totalBookings || 0).toLocaleString()} />
        </div>
        <div className="md:col-span-1 lg:col-span-3">
          <StatCard
            icon={<FiDollarSign size={24} className="text-green-500" />}
            title="Revenue"
            value={`${((overview.totalRevenue || 0) / 1000000).toFixed(2)}tr`} />
        </div>

        <div className="lg:col-span-6">
          <div className="bg-white p-6 rounded-lg shadow-md h-full min-h-[420px]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu theo từng tháng (khách sạn của tôi)</h3>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow-md h-full min-h-[420px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu theo Khách sạn</h3>
            <div className="flex gap-2 mb-4">
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm"
              >
                {hotels.length ? hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                )) : <option value="">Không có khách sạn</option>}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setGroupBy('day')} className={`px-3 py-1 rounded-md text-sm ${groupBy === 'day' ? 'bg-blue-50 text-blue-600 border border-blue-300' : 'bg-gray-50 text-gray-700'}`}>Ngày</button>
                <button onClick={() => setGroupBy('month')} className={`px-3 py-1 rounded-md text-sm ${groupBy === 'month' ? 'bg-blue-50 text-blue-600 border border-blue-300' : 'bg-gray-50 text-gray-700'}`}>Tháng</button>
                <button onClick={() => setGroupBy('year')} className={`px-3 py-1 rounded-md text-sm ${groupBy === 'year' ? 'bg-blue-50 text-blue-600 border border-blue-300' : 'bg-gray-50 text-gray-700'}`}>Năm</button>
              </div>
            </div>

            {groupBy === 'day' && (
              <div className="flex gap-2 mb-4">
                <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm" />
                <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm" />
              </div>
            )}

            {groupBy === 'month' && (
              <div className="flex gap-2 mb-4">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>Tháng {m}</option>))}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm">
                  {yearsOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
            )}

            {groupBy === 'year' && (
              <div className="flex gap-2 mb-4">
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full p-2 border rounded-md bg-gray-50 text-sm">
                  {yearsOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
            )}

            <div className="relative flex flex-col items-center justify-center h-36 flex-1">
              <p className="text-xs text-gray-500 mb-1">
                Doanh thu {groupLabelText}
                {(() => { const h = hotels.find(x=> x.id === selectedHotelId)?.name; return h ? ` tại ${h}` : ''; })()}
              </p>
              <p className="text-4xl font-bold text-gray-800">{hotelRevenueTotal !== null ? `${(hotelRevenueTotal / 1000000).toFixed(2)}tr` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
