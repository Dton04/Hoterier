import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function PointsPage() {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.token) {
      navigate("/login");
      return;
    }
    setUser(userInfo);
    fetchPoints(userInfo);
    fetchBookings(userInfo);
  }, [navigate]);

  const fetchPoints = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const res = await axios.get("/api/users/points", config);
      setPoints(res.data.points);
      setTransactions(res.data.recentTransactions);
    } catch (err) {
      setError("Không thể tải thông tin điểm thưởng");
    }
  };

  const fetchBookings = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const res = await axios.get(`/api/bookings/history/${userInfo._id}`, config);
      const eligible = res.data.filter(
        (b) => b.paymentStatus === "pending" && b.status !== "canceled"
      );
      setBookings(eligible);
    } catch {
      setError("Không thể tải danh sách đặt phòng");
    }
  };

  const handleCheckout = useCallback(async () => {
    if (!selectedBooking) return setError("Vui lòng chọn đặt phòng để thanh toán");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const check = await axios.get(`/api/bookings/${selectedBooking}`, config);
      if (check.data.status !== "confirmed" || check.data.paymentStatus !== "paid") {
        setError("Đặt phòng chưa đủ điều kiện để tích điểm");
        setLoading(false);
        return;
      }

      const res = await axios.post(
        "/api/bookings/checkout",
        { bookingId: selectedBooking },
        config
      );

      setSuccess(`Thanh toán thành công! +${res.data.points} điểm`);
      setPoints(res.data.totalPoints);
      setTransactions([res.data.transaction, ...transactions]);
      setBookings(bookings.filter((b) => b._id !== selectedBooking));
      setSelectedBooking("");

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thanh toán");
    } finally {
      setLoading(false);
    }
  }, [selectedBooking, user, bookings, transactions]);

  const getPaymentDisplay = (method) => {
    switch (method) {
      case "cash": return "Tiền mặt";
      case "credit_card": return "Thẻ tín dụng";
      case "bank_transfer": return "Chuyển khoản";
      case "mobile_payment": return "Ví MoMo";
      default: return "Khác";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003580] to-[#0056a3] text-white rounded-2xl p-8 mb-8 shadow-md text-center">
        <h2 className="text-3xl font-bold mb-2">Điểm thưởng của bạn</h2>
        {user && (
          <p className="text-lg text-blue-100">
            Xin chào, <span className="font-semibold">{user.name}</span> —
            bạn hiện có{" "}
            <span className="font-extrabold text-yellow-300">{points.toLocaleString()}</span>{" "}
            điểm.
          </p>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded-md mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Checkout Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-10">
        <h3 className="text-xl font-semibold text-[#003580] mb-4">
          Thanh toán & tích điểm
        </h3>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn đặt phòng:
            </label>
            <select
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
              disabled={loading}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#0071c2] focus:border-[#0071c2] p-2"
            >
              <option value="">-- Chọn đặt phòng --</option>
              {bookings.map((b) => (
                <option key={b._id} value={b._id}>
                  #{b._id.slice(-6)} | {new Date(b.checkin).toLocaleDateString("vi-VN")} →{" "}
                  {new Date(b.checkout).toLocaleDateString("vi-VN")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán:
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={loading}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#0071c2] focus:border-[#0071c2] p-2"
            >
              <option value="cash">Tiền mặt</option>
              <option value="credit_card">Thẻ tín dụng</option>
              <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              <option value="mobile_payment">Ví MoMo</option>
            </select>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleCheckout}
            disabled={loading || !selectedBooking}
            className={`px-6 py-2.5 font-semibold rounded-lg text-white transition ${
              loading || !selectedBooking
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#0071c2] hover:bg-blue-800"
            }`}
          >
            {loading ? "Đang xử lý..." : "Thanh toán & tích điểm"}
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-[#003580] mb-4">
          Lịch sử giao dịch
        </h3>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-[#003580] text-white">
                <tr>
                  <th className="py-2 px-3 text-left">Ngày</th>
                  <th className="py-2 px-3 text-left">Đặt phòng</th>
                  <th className="py-2 px-3 text-left">Số tiền</th>
                  <th className="py-2 px-3 text-left">Điểm nhận</th>
                  <th className="py-2 px-3 text-left">Phương thức</th>
                  <th className="py-2 px-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(t.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {t.bookingId
                        ? `Check-in: ${new Date(
                            t.bookingId.checkin
                          ).toLocaleDateString("vi-VN")} - Check-out: ${new Date(
                            t.bookingId.checkout
                          ).toLocaleDateString("vi-VN")}`
                        : "N/A"}
                    </td>
                    <td className="py-2 px-3 text-gray-700 font-medium">
                      {t.amount ? t.amount.toLocaleString("vi-VN") + "₫" : "N/A"}
                    </td>
                    <td className="py-2 px-3 text-green-600 font-semibold">{t.points}</td>
                    <td className="py-2 px-3 text-gray-600">
                      {getPaymentDisplay(t.paymentMethod)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {t.status === "completed" ? "Hoàn tất" : "Đang xử lý"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Bạn chưa có giao dịch nào.</p>
        )}
      </div>
    </div>
  );
}

export default PointsPage;
