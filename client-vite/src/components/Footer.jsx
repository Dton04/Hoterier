import React from "react";

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
          </p>
        </div>

          <div className="flex flex-wrap justify-center items-center gap-6 mt-3">
            <img src="https://download.logo.wine/logo/Booking.com/Booking.com-Logo.wine.png" alt="Booking" className="h-20" />
            <img src="https://latestlogo.com/wp-content/uploads/2024/02/priceline.png" alt="Priceline" className="h-5" />
            <img src="https://logos-world.net/wp-content/uploads/2021/03/Kayak-Logo-2004-2017.png" alt="Kayak" className="h-9" />
            <img src="https://logos-world.net/wp-content/uploads/2024/07/Agoda-Logo.png" alt="Agoda" className="h-7" />
            <img src="https://help.opentable.com/resource/1590622564000/OTCommunity_Assets/logos/OpenTable_logo_fullcolor.png" alt="OpenTable" className="h-6" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;