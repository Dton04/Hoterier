import React, { useState, useEffect } from "react";
import axios from "axios";
import { Spinner, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import Banner from "../components/Banner";
import defaultAvatar from "../assets/images/default-avatar.jpg";

import {
  CreditCard, Wallet, Receipt, User, Lock, Briefcase,
  Settings, Mail, Compass, Heart, MessageSquare,
  Phone, Shield, Scale, FileText, BookOpen
} from "lucide-react";



export default function ProfileManagement() {
  const [user, setUser] = useState(null);
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000";
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    if (!userInfo || !userInfo.token) navigate("/login", { replace: true });
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${userInfo.token}` };
        const [profileRes, rewardRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/users/${userInfo._id}/profile`, { headers }),
          axios.get(`${API_BASE_URL}/api/users/${userInfo._id}/rewards-summary`, { headers }),
        ]);
        setUser(profileRes.data);
        setReward(rewardRes.data);
      } catch {
        setError("Không thể tải dữ liệu hồ sơ người dùng.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) return setError("Mật khẩu mới không khớp!");
    setSavingPass(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/users/${userInfo._id}/password`,
        { oldPassword: oldPass, newPassword: newPass },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setShowPass(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đổi mật khẩu!");
    } finally {
      setSavingPass(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen relative">

      {/* 🟦 Banner + Header User Info */}
      <div className="relative w-full h-[260px] overflow-hidden -mt-[70px]">
        <Banner />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#003580]/95 flex items-start pt-16">
          <div className="max-w-6xl w-full mx-auto flex items-center gap-4 text-white px-6 md:px-10">

            {/* Avatar */}
            <img
              src={
                user?.avatar
                  ? `${API_BASE_URL}/${user.avatar.replace(/^\/+/, "")}`
                  : defaultAvatar
              }
              alt="avatar"
              className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover"
              style={{
                boxShadow: "0 0 0 2px #febb02, 0 0 10px rgba(0,0,0,0.3)",
              }}
            />

            {/* User Info */}
            <div className="leading-tight">
              <h1 className="text-[22px] font-bold drop-shadow-md">
                Chào {user?.name || "Người dùng"}
              </h1>
              <p className="text-sm font-medium mt-0.5">
                <span className="text-[#febb02] font-semibold">
                  Genius Cấp {reward?.membershipLevel || "—"}
                </span>{" "}
                · {reward?.points?.toLocaleString()} điểm
              </p>
              {reward?.pointsToNext > 0 && (
                <p className="text-xs opacity-90 mt-0.5">
                  Còn{" "}
                  <span className="text-[#febb02] font-semibold">
                    {reward.pointsToNext.toLocaleString()}
                  </span>{" "}
                  điểm để đạt cấp {reward?.nextLevel}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* 🟨 Khu vực Genius Rewards + Tiến độ bên phải */}
      <div className="max-w-6xl mx-auto -mt-20 px-4 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: thẻ Genius */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#003580] mb-2">
            Bạn có 3 tặng thưởng Genius
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Tận hưởng tặng thưởng và giảm giá cho chỗ nghỉ và xe thuê trên toàn cầu.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: "🛏️", text: "Giảm 10% khi lưu trú" },
              { icon: "🚗", text: "Giảm 10% cho thuê xe" },
              { icon: "✈️", text: "Ưu đãi vé máy bay & combo" },
            ].map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex-1 min-w-[200px]"
              >
                <div className="text-2xl">{p.icon}</div>
                <span className="text-sm text-gray-800">{p.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-blue-700 font-medium cursor-pointer hover:underline">
            Tìm hiểu thêm về tặng thưởng
          </div>
        </div>

        {/* Cột phải: Tiến độ + Voucher */}
        <div className="space-y-4">
          <div className="bg-white  rounded-xl shadow-lg p-5 flex flex-col justify-between">
            <div>
              <p className="font-semibold">
                Bạn còn 5 đơn đặt để lên <br /> Genius Cấp 2
              </p>
            </div>
            <button className="mt-3 text-[#febb02] text-sm font-medium underline hover:text-yellow-300">
              Kiểm tra tiến độ của bạn
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <p className="font-semibold text-[#003580]">Chưa có Tín dụng hay voucher</p>
            <p className="text-sm text-blue-600 mt-1 cursor-pointer hover:underline">
              Xem chi tiết
            </p>
          </div>
        </div>
      </div>


      {/* 🔵 Các mục dạng grid */}
      <div className="max-w-6xl mx-auto mt-10 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Thông tin thanh toán",
            items: [
              { icon: <Wallet className="w-4 h-4 text-[#003580]" />, text: "Tặng thưởng & Ví" },
              { icon: <CreditCard className="w-4 h-4 text-[#003580]" />, text: "Phương thức thanh toán" },
              { icon: <Receipt className="w-4 h-4 text-[#003580]" />, text: "Giao dịch" },
            ],
          },
          {
            title: "Quản lý tài khoản",
            items: [
              { icon: <User className="w-4 h-4 text-[#003580]" />, text: "Thông tin cá nhân", link: "/profile/details" },
              { icon: <Lock className="w-4 h-4 text-[#003580]" />, text: "Cài đặt bảo mật" },
              { icon: <Briefcase className="w-4 h-4 text-[#003580]" />, text: "Người đi cùng" },
            ],
          },
          {
            title: "Cài đặt",
            items: [
              { icon: <Settings className="w-4 h-4 text-[#003580]" />, text: "Cài đặt chung" },
              { icon: <Mail className="w-4 h-4 text-[#003580]" />, text: "Cài đặt email" },
            ],
          },
          {
            title: "Hoạt động du lịch",
            items: [
              { icon: <Compass className="w-4 h-4 text-[#003580]" />, text: "Chuyến đi & đơn đặt", link: "/bookings" },
              { icon: <Heart className="w-4 h-4 text-[#003580]" />, text: "Danh sách đã lưu", link: "/favorites" },
              { icon: <MessageSquare className="w-4 h-4 text-[#003580]" />, text: "Đánh giá của tôi" },
            ],
          },
          {
            title: "Trợ giúp",
            items: [
              { icon: <Phone className="w-4 h-4 text-[#003580]" />, text: "Liên hệ dịch vụ khách hàng" },
              { icon: <Shield className="w-4 h-4 text-[#003580]" />, text: "Trung tâm bảo mật" },
              { icon: <Scale className="w-4 h-4 text-[#003580]" />, text: "Giải quyết khiếu nại" },
            ],
          },
          {
            title: "Pháp lý & Quyền riêng tư",
            items: [
              { icon: <FileText className="w-4 h-4 text-[#003580]" />, text: "Quản lý quyền riêng tư" },
              { icon: <BookOpen className="w-4 h-4 text-[#003580]" />, text: "Hướng dẫn nội dung" },
            ],
          },
        ].map((section, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#003580] mb-3">{section.title}</h3>
            <ul className="text-gray-700 text-sm space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex justify-between items-center hover:bg-gray-50 px-2 py-1 rounded-md transition">
                  {item.link ? (
                    <Link to={item.link} className="flex items-center gap-2 text-gray-800 hover:text-blue-600">
                      {item.icon}
                      <span>{item.text}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  )}
                  <span className="text-blue-600 text-lg leading-none">›</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>


      {/* 🔐 Đổi mật khẩu */}
      <div className="max-w-6xl mx-auto mt-10 px-4 pb-20 text-center">
        <button
          onClick={() => setShowPass(!showPass)}
          className="text-blue-700 font-medium hover:underline"
        >
          {showPass ? "Ẩn form đổi mật khẩu" : "Đổi mật khẩu"}
        </button>

        {showPass && (
          <form
            onSubmit={handleChangePassword}
            className="mt-6 max-w-md mx-auto bg-white shadow-md rounded-lg p-6 space-y-3 border"
          >
            <input
              type="password"
              placeholder="Mật khẩu cũ"
              className="w-full border rounded-md px-3 py-2"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              className="w-full border rounded-md px-3 py-2"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              className="w-full border rounded-md px-3 py-2"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition"
              disabled={savingPass}
            >
              {savingPass ? <Spinner size="sm" /> : "Cập nhật mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
