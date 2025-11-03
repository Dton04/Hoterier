import React from "react";
<<<<<<< HEAD

const Footer = () => {
  return (
    <footer className="bg-[#f9f9f9] text-[#222] text-sm mt-20 border-t border-gray-200">
      {/* Phần nội dung chính (5 cột) */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 px-6 py-10">
        {/* Hỗ trợ */}
        <div>
          <h3 className="font-semibold mb-4">Hỗ trợ</h3>
          <ul className="space-y-2">
            <li>Quản lí các chuyến đi của bạn</li>
            <li>Liên hệ Dịch vụ Khách hàng</li>
            <li>Trung tâm thông tin bảo mật</li>
          </ul>
        </div>

        {/* Khám phá thêm */}
        <div>
          <h3 className="font-semibold mb-4">Khám phá thêm</h3>
          <ul className="space-y-2">
            <li>Chương trình khách hàng thân thiết Genius</li>
            <li>Ưu đãi theo mùa và dịp lễ</li>
            <li>Bài viết về du lịch</li>
            <li>Booking.com dành cho Doanh nghiệp</li>
            <li>Traveller Review Awards</li>
            <li>Đặt nhà hàng</li>
            <li>Booking.com dành cho Đại lý Du lịch</li>
          </ul>
        </div>

        {/* Điều khoản */}
        <div>
          <h3 className="font-semibold mb-4">Điều khoản và cài đặt</h3>
          <ul className="space-y-2">
            <li>Bảo mật & Cookie</li>
            <li>Điều khoản dịch vụ</li>
            <li>Chính sách về Khả năng tiếp cận</li>
            <li>Tranh chấp đối tác</li>
            <li>Chính sách chống Nô lệ Hiện đại</li>
            <li>Chính sách về Quyền con người</li>
          </ul>
        </div>

        {/* Đối tác */}
        <div>
          <h3 className="font-semibold mb-4">Dành cho đối tác</h3>
          <ul className="space-y-2">
            <li>Đăng nhập vào trang Extranet</li>
            <li>Trợ giúp đối tác</li>
            <li>Đăng chỗ nghỉ của Quý vị</li>
            <li>Trở thành đối tác phân phối</li>
          </ul>
        </div>

        {/* Về chúng tôi */}
        <div>
          <h3 className="font-semibold mb-4">Về chúng tôi</h3>
          <ul className="space-y-2">
            <li>Về Booking.com</li>
            <li>Chúng tôi hoạt động như thế nào</li>
            <li>Du lịch bền vững</li>
            <li>Truyền thông</li>
            <li>Cơ hội việc làm</li>
            <li>Quan hệ cổ đông</li>
            <li>Liên hệ công ty</li>
            <li>Hướng dẫn và cáo báo nội dung</li>
          </ul>
        </div>
      </div>

      {/* Phần bản quyền + logo */}
      <div className="border-t border-gray-200 bg-[#f5f5f5]">
        <div className="max-w-6xl mx-auto text-center py-6">
          <p className="text-[#333] mb-1">
            Hotelier là một phần của <strong>Booking Holdings Inc.</strong>, tập đoàn đứng đầu thế giới về du lịch trực tuyến và các dịch vụ liên quan.
          </p>
          <p className="text-[#333] mb-3">
            Bản quyền © 1996 - {new Date().getFullYear()} <strong>Hotelier</strong>. Bảo lưu mọi quyền.
=======
import { Link } from "react-router-dom";
import vietnamFlag from "../assets/images/vietnam-flag.png";

const FooterHeading = ({ children }) => (
  <h3 className="font-semibold text-white text-base md:text-lg mb-3">
    {children}
  </h3>
);

const FooterLink = ({ to = "#", children }) => (
  <Link to={to} className="block text-gray-200 text-sm hover:text-[#febb02] transition">
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="bg-[#003580] text-white mt-16 pt-10 pb-8 border-t border-blue-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top: 5 columns like booking.com */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 md:gap-10">
          {/* Hỗ trợ */}
          <div>
            <FooterHeading>Hỗ trợ</FooterHeading>
            <ul className="space-y-2">
              <li><FooterLink to="/trips">Quản lí các chuyến đi của bạn</FooterLink></li>
              <li><FooterLink to="/contact">Liên hệ Dịch vụ Khách hàng</FooterLink></li>
              <li><FooterLink to="/safety">Trung tâm thông tin bảo mật</FooterLink></li>
            </ul>
          </div>

          {/* Khám phá thêm */}
          <div>
            <FooterHeading>Khám phá thêm</FooterHeading>
            <ul className="space-y-2">
              <li><FooterLink to="/genius">Chương trình khách hàng thân thiết</FooterLink></li>
              <li><FooterLink to="/deals">Ưu đãi theo mùa và dịp lễ</FooterLink></li>
              <li><FooterLink to="/blog">Bài viết về du lịch</FooterLink></li>
              <li><FooterLink to="/business">Dành cho Doanh nghiệp</FooterLink></li>
              <li><FooterLink to="/cars">Cho thuê xe hơi</FooterLink></li>
              <li><FooterLink to="/flights">Tìm chuyến bay</FooterLink></li>
            </ul>
          </div>

          {/* Điều khoản và cài đặt */}
          <div>
            <FooterHeading>Điều khoản và cài đặt</FooterHeading>
            <ul className="space-y-2">
              <li><FooterLink to="/privacy">Bảo mật & Cookie</FooterLink></li>
              <li><FooterLink to="/terms">Điều khoản dịch vụ</FooterLink></li>
              <li><FooterLink to="/accessibility">Khả năng tiếp cận</FooterLink></li>
              <li><FooterLink to="/dispute">Tranh chấp đối tác</FooterLink></li>
              <li><FooterLink to="/rights">Chính sách về Quyền con người</FooterLink></li>
            </ul>
          </div>

          {/* Dành cho đối tác */}
          <div>
            <FooterHeading>Dành cho đối tác</FooterHeading>
            <ul className="space-y-2">
              <li><FooterLink to="/extranet">Đăng nhập vào trang Extranet</FooterLink></li>
              <li><FooterLink to="/partners/support">Trợ giúp đối tác</FooterLink></li>
              <li><FooterLink to="/list">Đăng chỗ nghỉ của Quý vị</FooterLink></li>
              <li><FooterLink to="/affiliate">Trở thành đối tác phân phối</FooterLink></li>
            </ul>
          </div>

          {/* Về chúng tôi */}
          <div>
            <FooterHeading>Về chúng tôi</FooterHeading>
            <ul className="space-y-2">
              <li><FooterLink to="/about">Về Hotelier</FooterLink></li>
              <li><FooterLink to="/careers">Cơ hội việc làm</FooterLink></li>
              <li><FooterLink to="/press">Truyền thông</FooterLink></li>
              <li><FooterLink to="/sustainability">Du lịch bền vững</FooterLink></li>
              <li><FooterLink to="/contact">Liên hệ công ty</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-800 mt-10 pt-6" />

        {/* Middle: language & currency (simplified) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={vietnamFlag} alt="VN flag" className="w-6 h-4 object-cover rounded-sm" />
            <span className="text-sm text-white/90">VND</span>
          </div>

          <p className="text-xs md:text-sm text-gray-200 max-w-3xl leading-relaxed">
            Hotelier là một phần của hệ sinh thái du lịch trực tuyến và các dịch vụ liên quan.
            Bản quyền © 1996 – {new Date().getFullYear()} Hotelier. Bảo lưu mọi quyền.
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1
          </p>
        </div>

<<<<<<< HEAD
          <div className="flex flex-wrap justify-center items-center gap-6 mt-3">
            <img src="https://download.logo.wine/logo/Booking.com/Booking.com-Logo.wine.png" alt="Booking" className="h-20" />
            <img src="https://latestlogo.com/wp-content/uploads/2024/02/priceline.png" alt="Priceline" className="h-5" />
            <img src="https://logos-world.net/wp-content/uploads/2021/03/Kayak-Logo-2004-2017.png" alt="Kayak" className="h-9" />
            <img src="https://logos-world.net/wp-content/uploads/2024/07/Agoda-Logo.png" alt="Agoda" className="h-7" />
            <img src="https://help.opentable.com/resource/1590622564000/OTCommunity_Assets/logos/OpenTable_logo_fullcolor.png" alt="OpenTable" className="h-6" />
=======
        {/* Brands row */}
        <div className="mt-6 flex flex-wrap items-center gap-2 md:gap-3">
          <span className="px-3 py-1 rounded-md bg-white text-[#003580] font-semibold text-xs">Booking.com</span>
          <span className="px-3 py-1 rounded-md bg-white/90 text-[#003580] font-semibold text-xs">priceline</span>
          <span className="px-3 py-1 rounded-md bg-[#ff8c00] text-white font-bold text-xs">KAYAK</span>
          <span className="px-3 py-1 rounded-md bg-white text-[#003580] font-semibold text-xs">agoda</span>
          <span className="px-3 py-1 rounded-md bg-white text-[#003580] font-semibold text-xs">OpenTable</span>
        </div>

        {/* Bottom: links & copyright */}
        <div className="mt-8 border-t border-blue-800 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-sm text-gray-300">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-white">HOTELIER</span> · Thiết kế bởi {""}
            <a href="https://facebook.com/tandat0811" target="_blank" rel="noopener noreferrer" className="text-[#febb02] hover:underline">DatTon</a>
          </p>
          <div className="flex flex-wrap gap-5">
            <Link to="/privacy" className="hover:text-[#febb02] transition">Bảo mật</Link>
            <Link to="/cookies" className="hover:text-[#febb02] transition">Cookies</Link>
            <Link to="/terms" className="hover:text-[#febb02] transition">Điều khoản</Link>
            <Link to="/help" className="hover:text-[#febb02] transition">Hỗ trợ</Link>
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
