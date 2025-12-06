import React from 'react';
import { Shield, AlertTriangle, Lock, Key, Smartphone, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityCenter = () => {
    return (
        <div className="bg-[#f5f7fa] min-h-screen pt-[80px] pb-12 font-sans">
            <div className="max-w-5xl mx-auto px-4">
                {/* Breadcrumb / Back Navigation */}
                <div className="mb-6">
                    <Link
                        to="/profile"
                        className="inline-flex items-center text-[#006ce4] hover:bg-blue-50 px-3 py-2 rounded-md transition-colors font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại cài đặt hồ sơ
                    </Link>
                </div>

                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Trung tâm bảo mật</h1>
                        <p className="text-[#474747] text-base">
                            Điều chỉnh cài đặt để bảo vệ tài khoản của bạn và giữ an toàn khi sử dụng dịch vụ.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <Shield className="w-16 h-16 text-[#003580] opacity-10" />
                    </div>
                </div>

                {/* Important Alert */}
                <div className="bg-white border border-[#e7e7e7] rounded-lg p-5 mb-8 shadow-sm flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#fff8e1] flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-[#d93025]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[#1a1a1a] font-bold text-base mb-1">Giữ an toàn cho tài khoản</h3>
                        <p className="text-[#474747] text-sm leading-relaxed">
                            Chúng tôi không bao giờ yêu cầu bạn cung cấp mật khẩu qua email hoặc tin nhắn.
                            Hãy cẩn thận với các liên kết đáng ngờ và luôn kiểm tra địa chỉ URL trước khi đăng nhập.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 2FA Section */}
                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-blue-50 rounded-full h-fit">
                                        <Smartphone className="w-6 h-6 text-[#006ce4]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Xác thực 2 yếu tố (2FA)</h3>
                                        <p className="text-[#474747] text-sm mb-4">
                                            Tăng cường bảo mật bằng cách yêu cầu mã xác nhận từ điện thoại của bạn mỗi khi đăng nhập trên thiết bị mới.
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-[#008009] font-medium mb-4">
                                            <CheckCircle className="w-4 h-4" />
                                            Được khuyến nghị
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                                <button className="text-[#006ce4] border border-[#006ce4] hover:bg-blue-50 font-medium rounded px-4 py-2 text-sm transition-colors">
                                    Cài đặt ngay
                                </button>
                            </div>
                        </div>

                        {/* Login Activity */}
                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-50 rounded-full h-fit">
                                    <Key className="w-6 h-6 text-[#008009]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Hoạt động đăng nhập</h3>
                                    <p className="text-[#474747] text-sm mb-4">
                                        Kiểm tra danh sách các thiết bị và địa điểm đã truy cập vào tài khoản của bạn gần đây. Nếu thấy nghi ngờ, hãy đăng xuất ngay.
                                    </p>
                                    <div className="flex justify-end">
                                        <button className="text-[#006ce4] font-medium hover:bg-blue-50 px-4 py-2 rounded text-sm transition-colors flex items-center">
                                            Xem lịch sử hoạt động <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Lock */}
                        <div className="bg-white border border-[#d93025] rounded-lg p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-50 rounded-full h-fit">
                                    <Lock className="w-6 h-6 text-[#d93025]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Khóa tài khoản khẩn cấp</h3>
                                    <p className="text-[#474747] text-sm mb-4">
                                        Nếu bạn phát hiện hoạt động bất thường hoặc nghi ngờ tài khoản bị xâm phạm, hãy khóa tài khoản ngay lập tức để bảo vệ dữ liệu.
                                    </p>
                                    <div className="flex justify-end">
                                        <button className="bg-white border border-[#d93025] text-[#d93025] hover:bg-red-50 font-medium rounded px-4 py-2 text-sm transition-colors">
                                            Khóa tài khoản
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-6 shadow-sm sticky top-24">
                            <h3 className="text-base font-bold text-[#1a1a1a] mb-4">Lời khuyên bảo mật</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#006ce4] mt-2 flex-shrink-0"></div>
                                    <p className="text-sm text-[#474747]">
                                        Sử dụng mật khẩu mạnh: kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#006ce4] mt-2 flex-shrink-0"></div>
                                    <p className="text-sm text-[#474747]">
                                        Không sử dụng cùng một mật khẩu cho nhiều tài khoản trực tuyến khác nhau.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#006ce4] mt-2 flex-shrink-0"></div>
                                    <p className="text-sm text-[#474747]">
                                        Luôn đăng xuất khi sử dụng máy tính công cộng hoặc thiết bị của người khác.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#006ce4] mt-2 flex-shrink-0"></div>
                                    <p className="text-sm text-[#474747]">
                                        Cập nhật phần mềm diệt virus và trình duyệt web thường xuyên.
                                    </p>
                                </li>
                            </ul>
                            <div className="mt-6 pt-6 border-t border-[#e7e7e7]">
                                <a href="#" className="text-[#006ce4] text-sm font-medium hover:underline">
                                    Tìm hiểu thêm về bảo mật trực tuyến
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityCenter;
