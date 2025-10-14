import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';

const AlertMessage = ({ type, message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Tự động ẩn sau 3 giây
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <Alert
      variant={type === 'success' ? 'success' : 'danger'}
      onClose={onClose}
      dismissible
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1050,
        minWidth: '300px',
      }}
    >
      {message}
    </Alert>
  );
};

export default AlertMessage;