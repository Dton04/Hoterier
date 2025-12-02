import React, { useState } from "react";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function SecuritySettings({ profile }) {
    const [showPass, setShowPass] = useState(false);
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [savingPass, setSavingPass] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const navigate = useNavigate();
    const API_BASE_URL = "http://localhost:5000";
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const token = userInfo?.token;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (newPass !== confirmPass) return setError("Mật khẩu mới không khớp!");

        setSavingPass(true);
        try {
            await axios.put(
                `${API_BASE_URL}/api/users/${userInfo._id || userInfo.id}/password`,
                { oldPassword: oldPass, newPassword: newPass },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess("Đổi mật khẩu thành công!");
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

    const handleDeleteAccount = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.")) return;

        setDeleting(true);
        try {
            // Assuming there is an endpoint for this, or we use a generic delete
            // Based on usersController, there isn't a self-delete endpoint exposed for users, 
            // but there is a deleteUser for admin. 
            // I might need to add a self-delete endpoint or use a soft delete if available.
            // For now, I'll simulate or use a placeholder if endpoint missing.
            // usersController has `deleteStaff` and `deleteHotel` but not `deleteSelf`.
            // I will implement a placeholder alert for now as I can't easily add a route without approval/context.
            // Wait, the user asked to "fix it to receive all my available BE".
            // I'll check if I can use `banUser` (soft delete) or if I should just show a message.
            // Actually, I'll just show a message "Liên hệ admin" for now to be safe, or try a DELETE request.
            setError("Vui lòng liên hệ quản trị viên để xóa tài khoản vĩnh viễn.");
        } catch (err) {
            setError("Lỗi khi xóa tài khoản.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cài đặt bảo mật</h2>
                <p className="text-gray-600 mt-1">
                    Thay đổi thiết lập bảo mật, cài đặt xác thực bổ sung hoặc xóa tài khoản của bạn.
                </p>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

            <div className="border rounded-lg divide-y divide-gray-200 bg-white">
                {/* Change Password */}
                <div className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div className="pr-4">
                            <p className="font-medium text-gray-900">Mật khẩu</p>
                            <p className="text-gray-600 text-sm mt-1">
                                Đổi mật khẩu định kỳ để bảo vệ tài khoản.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowPass(!showPass)}
                            className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded shrink-0"
                        >
                            {showPass ? "Hủy" : "Đổi mật khẩu"}
                        </button>
                    </div>

                    {showPass && (
                        <form onSubmit={handleChangePassword} className="mt-4 max-w-md bg-gray-50 p-4 rounded border border-gray-200">
                            <div className="space-y-3">
                                <input
                                    type="password"
                                    placeholder="Mật khẩu cũ"
                                    className="w-full border rounded px-3 py-2"
                                    value={oldPass}
                                    onChange={(e) => setOldPass(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Mật khẩu mới"
                                    className="w-full border rounded px-3 py-2"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Xác nhận mật khẩu mới"
                                    className="w-full border rounded px-3 py-2"
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
                                    disabled={savingPass}
                                >
                                    {savingPass ? <Spinner animation="border" size="sm" /> : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Passkey */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4">
                        <p className="font-medium text-gray-900">Passkey</p>
                        <p className="text-gray-600 text-sm mt-1">
                            Truy cập tài khoản dễ dàng và an toàn mà không cần nhớ mật khẩu cũ.
                        </p>
                    </div>
                    <button className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded shrink-0">
                        Thiết lập
                    </button>
                </div>

                {/* 2FA */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4">
                        <p className="font-medium text-gray-900">Xác thực 2 yếu tố</p>
                        <p className="text-gray-600 text-sm mt-1">
                            Tăng độ bảo mật cho tài khoản bằng cách thiết lập xác thực 2 yếu tố.
                        </p>
                    </div>
                    <button className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded shrink-0">
                        Thiết lập
                    </button>
                </div>

                {/* Active Sessions */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4">
                        <p className="font-medium text-gray-900">Các phiên truy cập đang có hiệu lực</p>
                        <p className="text-gray-600 text-sm mt-1">
                            Khi chọn "Đăng xuất", bạn sẽ đăng xuất khỏi tất cả các thiết bị trừ thiết bị này.
                        </p>
                    </div>
                    <button className="text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded shrink-0">
                        Đăng xuất
                    </button>
                </div>

                {/* Delete Account */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="pr-4">
                        <p className="font-medium text-gray-900">Xóa tài khoản</p>
                        <p className="text-gray-600 text-sm mt-1">
                            Xóa tài khoản HOTELIER.com vĩnh viễn
                        </p>
                    </div>
                    <button
                        onClick={handleDeleteAccount}
                        className="text-red-600 font-medium hover:bg-red-50 px-3 py-2 rounded shrink-0"
                    >
                        Xóa tài khoản
                    </button>
                </div>
            </div>
        </div>
    );
}
