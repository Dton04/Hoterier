import React, { useState } from "react";
import Banner from "./Banner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setStatus("✅ Tin nhắn đã được gửi thành công!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus(result.message || "❌ Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      setStatus("❌ Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <>


      {/* CONTENT */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#003580] mb-3 uppercase tracking-wide">
              Liên hệ với chúng tôi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.  
              Gửi tin nhắn hoặc ghé thăm văn phòng của chúng tôi để được hỗ trợ nhanh nhất.
            </p>
          </div>

          {/* INFO BOXES */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
              <h4 className="text-[#003580] font-semibold mb-2">📍 Địa chỉ</h4>
              <p className="text-gray-600">123 Lê Lợi, Quận 1, TP. Hồ Chí Minh</p>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
              <h4 className="text-[#003580] font-semibold mb-2">📞 Điện thoại</h4>
              <p className="text-gray-600">+84 123 456 789</p>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
              <h4 className="text-[#003580] font-semibold mb-2">✉️ Email</h4>
              <p className="text-gray-600">hotelier@gmail.com</p>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
              <h4 className="text-[#003580] font-semibold mb-2">🕒 Giờ làm việc</h4>
              <p className="text-gray-600">Thứ 2 - Chủ Nhật: 8:00 - 22:00</p>
            </div>
          </div>

          {/* FORM + MAP */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* FORM */}
            <div className="bg-white shadow-md rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-[#003580] mb-4">
                Gửi tin nhắn cho chúng tôi
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Họ và tên"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0071c2] outline-none"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0071c2] outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Tiêu đề"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0071c2] outline-none"
                  />
                </div>
                <div>
                  <textarea
                    name="message"
                    placeholder="Nội dung tin nhắn"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0071c2] outline-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0071c2] hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
                >
                  Gửi tin nhắn
                </button>
              </form>

              {status && (
                <p
                  className={`mt-4 text-center font-medium ${
                    status.includes("✅") ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {status}
                </p>
              )}
            </div>

            {/* MAP */}
            <div className="relative rounded-2xl overflow-hidden shadow-md">
              <iframe
                title="Bản đồ Luxury Hotel TP.HCM"
                width="100%"
                height="450"
                frameBorder="0"
                style={{ border: 0 }}
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.693%2C10.772%2C106.709%2C10.782&layer=mapnik"
                allowFullScreen=""
                loading="lazy"
              ></iframe>

              <div className="absolute bottom-4 left-4 bg-white/90 px-4 py-2 rounded-lg shadow-md text-sm text-[#003580] font-medium space-x-2">
                <span>📍 Quận 1</span>
                <span>• Trung tâm thành phố</span>
                <span>• Gần chợ Bến Thành</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
