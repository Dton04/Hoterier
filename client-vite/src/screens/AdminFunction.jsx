import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row } from 'react-bootstrap';

const adminFunctions = [
  { path: '/admin/bookings', icon: 'fas fa-book', label: 'Quản lý Đặt phòng' },
  { path: '/admin/staffmanagement', icon: 'fas fa-users-cog', label: 'Quản lý Nhân viên' },
  { path: '/admin/users', icon: 'fas fa-user-cog', label: 'Quản lý Người dùng' },
  { path: '/admin/hotels', icon: 'fas fa-hotel', label: 'Quản lý Khách sạn' },
  { path: '/admin/createroom', icon: 'fas fa-plus', label: 'Tạo Phòng' },
  { path: '/admin/services', icon: 'fas fa-concierge-bell', label: 'Quản lý Dịch vụ' },
  { path: '/admin/discounts', icon: 'fas fa-tags', label: 'Quản lý Giảm giá' },
  { path: '/admin/rewards', icon: 'fas fa-gift', label: 'Quản lý Ưu đãi' },
  { path: '/admin/reviews', icon: 'fas fa-star', label: 'Quản lý Đánh giá' },
];

const AdminFunctions = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-functions mt-5">
      <h4 className="text-center mb-4">Chức năng quản trị</h4>
      <Row>
        {adminFunctions.map((func, idx) => (
          <Col key={idx} md={4} sm={6} className="mb-4">
            <Card
              className="function-card text-center h-100 shadow-sm hover-pointer"
              onClick={() => navigate(func.path)}
            >
              <Card.Body>
                <i className={`${func.icon} fa-2x mb-3`} style={{ color: '#2d3748' }}></i>
                <Card.Title>{func.label}</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminFunctions;