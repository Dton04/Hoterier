import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, message, Input } from 'antd';
import Loader from './Loader';
import Navbar from './Navbar';

import { useNavigate } from 'react-router-dom';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users/allusers', {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      const userData = response.data;
      setUsers(userData);
      // Áp dụng bộ lọc tìm kiếm nếu có searchText
      if (searchText) {
        const filtered = userData.filter(
          (user) =>
            user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers(userData);
      }
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch user list');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchText) {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  useEffect(() => {
    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'staff')) {
      navigate('/', { replace: true });
      return;
    }

    fetchUsers();
  }, [userInfo, navigate]);

  const handleRemoveUser = async (userId) => {
    try {
      await axios.delete(`/api/users/staff/${userId}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      message.success('User removed successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to remove user');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <div>
          <Button type="danger" onClick={() => handleRemoveUser(record._id)}>
            Remove
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loader />;

  return (
    <div>
      <Navbar />
      <div className="user-management" style={{ marginTop: '120px' }}>
        <div>
          <h2>User List</h2>
          <Input
            placeholder="Search by name or email"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)} // Chỉ cập nhật searchText
            onPressEnter={handleSearch} // Tìm kiếm khi nhấn Enter
            style={{ width: 200, marginBottom: '1rem' }}
          />
        </div>
        <Table dataSource={filteredUsers} columns={columns} rowKey="_id" />
      </div>
    </div>
  );
}

export default UserManagement;