import React from 'react';
import Banner from '../components/Banner';
import BookingForm from '../components/BookingForm';
// import '../css/services.css';

function ServicesScreen() {
  const services = [
    {
      title: 'Rooms & Apartment',
      description: 'Không gian sống tiện nghi mang đến sự thoải mái như ngôi nhà thứ hai của bạn.Tận hưởng tiện nghi trong từng góc nhỏ.',
      icon: '🏠',
    },
    {
      title: 'Food & Restaurant',
      description: 'Trải nghiệm ẩm thực đa dạng từ các món ăn địa phương đến quốc tế. Mỗi bữa ăn là một hành trình khám phá hương vị độc đáo.',
      icon: '🍽️',
    },
    {
      title: 'Spa & Fitness',
      description: 'Thiên đường thư giãn với các liệu pháp spa cao cấp và phòng tập hiện đại. Nơi bạn tái tạo năng lượng và cân bằng cuộc sống.',
      icon: '🧘',
    },
    {
      title: 'Sports & Gaming',
      description: 'Khu vực thể thao và giải trí đa dạng, từ các môn thể thao vận động đến trò chơi điện tử hấp dẫn dành cho mọi lứa tuổi.',
      icon: '🏀',
    },
    {
      title: 'Event & Party',
      description: 'Không gian tổ chức sự kiện lý tưởng với đầy đủ trang thiết bị. Nơi biến mọi dịp đặc biệt thành những kỷ niệm khó quên.',
      icon: '🎉',
    },
    {
      title: 'GYM & Yoga',
      description: 'Phòng tập được trang bị thiết bị hiện đại cùng các lớp yoga chuyên nghiệp. Nơi chăm sóc sức khỏe và vóc dáng toàn diện.',
      icon: '🏋️',
    },
  ]

  return (
    <div className="services-page">
      {/* Banner */}
      <Banner />

      <div className="divider"></div>

      <div className="container">
        {/* Tiêu đề */}
        <div className="services-header text-center">
          <h2 className="subtitle">
            <span className="line"></span>
            OUR SERVICES
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Explore Our <span>SERVICES</span>
          </h1>
        </div>

        {/* Danh sách dịch vụ */}
        <div className="row">
          {services.map((service, index) => (
            <div className="col-md-4 col-sm-6 mb-4" key={index}>
              <div className="service-box">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServicesScreen;