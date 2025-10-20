import React, { useEffect, useState } from "react";
import axios from "axios";
import Banner from "../components/Banner";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";

function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collected, setCollected] = useState([]);
  const [filter, setFilter] = useState("all"); // all | voucher | limited | festival
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/discounts");
        setDiscounts(data);

        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo) {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          const res = await axios.get("/api/discounts/my-vouchers", config);
          setCollected(res.data.map((v) => v.voucherCode));
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFestivalClick = (festival) => {
    navigate(`/festival/${festival._id}`, { state: { festival } });
  };

  const handleCollect = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo) {
        alert("Vui lòng đăng nhập để thu thập mã");
        return;
      }
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const res = await axios.post(`/api/discounts/collect/${id}`, {}, config);
      setCollected([...collected, res.data.voucher.voucherCode]);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi thu thập mã");
    }
  };

  // Lọc dữ liệu theo filter
  const filteredDiscounts = discounts.filter((d) => {
    if (filter === "voucher") return d.type === "voucher";
    if (filter === "festival") return d.type === "festival";
    if (filter === "limited") return d.type !== "voucher" && d.type !== "festival";
    return true;
  });

  return (
    <>
    {loading && <Loader message="Đang tải dữ liệu.."/>}
      <div className="relative w-full -mt-[260px]">
        {/* Banner */}
        <Banner />

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col  items-center justify-center text-center text-white bg-black/30 mt-[200px]">
          <h2 className="text-4xl font-bold text-rose-600 drop-shadow-lg">Ưu đãi đặc biệt hôm nay</h2>
          <p className="mt-4 text-lg font-medium drop-shadow-md max-w-2xl text-yellow-100">
            Nhận ngay phiếu giảm giá và khám phá hàng ngàn khuyến mãi hấp dẫn từ Hotelier.
          </p>
        </div>
      </div>




      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar lọc */}
        <aside className="bg-white rounded-xl shadow-md p-6 h-fit sticky top-24">
          <h3 className="text-xl font-semibold text-[#003580] mb-4">
            Bộ lọc ưu đãi
          </h3>

          <div className="space-y-5 text-[15px]">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Loại ưu đãi</h4>
              <ul className="space-y-2">
                <li>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filter"
                      checked={filter === "all"}
                      onChange={() => setFilter("all")}
                      className="accent-blue-600"
                    />
                    <span>Tất cả</span>
                  </label>
                </li>
                <li>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filter"
                      checked={filter === "voucher"}
                      onChange={() => setFilter("voucher")}
                      className="accent-blue-600"
                    />
                    <span>Phiếu giảm giá</span>
                  </label>
                </li>
                <li>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filter"
                      checked={filter === "limited"}
                      onChange={() => setFilter("limited")}
                      className="accent-blue-600"
                    />
                    <span>Khuyến mãi có thời hạn</span>
                  </label>
                </li>
                <li>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filter"
                      checked={filter === "festival"}
                      onChange={() => setFilter("festival")}
                      className="accent-blue-600"
                    />
                    <span>Ưu đãi lễ hội</span>
                  </label>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Tình trạng</h4>
              <ul className="space-y-2">
                <li>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" />
                    <span>Còn hiệu lực</span>
                  </label>
                </li>
                <li>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" />
                    <span>Sắp hết hạn</span>
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Nội dung ưu đãi */}
        <main className="lg:col-span-3">
          {loading ? (
            <p className="text-center text-gray-500 py-10">
              Đang tải dữ liệu...
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDiscounts.length === 0 ? (
                <p className="text-center text-gray-500 col-span-full">
                  Không có ưu đãi nào phù hợp
                </p>
              ) : (
                filteredDiscounts.map((d) => (
                  <div
                    key={d._id}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-lg transition-all ${d.type === "festival"
                        ? "border-pink-400"
                        : "border-gray-200"
                      }`}
                  >
                    <div className="relative">
                      <img
                        src={d.image || "/default-discount.jpg"}
                        alt={d.name}
                        className="h-44 w-full object-cover"
                      />
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                        {d.discountType === "percentage"
                          ? `-${d.discountValue}%`
                          : `-${d.discountValue.toLocaleString()}₫`}
                      </span>
                    </div>

                    <div className="p-4">
                      <h5 className="text-base font-semibold mb-1 line-clamp-1">
                        {d.name}
                      </h5>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {d.description}
                      </p>

                      {d.type === "voucher" ? (
                        <button
                          disabled={collected.includes(d.code)}
                          onClick={() => handleCollect(d._id)}
                          className={`w-full py-2 rounded-md text-sm font-semibold transition ${collected.includes(d.code)
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-[#003580] hover:bg-blue-800 text-white"
                            }`}
                        >
                          {collected.includes(d.code)
                            ? "Đã thu thập"
                            : "Nhận phiếu giảm giá"}
                        </button>
                      ) : d.type === "festival" ? (
                        <button
                          onClick={() => handleFestivalClick(d)}
                          className="w-full py-2 rounded-md bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition"
                        >
                          Xem khách sạn ưu đãi
                        </button>
                      ) : (
                        <button
                          className="w-full py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
                        >
                          Kích hoạt ngay
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default DiscountsPage;
