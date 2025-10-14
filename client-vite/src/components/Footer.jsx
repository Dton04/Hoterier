import React from "react";
import { Link } from "react-router-dom";

const FooterSection = ({ title, children }) => (
  <div className="space-y-3">
    {title && <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>}
    <div className="text-gray-200 text-sm leading-relaxed">{children}</div>
  </div>
);

const Footer = () => {
  return (
    <footer className="bg-[#003580] text-white mt-16 pt-10 pb-6 border-t border-blue-900">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 px-6">
        {/* Brand */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-wide text-[#febb02]">HOTELIER</h2>
          <p className="text-gray-200 text-sm">
            “Chạm đến kỳ nghỉ trong mơ – Đặt phòng đẳng cấp chỉ với một cú click.”
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="https://facebook.com/tandat0811" target="_blank" rel="noopener noreferrer" className="hover:text-[#febb02] transition">
              <i className="fab fa-facebook-f text-lg"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#febb02] transition">
              <i className="fab fa-twitter text-lg"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#febb02] transition">
              <i className="fab fa-instagram text-lg"></i>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#febb02] transition">
              <i className="fab fa-youtube text-lg"></i>
            </a>
          </div>
        </div>

        {/* Contact */}
        <FooterSection title="LIÊN HỆ">
          <p>📍 123 Street, Thủ Đức, TP.HCM</p>
          <p>📞 0869 708 914</p>
          <p>✉️ Hotelier@gmail.com</p>
        </FooterSection>

        {/* Company */}
        <FooterSection title="CÔNG TY">
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-[#febb02] transition">Về chúng tôi</Link></li>
            <li><Link to="/contact" className="hover:text-[#febb02] transition">Liên hệ</Link></li>
            <li><Link to="/privacy" className="hover:text-[#febb02] transition">Chính sách bảo mật</Link></li>
            <li><Link to="/terms" className="hover:text-[#febb02] transition">Điều khoản sử dụng</Link></li>
            <li><Link to="/support" className="hover:text-[#febb02] transition">Hỗ trợ</Link></li>
          </ul>
        </FooterSection>

        {/* Services */}
        <FooterSection title="DỊCH VỤ">
          <ul className="space-y-2">
            <li><Link to="/services" className="hover:text-[#febb02] transition">Ẩm thực & Nhà hàng</Link></li>
            <li><Link to="/services" className="hover:text-[#febb02] transition">Spa & Fitness</Link></li>
            <li><Link to="/services" className="hover:text-[#febb02] transition">Thể thao & Giải trí</Link></li>
            <li><Link to="/services" className="hover:text-[#febb02] transition">Sự kiện & Tiệc cưới</Link></li>
            <li><Link to="/services" className="hover:text-[#febb02] transition">Gym & Yoga</Link></li>
          </ul>
        </FooterSection>
      </div>

      {/* Bottom */}
      <div className="mt-10 border-t border-blue-800 pt-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-300 gap-3">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-white">HOTELIER</span>. Thiết kế bởi{" "}
            <a
              href="https://facebook.com/tandat0811"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#febb02] hover:underline"
            >
              DatTon
            </a>
          </p>

          <div className="flex gap-5 text-gray-300">
            <Link to="/" className="hover:text-[#febb02] transition">Trang chủ</Link>
            <Link to="/privacy" className="hover:text-[#febb02] transition">Bảo mật</Link>
            <Link to="/cookies" className="hover:text-[#febb02] transition">Cookies</Link>
            <Link to="/help" className="hover:text-[#febb02] transition">Hỗ trợ</Link>
            <Link to="/faqs" className="hover:text-[#febb02] transition">FAQs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
