import React, { useState } from 'react';

import Banner from './Banner';


function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setStatus('Tin nhắn đã được gửi thành công!');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
      } else {
        setStatus(result.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (error) {
      setStatus('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <div className="contact-page">
      <Banner />

      <div className="contact-container">
   

        <div className="divider"></div>

        <section className="contact-section">
          <h2 className="section-heading">LIÊN HỆ VỚI CHÚNG TÔI</h2>
          <p className="section-subtitle">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua thông tin dưới đây.
          </p>
          
          <div className="contact-info">
            <div className="info-box">
              <h4>Địa chỉ</h4>
              <p>123 Đường Lê Lợi, Quận 1, TP.HCM</p>
            </div>
            <div className="info-box">
              <h4>Số điện thoại</h4>
              <p>+84 123 456 789</p>
            </div>
            <div className="info-box">
              <h4>Email</h4>
              <p>Hotelier@gmail.com</p>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        <section className="contact-main">
          <div className="contact-grid">
            <div className="contact-form-container">
              <h2 className="form-title">GỬI TIN NHẮN CHO CHÚNG TÔI</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Họ và tên"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="subject"
                    placeholder="Tiêu đề"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    placeholder="Nội dung tin nhắn"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="send-btn">GỬI TIN NHẮN</button>
              </form>
              {status && <p className="form-status">{status}</p>}
            </div>

            <div className="map-container">
              <iframe
                title="Bản đồ Luxury Hotel TP.HCM"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.440559003735!2d106.7052703152609!3d10.775847392321313!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f46fb7b991d%3A0x8a4a9e2b5d9a0a1e!2sLuxury%20Hotel%20Saigon!5e0!3m2!1sen!2s!4v1620000000000!5m2!1sen!2s"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
              <div className="location-tags">
                <span>Quận 1</span>
                <span>Trung tâm thành phố</span>
                <span>Gần chợ Bến Thành</span>
                <span>View sông Sài Gòn</span>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>
      </div>
    </div>
  );
}

export default Contact;