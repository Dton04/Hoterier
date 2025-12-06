import React, { useState } from 'react';
import { Scale, FileText, Send, ArrowLeft, Info, Paperclip, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DisputeResolution = () => {
    const [formData, setFormData] = useState({
        bookingId: '',
        issueType: 'service',
        description: '',
        files: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Xử lý gửi form (giả lập)
        alert('Yêu cầu khiếu nại của bạn đã được gửi. Chúng tôi sẽ phản hồi trong vòng 24h.');
        setFormData({ bookingId: '', issueType: 'service', description: '', files: null });
    };

    return (
        <div className="bg-[#f5f7fa] min-h-screen pt-[80px] pb-12 font-sans">
            <div className="max-w-3xl mx-auto px-4">
                {/* Navigation */}
                <div className="mb-6">
                    <Link
                        to="/profile"
                        className="inline-flex items-center text-[#006ce4] hover:bg-blue-50 px-3 py-2 rounded-md transition-colors font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại cài đặt hồ sơ
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Giải quyết khiếu nại</h1>
                    <p className="text-[#474747] text-base">
                        Chúng tôi ở đây để giúp bạn. Hãy cho chúng tôi biết vấn đề bạn đang gặp phải.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-6 shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Booking ID */}
                                <div>
                                    <label className="block text-sm font-bold text-[#1a1a1a] mb-1">
                                        Mã đặt phòng <span className="text-[#474747] font-normal">(Tùy chọn)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="bookingId"
                                        value={formData.bookingId}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: 123456789"
                                        className="w-full border border-[#868686] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#006ce4] focus:border-transparent placeholder-gray-400"
                                    />
                                    <p className="text-xs text-[#474747] mt-1">
                                        Bạn có thể tìm thấy mã này trong email xác nhận đặt phòng.
                                    </p>
                                </div>

                                {/* Issue Type */}
                                <div>
                                    <label className="block text-sm font-bold text-[#1a1a1a] mb-1">
                                        Vấn đề bạn đang gặp phải là gì?
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="issueType"
                                            value={formData.issueType}
                                            onChange={handleChange}
                                            className="w-full border border-[#868686] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#006ce4] focus:border-transparent bg-white appearance-none"
                                        >
                                            <option value="service">Chất lượng dịch vụ & Tiện nghi</option>
                                            <option value="payment">Thanh toán, Hoàn tiền & Hóa đơn</option>
                                            <option value="technical">Lỗi kỹ thuật trên website/ứng dụng</option>
                                            <option value="checkin">Vấn đề khi nhận/trả phòng</option>
                                            <option value="other">Vấn đề khác</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-[#1a1a1a] mb-1">
                                        Mô tả chi tiết
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="6"
                                        placeholder="Vui lòng cung cấp càng nhiều chi tiết càng tốt để chúng tôi có thể hỗ trợ bạn nhanh chóng..."
                                        className="w-full border border-[#868686] rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#006ce4] focus:border-transparent placeholder-gray-400 resize-y"
                                        required
                                    ></textarea>
                                </div>

                                {/* File Attachment */}
                                <div>
                                    <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                                        Đính kèm tài liệu minh chứng
                                    </label>
                                    <div className="border border-dashed border-[#868686] rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50">
                                        <Paperclip className="mx-auto h-6 w-6 text-[#474747] mb-2" />
                                        <p className="text-sm text-[#006ce4] font-medium hover:underline">
                                            Nhấn để chọn file
                                        </p>
                                        <p className="text-xs text-[#474747] mt-1">
                                            JPG, PNG, PDF (Tối đa 10MB)
                                        </p>
                                        <input type="file" className="hidden" multiple />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-[#006ce4] text-white font-bold py-3 rounded hover:bg-[#003580] transition-colors flex items-center justify-center gap-2 text-base"
                                    >
                                        Gửi yêu cầu hỗ trợ
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-5 shadow-sm mb-6">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-[#006ce4] flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-[#1a1a1a] text-sm mb-1">Quy trình xử lý</h4>
                                    <p className="text-sm text-[#474747] leading-relaxed">
                                        Sau khi nhận được yêu cầu, đội ngũ hỗ trợ sẽ xem xét và phản hồi qua email trong vòng <strong>24 giờ</strong> làm việc.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-5 shadow-sm">
                            <h4 className="font-bold text-[#1a1a1a] text-sm mb-3">Bạn cần hỗ trợ khẩn cấp?</h4>
                            <p className="text-sm text-[#474747] mb-4">
                                Đối với các vấn đề cần xử lý ngay lập tức (ví dụ: không thể nhận phòng), vui lòng liên hệ hotline.
                            </p>
                            <Link
                                to="/contact"
                                className="block w-full text-center border border-[#006ce4] text-[#006ce4] font-medium py-2 rounded hover:bg-blue-50 transition-colors text-sm"
                            >
                                Gọi tổng đài hỗ trợ
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DisputeResolution;
