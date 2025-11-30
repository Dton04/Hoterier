import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";

export default function Companions({ profile, updateProfile }) {
    const [isAdding, setIsAdding] = useState(false);
    const [companions, setCompanions] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile && profile.companions) {
            setCompanions(profile.companions);
        }
    }, [profile]);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        surname: "",
        day: "",
        month: "",
        year: "",
        gender: "",
        confirmed: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        if (!formData.confirmed) return alert("Vui lòng xác nhận điều khoản.");
        if (!formData.name || !formData.surname || !formData.day || !formData.month || !formData.year) {
            return alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
        }

        const dob = new Date(`${formData.year}-${formData.month}-${formData.day}`);
        const newCompanion = {
            name: formData.name,
            surname: formData.surname,
            dob: dob,
            gender: formData.gender
        };

        const updatedCompanions = [...companions, newCompanion];
        setSaving(true);
        const result = await updateProfile({ companions: updatedCompanions });
        setSaving(false);

        if (result.success) {
            setIsAdding(false);
            setFormData({
                name: "",
                surname: "",
                day: "",
                month: "",
                year: "",
                gender: "",
                confirmed: false
            });
        }
    };

    const handleDelete = async (index) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa người này?")) return;
        const updatedCompanions = companions.filter((_, i) => i !== index);
        setSaving(true);
        await updateProfile({ companions: updatedCompanions });
        setSaving(false);
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Người đi cùng</h2>
                    <p className="text-gray-600 mt-1">
                        Thêm hoặc chỉnh sửa thông tin của những người mà bạn đi cùng.
                    </p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded"
                    >
                        Thêm người đi cùng mới
                    </button>
                )}
            </div>

            {isAdding ? (
                <div className="bg-white border rounded-lg p-6 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Tên *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Họ *</label>
                            <input
                                type="text"
                                name="surname"
                                value={formData.surname}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Vui lòng nhập chính xác tên của người này như trên hộ chiếu hoặc giấy thông hành chính thức của họ
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-900 mb-1">Ngày sinh *</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="day"
                                placeholder="Ngày"
                                value={formData.day}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded p-2 w-20 focus:border-blue-500 focus:outline-none"
                            />
                            <select
                                name="month"
                                value={formData.month}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded p-2 flex-1 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">Tháng</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="year"
                                placeholder="Năm"
                                value={formData.year}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded p-2 w-24 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Bạn cần phải nhập ngày sinh chính xác vì thông tin này có thể được sử dụng để đặt chỗ hoặc đặt vé
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-900 mb-1">Giới tính</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Chọn giới tính</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Vui lòng chọn giới tính như trên hộ chiếu hoặc giấy tờ tùy thân chính thức khác của người này
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="confirmed"
                                checked={formData.confirmed}
                                onChange={handleInputChange}
                                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                                Tôi xác nhận rằng tôi được phép cung cấp dữ liệu cá nhân của tất cả du khách đi cùng (bao gồm trẻ em) liên quan đến dịch vụ này cho Booking.com. Ngoài ra, tôi xác nhận rằng tôi đã thông báo cho những du khách khác là tôi đang cung cấp dữ liệu cá nhân của họ cho Booking.com.
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded"
                            disabled={saving}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white font-medium px-6 py-2 rounded hover:bg-blue-700"
                            disabled={saving}
                        >
                            {saving ? <Spinner size="sm" animation="border" /> : "Lưu"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border rounded-lg p-8 text-center bg-gray-50">
                    {companions.length === 0 ? (
                        <>
                            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-2xl">
                                👥
                            </div>
                            <p className="text-gray-600">Chưa có người đi cùng nào được lưu.</p>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {companions.map((comp, idx) => (
                                <div key={idx} className="bg-white p-4 border rounded shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-left">{comp.name} {comp.surname}</p>
                                        <p className="text-sm text-gray-500 text-left">
                                            {comp.gender === 'male' ? 'Nam' : comp.gender === 'female' ? 'Nữ' : 'Khác'} • {new Date(comp.dob).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(idx)}
                                        className="text-red-600 text-sm hover:underline"
                                        disabled={saving}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
