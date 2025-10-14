import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';


const CreateRoomForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    maxcount: '',
    beds: '',
    baths: '',
    phonenumber: '',
    rentperday: '',
    imageurls: '',
    availabilityStatus: 'available',
    type: '',
    description: '',
    hotelId: '', // Thêm hotelId vào formData
  });
  const [hotels, setHotels] = useState([]); // Trạng thái lưu danh sách khách sạn
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy danh sách khách sạn khi component mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/hotels');
        setHotels(response.data);
      } catch (err) {
        setError('Lỗi khi lấy danh sách khách sạn');
      }
    };
    fetchHotels();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Chuẩn hóa dữ liệu
    const dataToSubmit = {
      ...formData,
      maxcount: parseInt(formData.maxcount),
      beds: parseInt(formData.beds),
      baths: parseInt(formData.baths),
      phonenumber: parseInt(formData.phonenumber),
      rentperday: parseInt(formData.rentperday),
      imageurls: formData.imageurls ? formData.imageurls.split(',').map(url => url.trim()) : [],
      hotelId: formData.hotelId, // Thêm hotelId vào dữ liệu gửi đi
    };

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || userInfo.role !== 'admin') {
        setError('Bạn không có quyền tạo phòng mới');
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const response = await axios.post('http://localhost:5000/api/rooms', dataToSubmit, config);
      setSuccess('Tạo phòng mới thành công!');
      setFormData({
        name: '',
        maxcount: '',
        beds: '',
        baths: '',
        phonenumber: '',
        rentperday: '',
        imageurls: '',
        availabilityStatus: 'available',
        type: '',
        description: '',
        hotelId: '', // Reset hotelId
      });
      setTimeout(() => navigate('/admin/rooms'), 2000); // Chuyển hướng sau 2 giây
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tạo phòng');
    }
  };

  return (
    <Container className="my-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <h2 className="mb-4">Tạo Phòng Mới</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="hotelId">
              <Form.Label>Chọn Khách Sạn</Form.Label>
              <Form.Select
                name="hotelId"
                value={formData.hotelId}
                onChange={handleChange}
                required
              >
                <option value="">Chọn khách sạn</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Tên Phòng</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nhập tên phòng"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="maxcount">
                  <Form.Label>Số Người Tối Đa</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxcount"
                    value={formData.maxcount}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Nhập số người tối đa"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="rentperday">
                  <Form.Label>Giá Thuê Mỗi Ngày</Form.Label>
                  <Form.Control
                    type="number"
                    name="rentperday"
                    value={formData.rentperday}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Nhập giá thuê"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="beds">
                  <Form.Label>Số Giường</Form.Label>
                  <Form.Control
                    type="number"
                    name="beds"
                    value={formData.beds}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Nhập số giường"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="baths">
                  <Form.Label>Số Phòng Tắm</Form.Label>
                  <Form.Control
                    type="number"
                    name="baths"
                    value={formData.baths}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Nhập số phòng tắm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="phonenumber">
              <Form.Label>Số Điện Thoại Liên Hệ</Form.Label>
              <Form.Control
                type="number"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                required
                placeholder="Nhập số điện thoại"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="type">
              <Form.Label>Loại Phòng</Form.Label>
              <Form.Control
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                placeholder="Nhập loại phòng (VD: Standard, Deluxe)"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="availabilityStatus">
              <Form.Label>Trạng Thái</Form.Label>
              <Form.Select
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleChange}
              >
                <option value="available">Có Sẵn</option>
                <option value="maintenance">Bảo Trì</option>
                <option value="busy">Đang Sử Dụng</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="imageurls">
              <Form.Label>URL Hình Ảnh (phân tách bằng dấu phẩy)</Form.Label>
              <Form.Control
                type="text"
                name="imageurls"
                value={formData.imageurls}
                onChange={handleChange}
                placeholder="Nhập các URL hình ảnh, cách nhau bằng dấu phẩy"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Mô Tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Nhập mô tả phòng"
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Tạo Phòng
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateRoomForm;