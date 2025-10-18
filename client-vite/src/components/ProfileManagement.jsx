import React, { useState, useEffect } from "react";
import axios from "axios";
import Loader from "./Loader";
import { Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/images/default-avatar.jpg";

export default function ProfileManagement() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    bookingsCount: 0,
  });
  const [newAvatar, setNewAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const API_BASE_URL = "http://localhost:5000";
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo || !userInfo.token) navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/users/${userInfo._id}/profile`,
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        setUser(data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải hồ sơ người dùng.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return setError("Chỉ chấp nhận ảnh JPG/PNG");
    }
    setNewAvatar(file);
    const reader = new FileReader();
    reader.onload = () => setUser((prev) => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("phone", user.phone);
      if (newAvatar) formData.append("avatar", newAvatar);

      const { data } = await axios.put(
        `${API_BASE_URL}/api/users/${userInfo._id}/profile`,
        formData,
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      setUser(data);
      localStorage.setItem("userInfo", JSON.stringify({ ...userInfo, ...data }));
      setSuccess("Cập nhật hồ sơ thành công!");
    } catch (err) {
      setError("Lỗi khi cập nhật hồ sơ!");
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) return setError("Mật khẩu mới không khớp!");
    setSavingPass(true);
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/users/${userInfo._id}/password`,
        { oldPassword: oldPass, newPassword: newPass },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSuccess(data.message);
      setShowPassword(false);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đổi mật khẩu!");
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex justify-center bg-gray-50 min-h-screen pt-28 pb-10">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-[#003580] mb-6 text-center">
          Hồ sơ của bạn
        </h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="flex flex-col items-center mb-8">
          <img
            src={
              user.avatar?.startsWith("data:")
                ? user.avatar
                : user.avatar
                ? `${API_BASE_URL}/${user.avatar}`
                : defaultAvatar
            }
            alt="Avatar"
            className="w-32 h-32 rounded-full border-4 border-blue-200 object-cover shadow-md"
          />
          <label
            htmlFor="avatar-upload"
            className="mt-3 text-sm font-semibold text-blue-600 cursor-pointer hover:underline"
          >
            {uploading ? <Spinner size="sm" /> : "Cập nhật ảnh"}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="font-semibold text-gray-700">Họ và tên</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700">Số điện thoại</label>
            <input
              type="text"
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="text-sm text-gray-500">
            Tổng số đặt phòng:{" "}
            <span className="font-semibold text-[#003580]">
              {user.bookingsCount}
            </span>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0071c2] text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition"
            disabled={uploading}
          >
            {uploading ? <Spinner size="sm" /> : "Cập nhật hồ sơ"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="text-blue-700 font-medium hover:underline"
          >
            {showPassword ? "Ẩn form đổi mật khẩu" : "Đổi mật khẩu"}
          </button>
        </div>

        {showPassword && (
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
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
            <Button
              type="submit"
              className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition"
              disabled={savingPass}
            >
              {savingPass ? <Spinner size="sm" /> : "Cập nhật mật khẩu"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
