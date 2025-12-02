import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { FaCreditCard, FaTrash } from "react-icons/fa";

export default function PaymentMethods({ profile, updateProfile }) {
    const [cards, setCards] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        cardHolder: "",
        cardNumber: "",
        expiryDate: "",
        cvc: ""
    });

    useEffect(() => {
        if (profile && profile.paymentMethods) {
            setCards(profile.paymentMethods);
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.cardNumber || !formData.expiryDate || !formData.cvc) return;

        // Mask card number for security (only store last 4 digits)
        const maskedCard = `•••• •••• •••• ${formData.cardNumber.slice(-4)}`;
        const newCard = {
            cardType: "Visa", // Simplified detection
            cardNumber: maskedCard,
            cardHolder: formData.cardHolder,
            expiryDate: formData.expiryDate
        };

        const updatedCards = [...cards, newCard];
        setSaving(true);
        const result = await updateProfile({ paymentMethods: updatedCards });
        setSaving(false);

        if (result.success) {
            setIsAdding(false);
            setFormData({ cardHolder: "", cardNumber: "", expiryDate: "", cvc: "" });
        }
    };

    const handleDelete = async (index) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return;
        const updatedCards = cards.filter((_, i) => i !== index);
        setSaving(true);
        await updateProfile({ paymentMethods: updatedCards });
        setSaving(false);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Phương thức thanh toán</h2>
                <p className="text-gray-600 mt-1">
                    Thêm hoặc bỏ các phương thức thanh toán một cách bảo mật để dễ đặt hơn.
                </p>
            </div>

            {isAdding ? (
                <div className="bg-white border rounded-lg p-6 max-w-md">
                    <h3 className="text-lg font-bold mb-4">Thêm thẻ mới</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ thẻ</label>
                            <input
                                type="text"
                                name="cardHolder"
                                value={formData.cardHolder}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="NGUYEN VAN A"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số thẻ</label>
                            <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="0000 0000 0000 0000"
                                maxLength="19"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                                <input
                                    type="text"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="MM/YY"
                                    maxLength="5"
                                />
                            </div>
                            <div className="w-24">
                                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                <input
                                    type="text"
                                    name="cvc"
                                    value={formData.cvc}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="123"
                                    maxLength="3"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="text-gray-600 font-medium hover:bg-gray-100 px-4 py-2 rounded"
                                disabled={saving}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white font-medium px-6 py-2 rounded hover:bg-blue-700"
                                disabled={saving}
                            >
                                {saving ? <Spinner size="sm" animation="border" /> : "Lưu thẻ"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="border rounded-lg divide-y divide-gray-200 bg-white">
                    {cards.length > 0 ? (
                        cards.map((card, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 p-2 rounded text-blue-600">
                                        <FaCreditCard size={24} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{card.cardType} •••• {card.cardNumber.slice(-4)}</p>
                                        <p className="text-gray-500 text-sm">Hết hạn: {card.expiryDate}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(idx)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                    title="Xóa thẻ"
                                    disabled={saving}
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            Chưa có thẻ nào được lưu.
                        </div>
                    )}

                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-blue-600 font-medium hover:bg-blue-100 px-4 py-2 rounded transition flex items-center gap-2"
                        >
                            <span>+</span> Thêm thẻ mới
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
