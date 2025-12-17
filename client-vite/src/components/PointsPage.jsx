import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaGem, FaGift, FaHistory, FaCheckCircle, FaLock } from "react-icons/fa";

export default function PointsPage() {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.token) {
      navigate("/login");
      return;
    }
    setUser(userInfo);
    fetchPoints(userInfo);
  }, [navigate]);

  const fetchPoints = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const res = await axios.get("/api/users/points", config);
      setPoints(res.data.points);
      setTransactions(res.data.recentTransactions);
    } catch (err) {
      console.error("Không thể tải thông tin điểm thưởng", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Level based on backend logic
  const getLevelInfo = (points) => {
    if (points >= 400000) return { level: 5, name: "Diamond", nextLevel: null, color: "text-purple-600", bg: "bg-purple-100" };
    if (points >= 300000) return { level: 4, name: "Platinum", nextLevel: 400000, color: "text-indigo-600", bg: "bg-indigo-100" };
    if (points >= 200000) return { level: 3, name: "Gold", nextLevel: 300000, color: "text-yellow-600", bg: "bg-yellow-100" };
    if (points >= 100000) return { level: 2, name: "Silver", nextLevel: 200000, color: "text-gray-600", bg: "bg-gray-100" };
    return { level: 1, name: "Bronze", nextLevel: 100000, color: "text-orange-700", bg: "bg-orange-100" };
  };

  const levelInfo = getLevelInfo(points);
  const progress = levelInfo.nextLevel
    ? ((points - (levelInfo.nextLevel - 100000)) / 100000) * 100 // Approximate progress within tier
    : 100;

  // Simplified progress calculation for display
  const displayProgress = levelInfo.nextLevel
    ? (points / levelInfo.nextLevel) * 100
    : 100;

  const benefits = [
    { level: 1, text: "Tích điểm cho mọi đặt phòng", icon: <FaGift /> },
    { level: 2, text: "Giảm giá 10% tại các chỗ nghỉ tham gia", icon: <FaGift /> },
    { level: 3, text: "Giảm giá 15% + Bữa sáng miễn phí", icon: <FaGift /> },
    { level: 4, text: "Giảm giá 20% + Nâng hạng phòng", icon: <FaGift /> },
    { level: 5, text: "Hỗ trợ ưu tiên VIP 24/7 + Quà tặng đặc biệt", icon: <FaGift /> },
  ];

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-[#003580] p-8 text-white flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FaGem className="text-yellow-400" /> {levelInfo.name}
              </h1>
              <p className="mt-2 text-blue-100">
                Bạn đang sở hữu <span className="font-bold text-white text-xl">{points.toLocaleString()}</span> điểm thưởng.
              </p>
            </div>
            <div className="mt-6 md:mt-0 bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
              <p className="text-sm font-medium mb-2">Tiến trình thăng hạng</p>
              <div className="w-64 h-3 bg-blue-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {levelInfo.nextLevel ? (
                <p className="text-xs mt-2 text-right">
                  Cần thêm {(levelInfo.nextLevel - points).toLocaleString()} điểm để lên cấp {["Bronze", "Silver", "Gold", "Platinum", "Diamond"][levelInfo.level]}
                </p>
              ) : (
                <p className="text-xs mt-2 text-right text-yellow-300 font-bold">Bạn đã đạt cấp độ cao nhất!</p>
              )}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quyền lợi của bạn</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const isUnlocked = levelInfo.level >= benefit.level;
                const rankName = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"][benefit.level - 1];
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${isUnlocked
                      ? "bg-blue-50 border-blue-100 text-blue-900"
                      : "bg-gray-50 border-gray-100 text-gray-400"
                      }`}
                  >
                    <div className={`text-xl ${isUnlocked ? "text-blue-600" : "text-gray-400"}`}>
                      {isUnlocked ? <FaCheckCircle /> : <FaLock />}
                    </div>
                    <div>
                      <p className="font-medium">{benefit.text}</p>
                      <span className="text-xs uppercase tracking-wider font-bold opacity-70">
                        {rankName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <FaHistory />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Lịch sử tích điểm</h3>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200">
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Hoạt động</th>
                    <th className="px-6 py-4 text-right">Giá trị đơn</th>
                    <th className="px-6 py-4 text-right">Điểm thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(t.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="ml-0">
                            <div className="text-sm font-medium text-gray-900">
                              {t.bookingId ? (
                                <>
                                  Đặt phòng <span className="font-mono text-blue-600">#{t.bookingId._id.slice(-6).toUpperCase()}</span>
                                </>
                              ) : (
                                "Giao dịch khác"
                              )}
                            </div>
                            {t.bookingId && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {new Date(t.bookingId.checkin).toLocaleDateString("vi-VN")} - {new Date(t.bookingId.checkout).toLocaleDateString("vi-VN")}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {t.amount ? t.amount.toLocaleString("vi-VN") : "0"} ₫
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          +{t.points} điểm
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <FaHistory className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Chưa có lịch sử giao dịch nào.</p>
              <p className="text-sm text-gray-400 mt-1">Các giao dịch tích điểm sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
