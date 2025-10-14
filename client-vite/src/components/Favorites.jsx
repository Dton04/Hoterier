// Favorites.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Room from './Room';
import { Container, Alert, Spinner } from 'react-bootstrap';


function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
          setError('Vui lòng đăng nhập để xem danh sách yêu thích');
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        const response = await axios.get('/api/favorites', config);
        setFavorites(response.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Lỗi khi tải danh sách yêu thích');
        toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách yêu thích');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  return (
    <section className="rooms-content py-5 bg-light">
      <Container>
        <div className="rooms-header text-center mb-5">
          <h2 className="subtitle text-uppercase mb-2">Phòng Yêu Thích</h2>
          <h1 className="title mb-3">
            Danh sách <span className="text-primary">phòng yêu thích</span> của bạn
          </h1>
          <p className="description text-muted">
            Xem lại những phòng bạn đã yêu thích để dễ dàng đặt phòng sau này
          </p>
        </div>

        {loading ? (
          <div className="loading">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách phòng yêu thích...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            <i className="fas fa-exclamation-triangle fa-2x"></i>
            <p className="mt-2">{error}</p>
          </Alert>
        ) : favorites.length > 0 ? (
          <div className="room-grid mt-4">
            {favorites.map((room) => (
              <Room
                key={room._id}
                room={{
                  ...room,
                  hotelId: room.hotelId?._id || '' // Kiểm tra hotelId, nếu undefined thì trả về chuỗi rỗng
                }}
              />
            ))}
          </div>
        ) : (
          <div className="no-favorites text-center">
            <p className="text-muted">Bạn chưa có phòng nào trong danh sách yêu thích.</p>
          </div>
        )}
      </Container>
    </section>
  );
}

export default Favorites;