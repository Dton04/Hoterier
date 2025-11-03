import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function PopularDestinations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("city"); // 'city' | 'stay' | 'area'
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  /** 🧭 Gọi API lấy danh sách khu vực từ BE */
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data } = await axios.get("/api/regions");
        setRegions(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách khu vực:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500 text-sm">
        Đang tải danh sách khu vực...
      </div>
    );
  }

  return (
    <section className="py-16 bg-white border-t">
      <div className="max-w-6xl mx-auto px-4">
        {/* Tiêu đề */}
        <h2 className="text-2xl md:text-3xl font-bold text-[#003580] mb-6">
          Phổ biến với du khách từ Việt Nam
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-4 mb-8 border-b border-gray-200">
          {[
            { id: "city", label: "Thành phố trong nước" },
            { id: "stay", label: "Chỗ nghỉ" },
            { id: "area", label: "Khu vực" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-4 text-[15px] font-semibold transition ${
                activeTab === tab.id
                  ? "text-[#003580] border-b-2 border-[#003580]"
                  : "text-gray-500 hover:text-[#003580]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- Thành phố trong nước --- */}
        {activeTab === "city" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-2 text-[13px] text-gray-700 mb-8 animate-fadeIn">
            {regions
              ?.filter((r) =>
                [
                  "Hà Nội",
                  "Hồ Chí Minh",
                  "Đà Nẵng",
                  "Khánh Hòa",
                  "Đồng Nai",
                  "Huế",
                  "Phú Quốc",
                  "Cần Thơ",
                  "Quy Nhơn",
                  "Lâm Đồng",
                  "Hạ Long",
                ].includes(r.name)
              )
              .map((region) => (
                <button
                  key={region._id}
                  onClick={() =>
                    navigate(`/hotel-results?destination=${region._id}`)
                  }
                  className="text-left text-gray-700 hover:text-[#0071c2] transition"
                >
                  Khách sạn {region.name}
                </button>
              ))}
          </div>
        )}

        {/* --- Chỗ nghỉ --- */}
        {activeTab === "stay" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-2 text-[13px] text-gray-700 mb-8 animate-fadeIn">
            {[
              "Homestay",
              "Các resort",
              "Khách sạn 5 sao",
              "Khách sạn 3 sao",
              "Khách sạn giá rẻ",
              "Khách sạn có hồ bơi",
              "Khách sạn gia đình",
              "Các biệt thự",
              "Các nhà khách",
              "Căn hộ dịch vụ",
              "Căn hộ du lịch",
              "Khách sạn sang trọng",
              "Các khách sạn thân thiện với thú cưng",
              "Các chỗ nghỉ có onsen",
              "Các hostel",
              "Các ryokan",
              "Nhà nghỉ B&B",
            ].map((type, index) => (
              <p
                key={index}
                className="text-gray-700 hover:text-[#0071c2] cursor-pointer transition"
              >
                {type}
              </p>
            ))}
          </div>
        )}

        {/* --- Khu vực --- */}
        {activeTab === "area" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-3 text-[13px] text-gray-700 mb-8 animate-fadeIn">
            {regions.map((region) => (
              <button
                key={region._id}
                onClick={() =>
                  navigate(`/hotel-results?region=${region._id}`)
                }
                className="flex items-center gap-2 text-left text-gray-700 hover:text-[#0071c2] transition"
              >
                {region.imageUrl && (
                  <img
                    src={region.imageUrl}
                    alt={region.name}
                    className="w-6 h-6 object-cover rounded"
                  />
                )}
                {region.name}
              </button>
            ))}
          </div>
        )}

        {/* Nút hiển thị thêm */}
        <div className="mt-4">
          <button
            onClick={() => navigate("/regions")}
            className="flex items-center text-[#0071c2] hover:underline text-sm font-medium"
          >
            <span className="mr-2 text-lg">＋</span> Hiển thị thêm
          </button>
        </div>
      </div>
    </section>
  );
}
