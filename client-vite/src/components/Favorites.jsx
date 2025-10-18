import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { Spinner } from "react-bootstrap";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.token) {
          setError("Vui lòng đăng nhập để xem danh sách yêu thích");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get("/api/favorites", config);
        setFavorites(data);
      } catch (err) {
        setError("Lỗi khi tải danh sách yêu thích");
        toast.error("Không thể tải danh sách yêu thích");
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-3 mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#003580]">
            Cho chuyến đi sắp tới của tôi
          </h1>

          

          <button
            onClick={() => toast.info("Tính năng bản đồ sắp ra mắt")}
            className="bg-[#0071c2] hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium shadow-sm transition"
          >
            Hiển thị trên bản đồ
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#003580]">
            Lưu trú
          </h1>

        {/* SUBHEADER */}
        <p className="text-gray-600 mb-6">
          {favorites.length > 0
            ? `${favorites.length} chỗ nghỉ đã lưu`
            : "Bạn chưa lưu chỗ nghỉ nào."}
        </p>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-gray-500">Đang tải danh sách yêu thích...</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
            {error}
          </div>
        )}

        {/* LIST */}
        {!loading && !error && favorites.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const hotel = fav;
              return (
                <div
                  key={hotel._id}
                  onClick={() => navigate(`/hotel/${hotel._id}`)}
                  className="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer group"
                >
                  {/* IMAGE */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={
                        hotel.imageurls?.[0] || "/images/default-hotel.jpg"
                      }
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow">
                      <FaHeart className="text-red-500 text-lg" />
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-[#003580] truncate">
                      {hotel.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {hotel.address || "Địa chỉ đang cập nhật"}
                    </p>

                    {/* STARS */}
                    {hotel.starRating && (
                      <div className="flex mt-1 text-yellow-400">
                        {[...Array(hotel.starRating)].map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    )}

                    {/* PRICE */}
                    {hotel.rooms?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Giá từ</p>
                        <p className="text-lg font-semibold text-[#0071c2]">
                          {Math.min(...hotel.rooms.map((r) => r.rentperday)).toLocaleString()} ₫ / đêm
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && favorites.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-3">
              Bạn chưa có chỗ nghỉ nào trong danh sách yêu thích.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#0071c2] hover:bg-blue-700 text-white px-6 py-2 rounded-md transition"
            >
              Khám phá ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
