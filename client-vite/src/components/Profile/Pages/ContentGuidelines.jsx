import React from 'react';
import { BookOpen, Star, Image, MessageCircle, ArrowLeft, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContentGuidelines = () => {
    return (
        <div className="bg-[#f5f7fa] min-h-screen pt-[80px] pb-12 font-sans">
            <div className="max-w-5xl mx-auto px-4">
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
                <div className="mb-10 text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">Tiêu chuẩn nội dung & cộng đồng</h1>
                    <p className="text-[#474747] text-lg">
                        Chúng tôi cam kết xây dựng một cộng đồng du lịch đáng tin cậy. Dưới đây là các quy định về việc đăng tải đánh giá và hình ảnh.
                    </p>
                </div>

                <div className="grid gap-8">

                    {/* Section 1: General Principles */}
                    <div className="bg-white border border-[#e7e7e7] rounded-lg p-8 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 rounded-full h-fit">
                                <BookOpen className="w-6 h-6 text-[#006ce4]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">Nguyên tắc chung</h2>
                                <p className="text-[#474747] mb-6 leading-relaxed">
                                    Để đảm bảo tính hữu ích và minh bạch, tất cả nội dung do người dùng đóng góp phải tuân thủ các nguyên tắc cốt lõi sau đây. Chúng tôi sẽ gỡ bỏ các nội dung vi phạm.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-[#008009] mt-0.5 flex-shrink-0" />
                                        <span className="text-[#1a1a1a] text-sm">Nội dung phải dựa trên trải nghiệm thực tế của chính bạn.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-[#008009] mt-0.5 flex-shrink-0" />
                                        <span className="text-[#1a1a1a] text-sm">Tôn trọng sự riêng tư của người khác.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <X className="w-5 h-5 text-[#d93025] mt-0.5 flex-shrink-0" />
                                        <span className="text-[#1a1a1a] text-sm">Không chứa ngôn từ thù địch, xúc phạm hoặc quấy rối.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <X className="w-5 h-5 text-[#d93025] mt-0.5 flex-shrink-0" />
                                        <span className="text-[#1a1a1a] text-sm">Không quảng cáo hoặc spam liên kết thương mại.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 2: Reviews */}
                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-8 shadow-sm flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-50 rounded-lg">
                                    <Star className="w-6 h-6 text-[#febb02]" />
                                </div>
                                <h2 className="text-lg font-bold text-[#1a1a1a]">Đánh giá & Bình luận</h2>
                            </div>
                            <p className="text-[#474747] text-sm mb-6 flex-grow">
                                Đánh giá của bạn giúp hàng triệu du khách khác đưa ra quyết định đúng đắn. Hãy chia sẻ một cách khách quan và chi tiết.
                            </p>

                            <div className="bg-[#f5f7fa] p-4 rounded-lg border border-[#e7e7e7]">
                                <h4 className="font-bold text-[#1a1a1a] text-sm mb-2">Mẹo viết đánh giá hữu ích:</h4>
                                <ul className="space-y-2 text-sm text-[#474747]">
                                    <li className="flex gap-2">
                                        <span className="text-[#006ce4]">•</span>
                                        Mô tả cụ thể về tiện nghi, vị trí và vệ sinh.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-[#006ce4]">•</span>
                                        Nêu rõ những điều bạn thích và chưa hài lòng.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-[#006ce4]">•</span>
                                        Tránh nhận xét quá ngắn hoặc chung chung.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Section 3: Photos */}
                        <div className="bg-white border border-[#e7e7e7] rounded-lg p-8 shadow-sm flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Image className="w-6 h-6 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-bold text-[#1a1a1a]">Hình ảnh & Video</h2>
                            </div>
                            <p className="text-[#474747] text-sm mb-6 flex-grow">
                                Hình ảnh thực tế giúp tăng độ tin cậy. Vui lòng đảm bảo hình ảnh rõ nét và liên quan đến địa điểm lưu trú.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-[#008009] bg-[#f0f9f0] p-3 rounded-lg">
                                    <h4 className="font-bold text-[#008009] text-sm mb-2 flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Nên làm
                                    </h4>
                                    <ul className="text-xs text-[#1a1a1a] space-y-1">
                                        <li>Ảnh sáng, rõ nét</li>
                                        <li>Chụp phòng, tiện nghi</li>
                                        <li>Góc chụp rộng</li>
                                    </ul>
                                </div>
                                <div className="border border-[#d93025] bg-[#fdf2f2] p-3 rounded-lg">
                                    <h4 className="font-bold text-[#d93025] text-sm mb-2 flex items-center gap-1">
                                        <X className="w-4 h-4" /> Tránh
                                    </h4>
                                    <ul className="text-xs text-[#1a1a1a] space-y-1">
                                        <li>Ảnh mờ, rung</li>
                                        <li>Ảnh chứa người lạ</li>
                                        <li>Nội dung phản cảm</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContentGuidelines;
