import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function HistoryBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("current"); // current | past | canceled

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const userEmail = userInfo?.email;

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userEmail) {
        setError("Bạn cần đăng nhập để xem lịch sử đặt phòng.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`/api/bookings?email=${userEmail}`);
        const userBookings = data.filter((b) => b.email === userEmail);
        setBookings(userBookings);
      } catch (err) {
        setError("Lỗi khi tải lịch sử đặt phòng.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [userEmail]);

  // Lọc danh sách theo tab
  useEffect(() => {
    const today = new Date();
    let filtered = [];
    if (activeTab === "current") {
      filtered = bookings.filter(
        (b) =>
          b.status !== "canceled" &&
          new Date(b.checkout) >= today
      );
    } else if (activeTab === "past") {
      filtered = bookings.filter(
        (b) => new Date(b.checkout) < today && b.status !== "canceled"
      );
    } else if (activeTab === "canceled") {
      filtered = bookings.filter((b) => b.status === "canceled");
    }
    setFilteredBookings(filtered);
  }, [activeTab, bookings]);

  if (!userEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <h1 className="text-3xl font-bold text-[#003580] mb-4">
          Lịch sử đặt phòng
        </h1>
        <p className="text-gray-600 mb-4">
          Bạn cần{" "}
          <Link to="/login" className="text-blue-600 underline">
            đăng nhập
          </Link>{" "}
          để xem thông tin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-lg text-gray-600">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-red-600 text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="pt-10 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        {/* Tiêu đề */}
        <h1 className="text-3xl md:text-3xl font-bold text-[#003580] mb-10">
          Đặt chỗ & Chuyến đi
        </h1>
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-8">
          <img
            src="https://t-cf.bstatic.com/design-assets/assets/v3.160.0/illustrations-traveller/TripsGlobe@2x.png"
            alt="Travel illustration"
            className="w-48 md:w-50"
          />

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Đi đâu tiếp đây?
            </h2>
            <p className="text-gray-600 max-w-md">
              Bạn chưa có chuyến đi nào cả. Sau khi bạn đặt chỗ, đơn đó sẽ xuất hiện tại đây.
            </p>
          </div>
        </div>

        {/* 🔹 Tabs điều hướng */}
        <div className="relative border-b border-gray-200 mb-8">
          <div className="flex space-x-8 text-lg font-medium text-gray-600">
            {[
              { id: "current", label: "Đặt chỗ hiện tại" },
              { id: "past", label: "Đã qua" },
              { id: "canceled", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 relative transition-all duration-300 ${activeTab === tab.id
                    ? "text-[#003580] font-semibold"
                    : "hover:text-[#003580]"
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute left-0 bottom-0 h-[3px] w-full bg-[#003580] rounded-full transition-all duration-300"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 🔹 Danh sách đặt phòng */}
        {filteredBookings.length === 0 ? (
          <div className="text-center">
            <img
              src="https://t-cf.bstatic.com/design-assets/assets/v3.160.0/illustrations-traveller/TripsEmptyScreenComplete@2x.png"
              alt="Travel illustration"
              className="mx-auto w-40 mb-6"
            />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {activeTab === "current"
                ? "Không có đặt chỗ hiện tại."
                : activeTab === "past"
                  ? "Bạn chưa có chuyến đi nào trước đây."
                  : "Không có đặt phòng bị hủy."}
            </h2>
            <p className="text-gray-500 mb-6">
              {activeTab === "current"
                ? "Các đặt phòng của bạn sẽ hiển thị tại đây khi có."
                : "Hãy bắt đầu khám phá để có thêm hành trình mới!"}
            </p>
            <Link
              to="/"
              className="border border-blue-600 text-blue-600 px-5 py-2 rounded-full hover:bg-blue-600 hover:text-white transition"
            >
              Khám phá khách sạn
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-[#003580]">
                      {booking.hotelId?.name ||
                        booking.roomid?.hotelId?.name ||
                        "Không xác định"}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {booking.roomid?.name || "Tên phòng không có"}
                    </p>
                  </div>

                  <div className="mt-3 md:mt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {booking.status === "confirmed"
                        ? "Đã xác nhận"
                        : booking.status === "pending"
                          ? "Chờ xác nhận"
                          : "Đã hủy"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Ngày nhận phòng:</span>{" "}
                    {new Date(booking.checkin).toLocaleDateString("vi-VN")}
                  </p>
                  <p>
                    <span className="font-semibold">Ngày trả phòng:</span>{" "}
                    {new Date(booking.checkout).toLocaleDateString("vi-VN")}
                  </p>
                  <p>
                    <span className="font-semibold">Số người lớn:</span>{" "}
                    {booking.adults}
                  </p>
                  <p>
                    <span className="font-semibold">Trẻ em:</span>{" "}
                    {booking.children}
                  </p>
                  <p>
                    <span className="font-semibold">Loại phòng:</span>{" "}
                    {booking.roomType || "Không xác định"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
