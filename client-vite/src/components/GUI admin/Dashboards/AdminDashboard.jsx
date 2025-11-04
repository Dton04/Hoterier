import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States for location revenue chart
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [cityRevenueData, setCityRevenueData] = useState(null);
  const [cityRevenueLoading, setCityRevenueLoading] = useState(false);

  // Bộ lọc Ngày/Tháng/Năm
  const [groupBy, setGroupBy] = useState('month');
  // thêm state chọn năm cho biểu đồ Monthly Sales
  const [selectedBarYear, setSelectedBarYear] = useState(new Date().getFullYear());
  const [dateStart, setDateStart] = useState(new Date().toISOString().slice(0, 10));
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearsOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Nhãn hiển thị theo groupBy
  const groupLabelText =
    groupBy === 'day'
      ? (dateStart === dateEnd ? `ngày ${dateStart}` : `từ ${dateStart} đến ${dateEnd}`)
      : groupBy === 'month'
      ? `tháng ${selectedMonth}/${selectedYear}`
      : `năm ${selectedYear}`;
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [overviewRes, monthlyRes, regionsRes] = await Promise.all([
          axios.get("/api/dashboard/overview", config),
          axios.get("/api/dashboard/monthly", config),
          axios.get("/api/regions", config), // Fetch regions
        ]);

        setOverview(overviewRes.data);
        setMonthlyRevenue(monthlyRes.data.revenue);

        if (regionsRes.data && regionsRes.data.length > 0) {
          setRegions(regionsRes.data);
          setSelectedRegion(regionsRes.data[0].name); // Set default region
        }

      } catch (err) {
        console.error("API Error:", err);
        setError("Không thể tải dữ liệu Dashboard. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Update cities dropdown when region changes
  useEffect(() => {
    if (selectedRegion) {
      const region = regions.find(r => r.name === selectedRegion);
      setCities(region ? region.cities : []);
      setSelectedCity(''); // Reset city selection
    }
  }, [selectedRegion, regions]);
  
  // Fetch revenue by location when selection changes
  useEffect(() => {
    if (!selectedRegion) return;

    const fetchRevenueByLocation = async () => {
      setCityRevenueLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        let startDate, endDate;
        if (groupBy === 'day') {
          startDate = dateStart;
          endDate = dateEnd;
        } else if (groupBy === 'month') {
          startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10);
          endDate = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10);
        } else {
          startDate = new Date(selectedYear, 0, 1).toISOString().slice(0, 10);
          endDate = new Date(selectedYear, 11, 31).toISOString().slice(0, 10);
        }

        const params = { regionName: selectedRegion, startDate, endDate, groupBy };
        if (selectedCity) params.cityName = selectedCity;

        const { data } = await axios.get('/api/stats/revenue/by-region-city', { ...config, params });

        let totalRevenue = 0;
        if (data.revenueByCity) {
          Object.values(data.revenueByCity).forEach(cityData => {
            Object.values(cityData).forEach(revenue => { totalRevenue += revenue; });
          });
        } else if (data.totalRevenue) {
          totalRevenue = data.totalRevenue;
        }
        setCityRevenueData(totalRevenue);
      } catch (err) {
        console.error("Failed to fetch location revenue:", err);
        setCityRevenueData(null);
      } finally {
        setCityRevenueLoading(false);
      }
    };

    fetchRevenueByLocation();
  }, [selectedRegion, selectedCity, groupBy, dateStart, dateEnd, selectedMonth, selectedYear]);
  
  // Chuẩn hóa dữ liệu theo tháng (đưa đúng vào vị trí 1..12)
  useEffect(() => {
    const keys = Object.keys(monthlyRevenue || {});
    if (keys.length) {
      const years = Array.from(new Set(keys.map(k => parseInt(k.split('-')[0], 10))));
      if (!years.includes(selectedBarYear)) {
        setSelectedBarYear(Math.max(...years)); // mặc định chọn năm lớn nhất có dữ liệu
      }
    }
  }, [monthlyRevenue]);

  // cập nhật selectedBarYear khi có dữ liệu monthlyRevenue (chọn năm lớn nhất có dữ liệu)
  useEffect(() => {
    const years = Array.from(new Set(Object.keys(monthlyRevenue || {}).map(k => parseInt(k.split('-')[0], 10))));
    if (years.length && !years.includes(selectedBarYear)) {
      setSelectedBarYear(Math.max(...years));
    }
  }, [monthlyRevenue]);

  const barYears = Array
    .from(new Set(Object.keys(monthlyRevenue || {}).map(k => parseInt(k.split('-')[0], 10))))
    .sort((a, b) => b - a);

  // đưa doanh thu vào đúng tháng (index = month - 1) theo selectedBarYear
  const twelveMonthsData = Array(12).fill(0);
  Object.entries(monthlyRevenue || {}).forEach(([ym, amount]) => {
    const [y, m] = ym.split('-');
    if (parseInt(y, 10) === selectedBarYear) {
      twelveMonthsData[parseInt(m, 10) - 1] = amount;
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
    responsive: true, plugins: { legend: { display: false } },
    scales: { y: { grid: { display: false } }, x: { grid: { display: false } } },
  };

  // combobox chọn năm cho card Monthly Sales
  const monthlyYearSelector = (
    <div className="flex items-center bg-slate-100 rounded-md p-1 text-sm">
      <span className="px-2 text-gray-600">Năm</span>
      <select
        value={selectedBarYear}
        onChange={(e) => setSelectedBarYear(parseInt(e.target.value, 10))}
        className="px-2 py-1 rounded-md bg-white shadow-sm"
      >
        {barYears.length
          ? barYears.map(y => <option key={y} value={y}>{y}</option>)
          : <option value={selectedBarYear}>{selectedBarYear}</option>}
      </select>
    </div>
  );

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

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-6">

        {/* Hàng 1: Thống kê */}
        <div className="md:col-span-1 lg:col-span-3"><StatCard icon={<FiBox size={24} className="text-blue-500" />} title="Bookings" value={(overview.totalBookings || 0).toLocaleString()} change={9.05} changeType="decrease" /></div>
        <div className="md:col-span-1 lg:col-span-3"><StatCard icon={<FiDollarSign size={24} className="text-green-500" />} title="Revenue" value={`${((overview.totalRevenue || 0) / 1000000).toFixed(2)}tr`} change={5.5} changeType="increase" /></div>
        <div className="md:col-span-1 lg:col-span-3"><StatCard icon={<FiMessageSquare size={24} className="text-orange-500" />} title="Total Reviews" value={(overview.totalReviews || 0).toLocaleString()} change={2.8} changeType="increase" /></div>

        {/* Hàng 2: Biểu đồ */}
        <ChartCard title="Doanh thu theo từng tháng của Web" colSpan="lg:col-span-6" headerContent={monthlyYearSelector}>
          <Bar data={barChartData} options={barChartOptions} />
        </ChartCard>
        
        <ChartCard title="Doanh thu theo Khu vực" colSpan="lg:col-span-3" menu={false}>
          {/* Dropdown khu vực/quận */}
          <div className="flex gap-2 mb-4">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm"
            >
              <option value="" disabled>Chọn Tỉnh/Thành</option>
              {regions.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
            </select>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm"
              disabled={!selectedRegion || cities.length === 0}
            >
              <option value="">Tất cả Quận/Huyện</option>
              {cities.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Tabs Ngày/Tháng/Năm */}
          <div className="flex gap-2 mb-2">
            <button onClick={() => setGroupBy('day')} className={`px-3 py-1 rounded-md text-sm ${groupBy === 'day' ? 'bg-blue-50 text-blue-600 border border-blue-300' : 'bg-gray-50 text-gray-700'}`}>Ngày</button>
            <button onClick={() => setGroupBy('month')} className={`px-3 py-1 rounded-md text-sm ${groupBy === 'month' ? 'bg-blue-50 text-blue-600 border border-blue-300' : 'bg-gray-50 text-gray-700'}`}>Tháng</button>
            <button onClick={() => setGroupBy('year')} className={`px-3 py-1 rounded-md text-sm ${groupBy === 'year' ? 'bg-blue-50 text-blue-600 border border-blue-300' : 'bg-gray-50 text-gray-700'}`}>Năm</button>
          </div>

          {groupBy === 'day' && (
            <div className="flex gap-2 mb-4">
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm"
              />
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm"
              />
            </div>
          )}

          {groupBy === 'month' && (
            <div className="flex gap-2 mb-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-1/2 p-2 border rounded-md bg-gray-50 text-sm"
              >
                {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {groupBy === 'year' && (
            <div className="flex gap-2 mb-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-gray-50 text-sm"
              >
                {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {/* Revenue Display */}
          <div className="relative flex flex-col items-center justify-center h-36">
            {cityRevenueLoading ? (
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-1">
                  Doanh thu {groupLabelText}
                  {selectedCity ? ` tại ${selectedCity}` : (selectedRegion ? ` tại ${selectedRegion}` : '')}
                </p>
                <p className="text-4xl font-bold text-gray-800">
                  {cityRevenueData !== null ? `${(cityRevenueData / 1000000).toFixed(2)}tr` : 'N/A'}
                </p>
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">Dữ liệu doanh thu {groupLabelText}.</p>
          {/* Đã xóa block Target/Revenue/Today hard-code */}
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