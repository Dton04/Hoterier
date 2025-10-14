import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, message, Input } from 'antd';
import Loader from './Loader';
import Navbar from './Navbar';

import { useNavigate } from 'react-router-dom';

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/users/staff', {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      const staffData = response.data;
      setStaff(staffData);
      // Áp dụng bộ lọc tìm kiếm nếu có searchText
      if (searchText) {
        const filtered = staffData.filter(
          (staffMember) =>
            staffMember.name.toLowerCase().includes(searchText.toLowerCase()) ||
            staffMember.email.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredStaff(filtered);
      } else {
        setFilteredStaff(staffData);
      }
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch staff list');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchText) {
      const filtered = staff.filter(
        (staffMember) =>
          staffMember.name.toLowerCase().includes(searchText.toLowerCase()) ||
          staffMember.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  };

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    fetchStaff();
  }, [userInfo, navigate]);

  const handleCreateStaff = async (values) => {
    try {
      const trimmedValues = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
      };

      await axios.post('/api/users/staff', trimmedValues, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      message.success('Staff created successfully');
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchStaff();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create staff');
    }
  };

  const handleEditStaff = async (values) => {
    try {
      const trimmedValues = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
      };

      await axios.put(`/api/users/staff/${selectedStaff._id}`, trimmedValues, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      message.success('Staff updated successfully');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setSelectedStaff(null);
      fetchStaff();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update staff');
    }
  };

  const handleRemoveStaff = async (userId) => {
    try {
      await axios.delete(`/api/users/staff/${userId}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      message.success('Staff removed successfully');
      fetchStaff();
    } catch (error) {
      message.error('Failed to remove staff');
    }
  };

  const openEditModal = (record) => {
    setSelectedStaff(record);
    editForm.setFieldsValue({
      name: record.name,
      email: record.email,
      password: '',
    });
    setIsEditModalVisible(true);
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
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <div>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Button type="danger" onClick={() => handleRemoveStaff(record._id)}>
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
      <div className="staff-management" style={{ marginTop: '100px' }}>
        <div>
          <h2>Staff List</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Input
              placeholder="Search by name or email"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)} // Chỉ cập nhật searchText, không tìm kiếm ngay
              onPressEnter={handleSearch} // Tìm kiếm khi nhấn Enter
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={() => setIsAddModalVisible(true)}>
              Add New Staff
            </Button>
          </div>
        </div>
        <Table dataSource={filteredStaff} columns={columns} rowKey="_id" />

        {/* Modal Thêm Staff */}
        <Modal
          title="Add New Staff"
          visible={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          footer={null}
        >
          <Form form={addForm} onFinish={handleCreateStaff}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please input staff name!' }]}
            >
              <input type="text" placeholder="Staff Name" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input staff email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <input type="email" placeholder="Staff Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input password!' }]}
            >
              <input type="password" placeholder="Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Create Staff
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal Chỉnh sửa Staff */}
        <Modal
          title="Edit Staff"
          visible={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false);
            setSelectedStaff(null);
          }}
          footer={null}
        >
          <Form form={editForm} onFinish={handleEditStaff}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please input staff name!' }]}
            >
              <input type="text" placeholder="Staff Name" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input staff email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <input type="email" placeholder="Staff Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: false, message: 'Please input new password!' }]}
            >
              <input type="password" placeholder="New Password (optional)" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Update Staff
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default StaffManagement;