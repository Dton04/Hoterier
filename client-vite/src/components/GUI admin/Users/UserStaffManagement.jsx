import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, message, Modal, Form, Select, Input as AntdInput } from "antd"; // Đổi tên Input để tránh trùng lặp
import Loader from "../../AlertMessage"; 
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiPlus } from 'react-icons/fi';
import defaultAvatar from "../../../assets/images/default-avatar.jpg";

const { Option } = Select;

const UserStaffManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Lấy userInfo một cách an toàn
  const getUserInfo = () => {
    try {
      const storedInfo = localStorage.getItem("userInfo");
      return storedInfo ? JSON.parse(storedInfo) : null;
    } catch (e) {
      return null;
    }
  };
  const userInfo = getUserInfo();

  // --- LOGIC (Không thay đổi, chỉ tối ưu hóa) ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = userInfo?.token;
      const response = await axios.get("/api/users/allusers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      message.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = userInfo?.user || userInfo;
    if (!userData || (userData.role !== "admin" && userData.role !== "staff")) {
      navigate("/", { replace: true });
      return;
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }
    if (searchText) {
      const lowercasedSearch = searchText.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(lowercasedSearch) ||
          u.email.toLowerCase().includes(lowercasedSearch)
      );
    }
    setFilteredUsers(result);
  }, [searchText, roleFilter, users]);
  
  const handleRemoveUser = async (id) => {
    try {
      await axios.delete(`/api/users/staff/${id}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      message.success("Xóa người dùng thành công");
      fetchUsers();
    } catch (error) {
      message.error("Xóa người dùng thất bại");
    }
  };

  const handleAddUser = async (values) => {
    try {
      const endpoint = values.role === "staff" ? "/api/users/staff" : "/api/users";
      await axios.post(endpoint, values, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      message.success(`Thêm ${values.role} thành công`);
      setIsAddModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Thêm người dùng thất bại");
    }
  };

  // --- GIAO DIỆN (Đã viết lại) ---
  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <img src={record.avatar || defaultAvatar} alt="avatar" className="h-10 w-10 rounded-full object-cover"/>
          <div>
            <p className="font-medium text-slate-800">{record.name}</p>
            <p className="text-sm text-gray-500">{record.email}</p>
          </div>
        </div>
      ),
    },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <p className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            role === "admin" ? "bg-purple-100 text-purple-600"
          : role === "staff" ? "bg-blue-100 text-blue-600"
          : "bg-green-100 text-green-600"
        }`}>
          {role}
        </p>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const userData = userInfo?.user || userInfo;
        if (userData?.role === 'admin' && record.role !== 'admin') {
            return <Button type="primary" danger onClick={() => handleRemoveUser(record._id)}>Remove</Button>;
        }
        return null; // Không hiển thị nút Remove cho chính admin hoặc khi staff xem
      },
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      {/* Breadcrumb và Tiêu đề */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý User & Staff</h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li><Link to="/admin/dashboard" className="font-medium">Dashboard /</Link></li>
            <li className="font-medium text-blue-600">Users</li>
          </ol>
        </nav>
      </div>

      {/* Bảng dữ liệu */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm sm:px-7.5">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-1/2">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-white pl-11 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Select
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              className="w-full md:w-40"
            >
              <Option value="all">Tất cả Role</Option>
              <Option value="user">User</Option>
              <Option value="staff">Staff</Option>
              <Option value="admin">Admin</Option>
            </Select>
            {(userInfo?.user?.role === 'admin' || userInfo?.role === 'admin') && (
              <Button type="primary" icon={<FiPlus />} onClick={() => setIsAddModalOpen(true)}>
                Add Account
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table
            dataSource={filteredUsers}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 8 }}
          />
        </div>
      </div>

      {/* Modal Thêm User/Staff */}
      <Modal title="Add New Account" open={isAddModalOpen} onCancel={() => setIsAddModalOpen(false)} footer={null} centered>
        <Form form={form} layout="vertical" onFinish={handleAddUser} className="p-4">
          <Form.Item label="Name" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
            <AntdInput placeholder="Full name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Vui lòng nhập email" }, { type: "email", message: "Email không hợp lệ" }]}>
            <AntdInput placeholder="Email address" />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}>
            <AntdInput placeholder="Phone number" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
            <AntdInput.Password placeholder="Password" />
          </Form.Item>
          <Form.Item label="Role" name="role" initialValue="user" rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}>
            <Select>
              <Option value="user">User</Option>
              <Option value="staff">Staff</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">Add Account</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserStaffManagement;