import React from 'react';
import Banner from '../Banner'; // Sử dụng cùng Banner component như Contact
// import '../../css/ourteam.css'; // Import CSS for styling
import BookingForm from '../BookingForm';
function OurTeam() {
  return (
    <div className="our-team-page">
      <Banner />

       <div className="divider"></div>
      <div className="team-container">
        {/* Team Section */}
        <section className="team-section">
          <h2 className="section-heading">ĐỘI NGŨ CỦA CHÚNG TÔI</h2>
          <p className="section-subtitle">
            Gặp gỡ đội ngũ chuyên nghiệp của chúng tôi, luôn sẵn sàng mang đến cho bạn trải nghiệm tuyệt vời nhất.
          </p>
          
          <div className="team-grid">
            {/* Team Member 1 */}
            <div className="team-member">
              <div className="member-image">
                <img src="https://res.cloudinary.com/dah1butg2/image/upload/v1744093687/anhcuatao_jxr1ja.jpg" alt="Team Member 1" />
              </div>
              <h3 className="member-name">Nguyễn Tấn Đạt</h3>
              <p className="member-role">Quản lý khách sạn</p>
              <p className="member-contact">Email: tandat@luxuryhotel.com</p>
              <p className="member-contact">Điện thoại: +84 869 708 914</p>
            </div>

            {/* Team Member 2 */}
            <div className="team-member">
              <div className="member-image">
                <img src="https://res.cloudinary.com/dah1butg2/image/upload/v1744015307/z6481581359593_6096892dcc956b842a339b60c54bd863_ftrmmq.jpg" alt="Team Member 2" />
              </div>
              <h3 className="member-name">Phạm Lê Hoàng Phương GÀ</h3>
              <p className="member-role">Trưởng Culi</p>
              <p className="member-contact">Email: phuongkhung@gmail.com</p>
              <p className="member-contact">Điện thoại: +84 912 345 679</p>
            </div>

            {/* Team Member 3 */}
            <div className="team-member">
              <div className="member-image">
                <img src="https://res.cloudinary.com/dah1butg2/image/upload/v1744094061/Toi_bbn4jz.jpg" alt="Team Member 3" />
              </div>
              <h3 className="member-name">Trần Tấn Tới</h3>
              <p className="member-role">Đầu bếp trưởng</p>
              <p className="member-contact">Email: tienlen@luxuryhotel.co m</p>
              <p className="member-contact">Điện thoại: +84 912 345 680</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default OurTeam;