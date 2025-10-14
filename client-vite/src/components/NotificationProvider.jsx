import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-bootstrap';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications([...notifications, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
        {notifications.map((notification) => (
          <Alert key={notification.id} variant={notification.type}>
            {notification.message}
          </Alert>
        ))}
      </div>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}