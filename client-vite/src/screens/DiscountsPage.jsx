import React, { useEffect, useState } from "react";
import axios from "axios";
import Banner from "../components/Banner";
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

  const filteredDiscounts = discounts.filter((d) => {
    if (filter === "voucher") return d.type === "voucher";
    if (filter === "festival") return d.type === "festival";
    if (filter === "limited") return d.type !== "voucher" && d.type !== "festival";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Banner />

      {/* Bộ lọc */}
      <div className="flex flex-wrap justify-center gap-3 py-6">
        {[
          { key: "all", label: "Tất cả" },
          { key: "voucher", label: "Phiếu giảm giá" },
          { key: "limited", label: "Khuyến mãi có thời hạn" },
          { key: "festival", label: "Ưu đãi lễ hội" },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-5 py-2 rounded-full border transition font-medium ${
              filter === btn.key
                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Danh sách */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
      ) : (
        <div className="grid gap-6 px-6 pb-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDiscounts.length === 0 ? (
            <p className="text-center text-gray-500 col-span-full">
              Không có ưu đãi nào phù hợp
            </p>
          ) : (
            filteredDiscounts.map((d) => (
              <div
                key={d._id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-lg transition ${
                  d.type === "festival" ? "border-pink-400" : "border-gray-200"
                }`}
              >
                <div className="relative">
                  <img
                    src={d.image || "/default-discount.jpg"}
                    alt={d.name}
                    className="h-48 w-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow">
                    {d.discountType === "percentage"
                      ? `-${d.discountValue}%`
                      : `-${d.discountValue.toLocaleString()}₫`}
                  </span>
                </div>

                <div className="p-5">
                  <h5 className="text-lg font-semibold mb-1">{d.name}</h5>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{d.description}</p>

                  {d.type === "voucher" ? (
                    <button
                      disabled={collected.includes(d.code)}
                      onClick={() => handleCollect(d._id)}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                        collected.includes(d.code)
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {collected.includes(d.code)
                        ? "Đã thu thập"
                        : "Nhận phiếu giảm giá"}
                    </button>
                  ) : d.type === "festival" ? (
                    <button
                      onClick={() => handleFestivalClick(d)}
                      className="w-full py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition"
                    >
                      Xem khách sạn ưu đãi
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DiscountsPage;
