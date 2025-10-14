import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import moment from 'moment';



const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [deleteDiscountId, setDeleteDiscountId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'voucher',
    discountType: 'percentage',
    discountValue: 0,
    applicableHotels: [],
    startDate: '',
    endDate: '',
    minBookingAmount: 0,
    maxDiscount: null,
    isStackable: false,
    membershipLevel: null,
    minSpending: null,
  });
  const [errors, setErrors] = useState({});

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;

  const fetchDiscounts = async () => {
    try {
      const response = await axios.get('/api/discounts/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDiscounts(response.data);
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách khuyến mãi: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchHotels = async () => {
    try {
      const response = await axios.get('/api/hotels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHotels(response.data);
    } catch (error) {
      setHotels([]);
      toast.error('Không thể lấy danh sách khách sạn từ server.');
    }
  };

  useEffect(() => {
    if (userInfo?.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này');
      return;
    }
    fetchDiscounts();
    fetchHotels();
  }, []);

  const handleOpenModal = (discount = null) => {
    setSelectedDiscount(discount);
    if (discount) {
      setFormData({
        name: discount.name || '',
        code: discount.code || '',
        description: discount.description || '',
        type: discount.type || 'voucher', // Đảm bảo type được đặt chính xác
        discountType: discount.discountType || 'percentage',
        discountValue: discount.discountValue || 0,
        applicableHotels: discount.applicableHotels.map((h) =>
          typeof h === 'object' && h._id ? h._id.toString() : h.toString()
        ),

        startDate: discount.startDate ? moment(discount.startDate).format('YYYY-MM-DD') : '',
        endDate: discount.endDate ? moment(discount.endDate).format('YYYY-MM-DD') : '',
        minBookingAmount: discount.minBookingAmount || 0,
        maxDiscount: discount.maxDiscount || null,
        isStackable: discount.isStackable || false,
        membershipLevel: discount.membershipLevel || null,
        minSpending: discount.minSpending || null,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        type: 'voucher',
        discountType: 'percentage',
        discountValue: 0,
        applicableHotels: [],
        startDate: '',
        endDate: '',
        minBookingAmount: 0,
        maxDiscount: null,
        isStackable: false,
        membershipLevel: null,
        minSpending: null,
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDiscount(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value === '' ? null : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleHotelChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData((prev) => ({ ...prev, applicableHotels: selected }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Tên khuyến mãi là bắt buộc';
    if (formData.type === 'voucher' && !formData.code) newErrors.code = 'Mã voucher là bắt buộc';
    if (!formData.discountValue || formData.discountValue <= 0) newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    if (!formData.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) newErrors.endDate = 'Ngày kết thúc là bắt buộc';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (formData.type === 'member' && !formData.membershipLevel) {
      newErrors.membershipLevel = 'Cấp độ thành viên là bắt buộc cho khuyến mãi member';
    }
    if (formData.type === 'accumulated' && (!formData.minSpending || formData.minSpending <= 0)) {
      newErrors.minSpending = 'Chi tiêu tối thiểu phải lớn hơn 0 cho khuyến mãi accumulated';
    }
    if (formData.type === "festival" && (!formData.startDate || !formData.endDate)) {
      newErrors.startDate = "Ngày bắt đầu là bắt buộc cho festival";
      newErrors.endDate = "Ngày kết thúc là bắt buộc cho festival";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = { ...formData };
      if (!data.image) delete data.image;
      if (!data.maxDiscount) delete data.maxDiscount;
      if (!data.minSpending) delete data.minSpending;
      if (data.type !== 'member') delete data.membershipLevel;

      if (selectedDiscount) {
        await axios.put(`/api/discounts/${selectedDiscount._id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cập nhật khuyến mãi thành công');
      } else {
        await axios.post('/api/discounts', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Tạo khuyến mãi thành công');
      }
      fetchDiscounts();
      handleCloseModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenDeleteModal = (id) => {
    setDeleteDiscountId(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteDiscountId(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/discounts/${deleteDiscountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa khuyến mãi thành công');
      fetchDiscounts();
      handleCloseDeleteModal();
    } catch (error) {
      toast.error('Lỗi khi xóa khuyến mãi: ' + (error.response?.data?.message || error.message));
    }
  };

  const getHotelNames = (hotelIds) => {
    if (!hotelIds || hotelIds.length === 0) return 'Tất cả khách sạn';
    const names = hotelIds.map((id) => {
      const idStr = typeof id === 'object' && id._id ? id._id.toString() : id.toString();
      const hotel = hotels.find((h) => h._id?.toString() === idStr);
      return hotel ? hotel.name : id?.name || '(ID không tìm thấy)';

    });
    return names.length > 0 ? names.join(', ') : 'Không có khách sạn hợp lệ';
  };


  return (
    <div className="admin-discounts-container">
      <h2>Quản lý khuyến mãi</h2>
      <button className="add-button" onClick={() => handleOpenModal()}>
        Thêm khuyến mãi
      </button>

      {/* Bảng danh sách khuyến mãi */}
      <Table striped bordered hover className="discounts-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mã</th>
            <th>Loại</th>
            <th>Giảm giá</th>
            <th>Khách sạn áp dụng</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày kết thúc</th>
            <th>Chồng khuyến mãi</th>
            <th>Ảnh</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map((discount) => (
            <tr key={discount._id}>
              <td>{discount.name}</td>
              <td>{discount.code || '-'}</td>
              <td>{discount.type}</td>
              <td>
                {discount.discountType === 'percentage'
                  ? `${discount.discountValue}%`
                  : `${discount.discountValue} VND`}
              </td>
              <td>{getHotelNames(discount.applicableHotels)}</td>
              <td>{moment(discount.startDate).format('DD/MM/YYYY')}</td>
              <td>{moment(discount.endDate).format('DD/MM/YYYY')}</td>
              <td>{discount.isStackable ? 'Có' : 'Không'}</td>
              <td>
                {discount.image ? (
                  <img src={discount.image} alt={discount.name} style={{ width: "80px", borderRadius: "6px" }} />
                ) : "-"}
              </td>
              <td>
                <button
                  className="edit-button"
                  onClick={() => handleOpenModal(discount)}
                >
                  Sửa
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleOpenDeleteModal(discount._id)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal thêm/sửa khuyến mãi */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedDiscount ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="form-group">
              <Form.Label>Tên khuyến mãi</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Mã voucher (bắt buộc nếu là voucher)</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                disabled={formData.type !== 'voucher'}
                isInvalid={!!errors.code}
              />
              <Form.Control.Feedback type="invalid">{errors.code}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Loại khuyến mãi</Form.Label>
              <Form.Control
                as="select"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="voucher">Voucher</option>
                <option value="festival">Festival</option>
                <option value="member">Member</option>
                <option value="accumulated">Accumulated</option>
              </Form.Control>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Loại giảm giá</Form.Label>
              <Form.Control
                as="select"
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
              >
                <option value="percentage">Phần trăm</option>
                <option value="fixed">Cố định</option>
              </Form.Control>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Giá trị giảm giá</Form.Label>
              <Form.Control
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                isInvalid={!!errors.discountValue}
              />
              <Form.Control.Feedback type="invalid">{errors.discountValue}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Khách sạn áp dụng</Form.Label>
              <Form.Control
                as="select"
                multiple
                name="applicableHotels"
                value={formData.applicableHotels}
                onChange={handleHotelChange}
              >
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id.toString()}>
                    {hotel.name}
                  </option>
                ))}
              </Form.Control>
              <Form.Text className="text-muted">
                {formData.applicableHotels.length > 0
                  ? `Đã chọn: ${getHotelNames(formData.applicableHotels)}`
                  : 'Chưa chọn khách sạn nào, áp dụng cho tất cả khách sạn'}
              </Form.Text>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Ngày bắt đầu</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                isInvalid={!!errors.startDate}
              />
              <Form.Control.Feedback type="invalid">{errors.startDate}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Ngày kết thúc</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                isInvalid={!!errors.endDate}
              />
              <Form.Control.Feedback type="invalid">{errors.endDate}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Số tiền đặt phòng tối thiểu</Form.Label>
              <Form.Control
                type="number"
                name="minBookingAmount"
                value={formData.minBookingAmount}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>Giảm giá tối đa</Form.Label>
              <Form.Control
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount || ''}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Check
                type="checkbox"
                name="isStackable"
                label="Cho phép chồng khuyến mãi"
                checked={formData.isStackable}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Label>Ảnh khuyến mãi (URL)</Form.Label>
              <Form.Control
                type="text"
                name="image"
                value={formData.image || ""}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                (Ví dụ: https://example.com/banner.jpg)
              </Form.Text>
            </Form.Group>

            {formData.type === 'member' && (
              <Form.Group className="form-group">
                <Form.Label>Cấp độ thành viên</Form.Label>
                <Form.Control
                  as="select"
                  name="membershipLevel"
                  value={formData.membershipLevel || ''}
                  onChange={handleInputChange}
                  isInvalid={!!errors.membershipLevel}
                >
                  <option value="">Chọn cấp độ</option>
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                </Form.Control>
                <Form.Control.Feedback type="invalid">{errors.membershipLevel}</Form.Control.Feedback>
              </Form.Group>
            )}

            {formData.type === 'accumulated' && (
              <Form.Group className="form-group">
                <Form.Label>Chi tiêu tối thiểu</Form.Label>
                <Form.Control
                  type="number"
                  name="minSpending"
                  value={formData.minSpending || ''}
                  onChange={handleInputChange}
                  isInvalid={!!errors.minSpending}
                />
                <Form.Control.Feedback type="invalid">{errors.minSpending}</Form.Control.Feedback>
              </Form.Group>
            )}

            <div className="modal-footer">
              <Button variant="secondary" onClick={handleCloseModal}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Lưu
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xóa khuyến mãi này?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default AdminDiscounts;