import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Badge,
  Spinner,
  Pagination,
  ButtonGroup,
  Alert
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';


axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // giả sử token được lưu ở localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage] = useState(10);
  const [filters, setFilters] = useState({
    hotelId: '',
    isAvailable: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    icon: 'fas fa-concierge-bell',
    hotelIds: [],
    imageUrl: '',
    operatingHours: {
      open: '06:00',
      close: '22:00'
    },
    capacity: 0,
    requiresBooking: false,
    isFree: false
  });

  useEffect(() => {
    fetchServices();
    fetchHotels();
  }, [filters]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên dịch vụ là bắt buộc';
    if (!formData.hotelIds || formData.hotelIds.length === 0) errors.hotelIds = 'Vui lòng chọn khách sạn';
    if (!formData.isFree && formData.price <= 0) errors.price = 'Giá phải lớn hơn 0';
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) errors.imageUrl = 'URL hình ảnh không hợp lệ';
    return errors;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.hotelId) params.append('hotelId', filters.hotelId);
      if (filters.isAvailable !== '') params.append('isAvailable', filters.isAvailable);

      const response = await axios.get(`/api/services?${params}`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Lỗi khi lấy danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const response = await axios.get('/api/hotels');
      setHotels(response.data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Lỗi khi lấy danh sách khách sạn');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!window.confirm(editingService ? 'Bạn có chắc muốn cập nhật dịch vụ này?' : 'Bạn có chắc muốn tạo dịch vụ mới?')) {
      return;
    }

    try {
      let response;
      if (editingService) {
        await axios.put(`/api/services/${editingService._id}`, formData);
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        if (formData.hotelIds.includes("all")) {
          // Nếu chọn tất cả -> tạo dịch vụ cho mọi khách sạn
          for (const h of hotels) {
            await axios.post('/api/services', { ...formData, hotelId: h._id });
          }
        } else {
          // Nếu chọn nhiều khách sạn cụ thể
          for (const hotelId of formData.hotelIds) {
            await axios.post('/api/services', { ...formData, hotelId });
          }
        }
        toast.success('Tạo dịch vụ thành công');
      }

      setShowModal(false);
      resetForm();
      fetchServices();
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      icon: service.icon,
      hotelIds: [service.hotelId._id] || service.hotelId,
      imageUrl: service.imageUrl,
      operatingHours: service.operatingHours,
      capacity: service.capacity,
      requiresBooking: service.requiresBooking,
      isFree: service.isFree
    });
    setShowModal(true);
    setFormErrors({});
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await axios.delete(`/api/services/${serviceId}`);
        toast.success('Xóa dịch vụ thành công');
        fetchServices();
      } catch (error) {
        const message = error.response?.data?.message || 'Có lỗi xảy ra';
        toast.error(message);
      }
    }
  };

  const handleToggleAvailability = async (serviceId) => {
    try {
      await axios.patch(`/api/services/${serviceId}/toggle`);
      toast.success('Cập nhật trạng thái thành công');
      fetchServices();
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      icon: 'fas fa-concierge-bell',
      hotelIds: [],
      imageUrl: '',
      operatingHours: {
        open: '06:00',
        close: '22:00'
      },
      capacity: 0,
      requiresBooking: false,
      isFree: false
    });
    setEditingService(null);
    setFormErrors({});
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Pagination
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = services.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(services.length / servicesPerPage);

  return (
    <Container fluid className="service-management">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Quản lý dịch vụ bổ sung</h2>
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              className="d-flex align-items-center"
            >
              <FaPlus className="me-2" />
              Thêm dịch vụ mới
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Khách sạn</Form.Label>
                    <Form.Select
                      value={filters.hotelId}
                      onChange={(e) => setFilters({ ...filters, hotelId: e.target.value })}
                    >
                      <option value="">Tất cả khách sạn</option>
                      {hotels.map(hotel => (
                        <option key={hotel._id} value={hotel._id}>
                          {hotel.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={filters.isAvailable}
                      onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Tạm ngưng</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setFilters({ hotelId: '', isAvailable: '' })}
                  >
                    Xóa bộ lọc
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Services Table */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Khách sạn</th>
                        <th>Giá</th>
                        <th>Giờ hoạt động</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentServices.map(service => (
                        <tr key={service._id}>
                          <td>
                            <div className="service-card">
                              <div className="service-icon">
                                <i className={service.icon}></i>
                              </div>
                              <div>
                                <div className="service-name">{service.name}</div>
                                <div className="service-desc">{service.description}</div>
                              </div>
                            </div>
                          </td>

                          <td>{service.hotelId?.name || 'N/A'}</td>
                          <td>
                            {service.isFree ? (
                              <Badge bg="success">Miễn phí</Badge>
                            ) : (
                              formatPrice(service.price)
                            )}
                          </td>
                          <td>
                            {service.operatingHours?.open} - {service.operatingHours?.close}
                          </td>
                          <td>
                            <Badge bg={service.isAvailable ? 'success' : 'secondary'}>
                              {service.isAvailable ? 'Đang hoạt động' : 'Tạm ngưng'}
                            </Badge>
                          </td>
                          <td>
                            <ButtonGroup size="sm">
                              <Button
                                variant="outline-primary"
                                onClick={() => handleEdit(service)}
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant={service.isAvailable ? 'outline-warning' : 'outline-success'}
                                onClick={() => handleToggleAvailability(service._id)}
                                title={service.isAvailable ? 'Tạm ngưng' : 'Kích hoạt'}
                              >
                                {service.isAvailable ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => handleDelete(service._id)}
                                title="Xóa"
                              >
                                <FaTrash />
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {currentServices.length === 0 && (
                    <div className="text-center py-5">
                      <p className="text-muted">Không có dịch vụ nào được tìm thấy</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.Prev
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                        {[...Array(totalPages)].map((_, index) => (
                          <Pagination.Item
                            key={index + 1}
                            active={index + 1 === currentPage}
                            onClick={() => setCurrentPage(index + 1)}
                          >
                            {index + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Service Modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {Object.keys(formErrors).length > 0 && (
              <Alert variant="danger">
                <ul>
                  {Object.values(formErrors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên dịch vụ *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isInvalid={!!formErrors.name}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Khách sạn *</Form.Label>
                  <Form.Select
                    multiple
                    value={formData.hotelIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, hotelIds: selected });
                    }}
                    isInvalid={!!formErrors.hotelIds}
                    required
                  >
                    <option value="all">Tất cả khách sạn</option>
                    {hotels.map(hotel => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.hotelIds}
                  </Form.Control.Feedback>
                </Form.Group>

              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                isInvalid={!!formErrors.description}
                
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Icon (Font Awesome)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="fas fa-concierge-bell"
                  />
                  {formData.icon && (
                    <div className="mt-2">
                      <i className={formData.icon} style={{ fontSize: '24px' }}></i>
                      <span className="ms-2">Preview</span>
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>URL hình ảnh</Form.Label>
                  <Form.Control
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    isInvalid={!!formErrors.imageUrl}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.imageUrl}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá (VND)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    disabled={formData.isFree}
                    isInvalid={!!formErrors.price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Sức chứa</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    placeholder="0 = không giới hạn"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Giờ mở cửa</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.operatingHours.open}
                    onChange={(e) => setFormData({
                      ...formData,
                      operatingHours: { ...formData.operatingHours, open: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Giờ đóng cửa</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.operatingHours.close}
                    onChange={(e) => setFormData({
                      ...formData,
                      operatingHours: { ...formData.operatingHours, close: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  label="Miễn phí"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked, price: e.target.checked ? 0 : formData.price })}
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  label="Yêu cầu đặt trước"
                  checked={formData.requiresBooking}
                  onChange={(e) => setFormData({ ...formData, requiresBooking: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingService ? 'Cập nhật' : 'Tạo dịch vụ'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ServiceManagement;