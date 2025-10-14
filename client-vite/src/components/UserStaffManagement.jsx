import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, message, Input, Modal, Form, Select } from "antd";
import Loader from "./Loader";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

function UserStaffManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const [roleFilter, setRoleFilter] = useState("all");
  // 🔹 Lấy danh sách user
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users/allusers", {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      const data = response.data;
      setUsers(data);
      setFilteredUsers(
        searchText
          ? data.filter(
            (u) =>
              u.name.toLowerCase().includes(searchText.toLowerCase()) ||
              u.email.toLowerCase().includes(searchText.toLowerCase())
          )
          : data
      );
      setLoading(false);
    } catch (error) {
      message.error("Failed to fetch users");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo || (userInfo.role !== "admin" && userInfo.role !== "staff")) {
      navigate("/", { replace: true });
      return;
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (roleFilter === "all") setFilteredUsers(users);
    else setFilteredUsers(users.filter(u => u.role === roleFilter));
  }, [roleFilter, users]);

  // 🔹 Tìm kiếm
  const handleSearch = () => {
    const filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // 🔹 Xóa user/staff
  const handleRemoveUser = async (id) => {
    try {
      await axios.delete(`/api/users/staff/${id}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      message.success("User removed successfully");
      fetchUsers();
    } catch (error) {
      message.error("Failed to remove user");
    }
  };

  // 🔹 Thêm user/staff
  const handleAddUser = async (values) => {
    try {
      const endpoint =
        values.role === "staff" ? "/api/users/staff" : "/api/users";

      await axios.post(endpoint, values, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });

      message.success(
        `${values.role === "staff" ? "Staff" : "User"} added successfully`
      );
      setIsAddModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add user");
    }
  };

  // 🔹 Cấu hình bảng
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <span
          className={`px-2 py-1 rounded-md text-sm ${role === "admin"
            ? "bg-purple-100 text-purple-700"
            : role === "staff"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
            }`}
        >
          {role.toUpperCase()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.role !== "admin" && (
          <Button
            danger
            onClick={() => handleRemoveUser(record._id)}
            className="bg-red-500 hover:bg-red-600 text-blue-500"
          >
            Remove
          </Button>
        ),
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto mt-28 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
            👥 Users & Staff
          </h2>
          <div className="flex gap-2">
            <Select
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              className="w-40"
            >
              <Option value="all">All Roles</Option>
              <Option value="user">User</Option>
              <Option value="staff">Staff</Option>
            </Select>
            <Input
              placeholder="Search by name or email"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              className="w-64 border-gray-300 rounded-lg shadow-sm"
            />
            <Button
              type="primary"
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Search
            </Button>
            {userInfo.role === "admin" && (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                + Add Account
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4">
          <Table
            dataSource={filteredUsers}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 8 }}
          />
        </div>

        {/* 🔹 Modal thêm user/staff */}
        <Modal
          title="Add New Account"
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={null}
          centered
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddUser}
            className="p-2"
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Please enter name" }]}
            >
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Invalid email format" },
              ]}
            >
              <Input placeholder="Email address" />
            </Form.Item>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[{ required: true, message: "Please enter phone number" }]}
            >
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter password" }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            <Form.Item
              label="Role"
              name="role"
              initialValue="user"
              rules={[{ required: true, message: "Please select a role" }]}
            >
              <Select>
                <Option value="user">User</Option>
                <Option value="staff">Staff</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Add Account
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default UserStaffManagement;
