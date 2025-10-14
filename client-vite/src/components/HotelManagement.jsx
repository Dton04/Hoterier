
import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';
import { Link } from 'react-router-dom';


function HotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    region: '',
    contactNumber: '',
    email: '',
    description: '',
    rooms: [],
    imageurls: [],
  });
  const [newImages, setNewImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy danh sách khách sạn
  const fetchHotels = async () => {
    try {
      const response = await axiosInstance.get('/hotels');
      setHotels(response.data);
    } catch (err) {
      setError('Lỗi khi lấy danh sách khách sạn');
    }
  };

  // Lấy danh sách khu vực
  const fetchRegions = async () => {
    try {
      const response = await axiosInstance.get('/regions');
      setRegions(response.data);
    } catch (err) {
      setError('Lỗi khi lấy danh sách khu vực');
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchRegions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    try {
      const imgId = imageUrl.split('/').pop();
      await axiosInstance.delete(`/hotels/${editId}/images/${imgId}`);
      setFormData({
        ...formData,
        imageurls: formData.imageurls.filter((url) => url !== imageUrl),
      });
      setSuccess('Xóa ảnh thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa ảnh');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedHotel;
      const payload = { ...formData, rooms: formData.rooms || [] };
      if (isEditing) {
        const response = await axiosInstance.put(`/hotels/${editId}`, payload);
        savedHotel = response.data.hotel;
        setSuccess('Cập nhật khách sạn thành công');
      } else {
        const response = await axiosInstance.post('/hotels', payload);
        savedHotel = response.data.hotel;
        setSuccess('Thêm khách sạn thành công');
      }

      if (newImages.length > 0) {
        const formDataImages = new FormData();
        newImages.forEach((image) => formDataImages.append('images', image));
        const imageResponse = await axiosInstance.post(`/hotels/${savedHotel._id}/images`, formDataImages, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormData((prev) => ({
          ...prev,
          imageurls: imageResponse.data.hotel.imageurls,
        }));
      }

      setFormData({
        name: '',
        address: '',
        region: '',
        contactNumber: '',
        email: '',
        description: '',
        rooms: [],
        imageurls: [],
      });
      setNewImages([]);
      setIsEditing(false);
      setEditId(null);
      fetchHotels();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu khách sạn');
    }
  };

  const handleEdit = async (hotel) => {
    try {
      setFormData({
        name: hotel.name,
        address: hotel.address,
        region: hotel.region?._id || '',
        contactNumber: hotel.contactNumber,
        email: hotel.email,
        description: hotel.description,
        rooms: hotel.rooms,
        imageurls: hotel.imageurls || [],
      });
      setIsEditing(true);
      setEditId(hotel._id);
      setNewImages([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy thông tin khách sạn');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khách sạn này?')) {
      try {
        await axiosInstance.delete(`/hotels/${id}`);
        setSuccess('Xóa khách sạn thành công');
        fetchHotels();
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi xóa khách sạn');
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2>Quản Lý Khách Sạn</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form thêm/sửa khách sạn */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Tên khách sạn</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Địa chỉ</label>
              <input
                type="text"
                className="form-control"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Khu vực</label>
              <select
                className="form-control"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn khu vực</option>
                {regions.map((region) => (
                  <option key={region._id} value={region._id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Ảnh khách sạn</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageChange}
              />
            </div>
            {isEditing && formData.imageurls.length > 0 && (
              <div className="mb-3">
                <label className="form-label">Ảnh hiện tại</label>
                <div className="image-preview">
                  {formData.imageurls.map((url, index) => (
                    <div key={index} className="image-container">
                      <img src={url} alt={`Khách sạn ${index}`} />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteImage(url)}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                className="form-control"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Cập nhật' : 'Thêm khách sạn'}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: '',
                address: '',
                region: '',
                contactNumber: '',
                email: '',
                description: '',
                rooms: [],
                imageurls: [],
              });
              setNewImages([]);
              setEditId(null);
            }}
          >
            Hủy
          </button>
        )}
      </form>

      {/* Danh sách khách sạn */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Địa chỉ</th>
            <th>Khu vực</th>
            <th>Số điện thoại</th>
            <th>Email</th>
            <th>Ảnh</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((hotel) => (
            <tr key={hotel._id}>
              <td>{hotel.name}</td>
              <td>{hotel.address}</td>
              <td>{hotel.region?.name || 'Không xác định'}</td>
              <td>{hotel.contactNumber}</td>
              <td>{hotel.email}</td>
              <td>
                {hotel.imageurls && hotel.imageurls.length > 0 ? (
                  <div className="image-preview">
                    {hotel.imageurls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Khách sạn ${index}`}
                        style={{ width: '50px', height: '50px', marginRight: '5px' }}
                      />
                    ))}
                  </div>
                ) : (
                  'Không có ảnh'
                )}
              </td>
              <td>
                <button
                  className="btn btn-sm btn-warning me-2"
                  onClick={() => handleEdit(hotel)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-danger me-2"
                  onClick={() => handleDelete(hotel._id)}
                >
                  Xóa
                </button>
                <Link
                  to={`/admin/hotel/${hotel._id}/rooms`}
                  className="btn btn-sm btn-info mt-2"
                >
                  Quản lý phòng
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HotelManagement;
