// src/components/SuggestionCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import Rating from 'react-rating';


function SuggestionCard({ room }) {
  const navigate = useNavigate();

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 1000000);
  };

  const handleBooking = () => {
    navigate(`/book/${room._id}`);
  };

  return (
    <div className="suggestion-card">
      <div className="suggestion-image">
        <img
          src={room.imageurls?.[0] || '/images/default-room.jpg'}
          alt={room.name}
          className="img-fluid"
          onError={(e) => {
            e.target.src = '/images/default-room.jpg';
          }}
        />
        <div className="suggestion-badge">{room.type}</div>
        <div className="suggestion-price-tag">{formatPriceVND(room.rentperday)}</div>
        <Alert variant="success" className="suggestion-status-alert">
          Còn phòng
        </Alert>
      </div>
      <div className="suggestion-content">
        <h3 className="suggestion-title">{room.name}</h3>
        <div className="suggestion-rating">
          <Rating
            readonly
            initialRating={room.averageRating?.average || 0}
            emptySymbol={<i className="far fa-star"></i>}
            fullSymbol={<i className="fas fa-star"></i>}
          />
          <span>({room.averageRating?.totalReviews || 0} đánh giá)</span>
        </div>
        <button className="btn-book" onClick={handleBooking}>
          Đặt ngay
        </button>
      </div>
    </div>
  );
}

export default SuggestionCard;