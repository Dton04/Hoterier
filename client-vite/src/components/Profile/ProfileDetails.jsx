import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaUsers, FaCog, FaCreditCard, FaShieldAlt } from "react-icons/fa";

export default function ProfileDetails() {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000";
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const token = userInfo?.token;

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE_URL}/api/users/${userInfo._id || userInfo.id}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile(res.data);
      } catch (err) {
        setError("Không thể tải thông tin cá nhân.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/users/${userInfo._id || userInfo.id}/profile`,
        profile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditing(false);
    } catch (err) {
      setError("Lỗi khi lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden mt-6">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b text-lg font-semibold text-[#003580]">
          Tài khoản của tôi
        </div>
        <ul className="p-4 space-y-3 text-gray-700">
          {[
            { id: "personal", label: "Thông tin cá nhân", icon: <FaUser /> },
            { id: "security", label: "Cài đặt bảo mật", icon: <FaLock /> },
            { id: "companions", label: "Người đi cùng", icon: <FaUsers /> },
            { id: "settings", label: "Cài đặt chung", icon: <FaCog /> },
            { id: "payment", label: "Phương thức thanh toán", icon: <FaCreditCard /> },
            { id: "privacy", label: "Quyền riêng tư & dữ liệu", icon: <FaShieldAlt /> },
          ].map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                activeTab === item.id
                  ? "bg-blue-100 text-[#003580] font-medium"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {activeTab === "personal" && (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#003580]">Thông tin cá nhân</h2>
                <p className="text-gray-500 text-sm">
                  Cập nhật thông tin của bạn và tìm hiểu cách thông tin này được sử dụng.
                </p>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 hover:underline"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            <div className="border rounded-lg divide-y">
              {/* Tên */}
              <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">Tên</p>
                  <p className="text-gray-600">{profile?.name || "Chưa cập nhật"}</p>
                </div>
                {editing && (
                  <input
                    name="name"
                    value={profile?.name || ""}
                    onChange={handleChange}
                    className="border rounded px-2 py-1 text-sm"
                  />
                )}
                <button className="text-blue-600 text-sm hover:underline">Chỉnh sửa</button>
              </div>

              {/* Email */}
              <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">Địa chỉ email</p>
                  <p className="text-gray-600">{profile?.email}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                  Đã xác thực
                </span>
              </div>

              {/* Số điện thoại */}
              <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">Số điện thoại</p>
                  <p className="text-gray-600">{profile?.phone || "Thêm số điện thoại"}</p>
                </div>
                <button className="text-blue-600 text-sm hover:underline">Chỉnh sửa</button>
              </div>

              {/* Ngày sinh */}
              <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">Ngày sinh</p>
                  <p className="text-gray-600">
                    {profile?.dob ? profile.dob.split("T")[0] : "Chưa cập nhật"}
                  </p>
                </div>
                <button className="text-blue-600 text-sm hover:underline">Chỉnh sửa</button>
              </div>


              {/* Giới tính */}
              <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">Giới tính</p>
                  <p className="text-gray-600">
                    {profile?.gender === "male"
                      ? "Nam"
                      : profile?.gender === "female"
                      ? "Nữ"
                      : "Khác"}
                  </p>
                </div>
                <button className="text-blue-600 text-sm hover:underline">Chỉnh sửa</button>
              </div>
            </div>

            {editing && (
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
