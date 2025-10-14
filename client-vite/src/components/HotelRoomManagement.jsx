import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';
import { useParams } from 'react-router-dom';


function HotelRoomManagement() {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    maxcount: '',
    beds: '',
    baths: '',
    phonenumber: '',
    quantity: '',
    rentperday: '',
    type: '',
    description: '',
    availabilityStatus: 'available',
    imageurls: [],
  });
  const [newImages, setNewImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchHotelAndRooms = async () => {
    try {
      const response = await axiosInstance.get(`/hotels/${hotelId}/rooms`);
      setHotel(response.data.hotel);
      setRooms(response.data.rooms);
    } catch (err) {
      setError('Lỗi khi lấy thông tin khách sạn hoặc danh sách phòng');
    }
  };

  useEffect(() => {
    fetchHotelAndRooms();
  }, [hotelId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = async (room) => {
    try {
      // Lấy đầy đủ thông tin phòng từ BE
      const roomRes = await axiosInstance.post('/rooms/getroombyid', { roomid: room._id });
      const imgRes = await axiosInstance.get(`/rooms/images/${room._id}`);

      setFormData({
        name: roomRes.data.name,
        maxcount: roomRes.data.maxcount,
        beds: roomRes.data.beds,
        baths: roomRes.data.baths,
        phonenumber: roomRes.data.phonenumber,
        quantity: roomRes.data.quantity || '',
        rentperday: roomRes.data.rentperday,
        type: roomRes.data.type,
        description: roomRes.data.description,
        availabilityStatus: roomRes.data.availabilityStatus,
        imageurls: imgRes.data.images || [],
      });
      setIsEditing(true);
      setEditId(room._id);
      setNewImages([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy thông tin phòng');
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    try {
      const imgId = imageUrl.split('/').pop();
      await axiosInstance.delete(`/rooms/${editId}/images/${imgId}`);
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
      const payload = { ...formData, hotelId };
      let savedRoom;
      if (isEditing) {
        const response = await axiosInstance.patch(`/rooms/${editId}`, payload);
        savedRoom = response.data.room;
        setSuccess('Cập nhật phòng thành công');
      } else {
        const response = await axiosInstance.post('/rooms', payload);
        savedRoom = response.data.room;
        setSuccess('Thêm phòng thành công');
      }
      if (newImages.length > 0) {
        const formDataImages = new FormData();
        newImages.forEach((image) => formDataImages.append('images', image));
        const imageResponse = await axiosInstance.post(`/rooms/${savedRoom._id}/images`, formDataImages, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormData((prev) => ({
          ...prev,
          imageurls: imageResponse.data.room.imageurls,
        }));
      }
      setFormData({
        name: '',
        maxcount: '',
        beds: '',
        quantity: '',
        baths: '',
        phonenumber: '',
        rentperday: '',
        type: '',
        description: '',
        availabilityStatus: 'available',
        imageurls: [],
      });
      setNewImages([]);
      setIsEditing(false);
      setEditId(null);
      fetchHotelAndRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu phòng');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa phòng này?')) {
      try {
        await axiosInstance.delete(`/rooms/${id}?hotelId=${hotelId}`);
        setSuccess('Xóa phòng thành công');
        fetchHotelAndRooms();
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi xóa phòng');
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2>Quản Lý Phòng - {hotel ? `${hotel.name} (${hotel.region?.name})` : 'Khách Sạn'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {hotel && (
        <div className="mb-4">
          <p><strong>Địa chỉ:</strong> {hotel.address}</p>
          <p><strong>Khu vực:</strong> {hotel.region?.name}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Tên phòng</label>
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
              <label className="form-label">Số người tối đa</label>
              <input
                type="number"
                className="form-control"
                name="maxcount"
                value={formData.maxcount}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Số giường</label>
              <input
                type="number"
                className="form-control"
                name="beds"
                value={formData.beds}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Số phòng tắm</label>
              <input
                type="number"
                className="form-control"
                name="baths"
                value={formData.baths}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="col-md-6">

            <div className="mb-3">
              <label className="form-label">Số lượng phòng</label>
              <input
                type="number"
                className="form-control"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Giá mỗi ngày</label>
              <input
                type="number"
                className="form-control"
                name="rentperday"
                value={formData.rentperday}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Loại phòng</label>
              <input
                type="text"
                className="form-control"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-control"
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleInputChange}
              >
                <option value="available">Có sẵn</option>
                <option value="maintenance">Bảo trì</option>
                <option value="busy">Đang sử dụng</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Ảnh phòng</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept="image/jpeg,image/png,image/gif"
                onChange={(e) => setNewImages(Array.from(e.target.files))}
              />
            </div>
            {isEditing && formData.imageurls.length > 0 && (
              <div className="mb-3">
                <label className="form-label">Ảnh hiện tại</label>
                <div className="image-preview">
                  {formData.imageurls.map((url, index) => (
                    <div key={index} className="image-container">
                      <img src={url} alt={`Room ${index}`} />
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
        </div>
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Cập nhật' : 'Thêm phòng'}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: '',
                maxcount: '',
                beds: '',
                quantity: '',
                baths: '',
                phonenumber: '',
                rentperday: '',
                type: '',
                description: '',
                availabilityStatus: 'available',
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

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Số người tối đa</th>
            <th>Số giường</th>
            <th>Số lượng phòng</th>
            <th>Số phòng tắm</th>
            <th>Giá/ngày</th>
            <th>Loại</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room._id}>
              <td>{room.name}</td>
              <td>{room.maxcount}</td>
              <td>{room.beds}</td>
              <td>{room.quantity}</td>
              <td>{room.baths}</td>
              <td>{room.rentperday}</td>
              <td>{room.type}</td>
              <td>{room.availabilityStatus}</td>
              <td>
                <button
                  className="btn btn-sm btn-warning me-2"
                  onClick={() => handleEdit(room)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(room._id)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HotelRoomManagement;