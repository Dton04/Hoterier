import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';


function CancelConfirmationModal({ show, onClose, onConfirmSuccess, bookingId, bookingDetails }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmCancel = async () => {
    try {
      setLoading(true);
      setError(null);
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      onConfirmSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi hủy đặt phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onClose} 
      centered 
      className="cancel-confirmation-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Xác nhận hủy đặt phòng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Bạn có chắc chắn muốn hủy đặt phòng này? 
          {bookingId && <span> (Mã đặt phòng: {bookingId})</span>}
        </p>
        {bookingDetails && (
          <div className="booking-details">
            <p><strong>Phòng:</strong> {bookingDetails.roomName || 'Không xác định'}</p>
            <p><strong>Ngày nhận phòng:</strong> {bookingDetails.checkin ? new Date(bookingDetails.checkin).toLocaleDateString('vi-VN') : 'Không xác định'}</p>
            <p><strong>Ngày trả phòng:</strong> {bookingDetails.checkout ? new Date(bookingDetails.checkout).toLocaleDateString('vi-VN') : 'Không xác định'}</p>
          </div>
        )}
        <p>Hành động này không thể hoàn tác.</p>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={onClose}
          className="btn-cancel"
          disabled={loading}
        >
          Hủy
        </Button>
        <Button 
          variant="danger" 
          onClick={handleConfirmCancel}
          className="btn-confirm"
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : 'Xác nhận'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CancelConfirmationModal;