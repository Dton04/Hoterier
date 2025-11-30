import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaUser, FaLock, FaUsers, FaCog, FaCreditCard, FaShieldAlt } from "react-icons/fa";

// Import sub-components
import SecuritySettings from "./Tabs/SecuritySettings";
import Companions from "./Tabs/Companions";
import GeneralSettings from "./Tabs/GeneralSettings";
import PaymentMethods from "./Tabs/PaymentMethods";
import PrivacySettings from "./Tabs/PrivacySettings";

export default function ProfileDetails() {
  const [profile, setProfile] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "personal";
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const fileInputRef = React.useRef(null);

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

  const updateProfile = async (updatedData) => {
    setSaving(true);
    try {
      // Merge updatedData with existing profile to ensure we don't lose fields
      const newProfile = { ...profile, ...updatedData };

      // If sending complex objects (arrays/objects), we might need to stringify them if using FormData,
      // but here we can try sending JSON directly if the backend supports it, 
      // OR we stick to the existing pattern. 
      // The backend controller I updated handles both JSON body and FormData stringified fields.
      // Let's use JSON for simple updates and FormData only for Avatar.

      const res = await axios.put(
        `${API_BASE_URL}/api/users/${userInfo._id || userInfo.id}/profile`,
        newProfile,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(res.data);
      setEditingField(null);
      return { success: true };
    } catch (err) {
      console.error(err);
      setError("Lỗi khi cập nhật hồ sơ.");
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
      saveAvatar(file);
    }
  };

  const saveAvatar = async (file) => {
    setSaving(true);
    const formData = new FormData();
    formData.append("avatar", file);

    // Append other fields as strings if needed, but for avatar update, 
    // we usually just want to update avatar. 
    // However, the backend might expect other fields or it might be a partial update.
    // My updated controller uses findByIdAndUpdate, so partial is fine.

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/users/${userInfo._id || userInfo.id}/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      setProfile(res.data);
      setAvatarFile(null);
      const updatedUserInfo = { ...userInfo, avatar: res.data.avatar };
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
    } catch (err) {
      setError("Lỗi khi cập nhật ảnh đại diện.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    updateProfile(profile);
  };

  const handleCancel = () => {
    setEditingField(null);
    // Reload profile to reset changes? Or just keep local state?
    // Ideally revert to 'profile' before edit. 
    // Since 'profile' state is modified directly by handleChange, we might need a separate 'editState'.
    // For now, let's just close edit mode.
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  const renderField = (label, value, fieldName, type = "text", isVerified = false) => {
    const isEditing = editingField === fieldName;

    return (
      <div className="flex justify-between items-start p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          {isEditing ? (
            <div className="mt-1">
              <input
                type={type}
                name={fieldName}
                value={profile?.[fieldName] || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-full max-w-md"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-[15px] ${value ? "text-gray-900" : "text-gray-400 italic"}`}>
                {fieldName === 'gender'
                  ? (value === 'male' ? 'Nam' : value === 'female' ? 'Nữ' : value === 'other' ? 'Khác' : 'Chưa cung cấp')
                  : (value || "Chưa cung cấp")}
              </span>
              {isVerified && (
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded">
                  Xác thực
                </span>
              )}
            </div>
          )}
          {fieldName === "email" && !isEditing && (
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              Đây là địa chỉ email bạn dùng để đăng nhập. Chúng tôi cũng sẽ gửi các xác nhận đặt chỗ tới địa chỉ này.
            </p>
          )}
        </div>

        <div className="ml-4">
          {isEditing ? (
            <div className="flex gap-3 text-sm">
              <button
                onClick={handleCancel}
                className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-1 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-1 rounded"
              >
                {saving ? "Lưu..." : "Lưu"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingField(fieldName)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto mt-8 mb-12 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 pr-8 hidden md:block">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {[
              { id: "personal", label: "Thông tin cá nhân", icon: <FaUser className="text-gray-400" /> },
              { id: "security", label: "Cài đặt bảo mật", icon: <FaLock className="text-gray-400" /> },
              { id: "companions", label: "Người đi cùng", icon: <FaUsers className="text-gray-400" /> },
              { id: "settings", label: "Cài đặt chung", icon: <FaCog className="text-gray-400" /> },
              { id: "payment", label: "Phương thức thanh toán", icon: <FaCreditCard className="text-gray-400" /> },
              { id: "privacy", label: "Quyền riêng tư & dữ liệu", icon: <FaShieldAlt className="text-gray-400" /> },
            ].map((item) => (
              <li
                key={item.id}
                onClick={() => setSearchParams({ tab: item.id })}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${activeTab === item.id
                  ? "bg-blue-50 text-blue-600" // Active state
                  : "hover:bg-gray-50 text-gray-700"
                  }`}
              >
                <span className={activeTab === item.id ? "text-blue-600" : ""}>{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {activeTab === "personal" && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông tin cá nhân</h1>
                <p className="text-gray-600 text-[15px]">
                  Cập nhật thông tin của bạn và tìm hiểu các thông tin này được sử dụng ra sao.
                </p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                  <img
                    src={previewAvatar || (profile?.avatar ? `${API_BASE_URL}/${profile.avatar.replace(/^\/+/, "")}` : "https://cf.bstatic.com/static/img/theme-index/default-avatar.svg")}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow border border-gray-200 text-gray-600 hover:text-blue-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {renderField("Tên", profile?.name, "name")}
              {renderField("Tên hiển thị", profile?.displayName || "Chọn tên hiển thị", "displayName")}
              {renderField("Địa chỉ email", profile?.email, "email", "email", true)}
              {renderField("Số điện thoại", profile?.phone, "phone", "tel")}
            </div>
          </div>
        )}

        {activeTab === "security" && <SecuritySettings profile={profile} updateProfile={updateProfile} />}
        {activeTab === "companions" && <Companions profile={profile} updateProfile={updateProfile} />}
        {activeTab === "settings" && <GeneralSettings profile={profile} updateProfile={updateProfile} />}
        {activeTab === "payment" && <PaymentMethods profile={profile} updateProfile={updateProfile} />}
        {activeTab === "privacy" && <PrivacySettings profile={profile} updateProfile={updateProfile} />}
      </main>
    </div>
  );
}
