import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Modal, Form, Select, Input as AntdInput } from "antd";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState("all");
  
  const getUserInfo = () => {
    try {
      const storedInfo = localStorage.getItem("userInfo");
      return storedInfo ? JSON.parse(storedInfo) : null;
    } catch (e) {
      return null;
    }
  };
  const userInfo = getUserInfo();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = userInfo?.token;
      const response = await axios.get("/api/users/allusers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
      toast.success("Tải danh sách người dùng thành công!");
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng. Vui lòng thử lại!");
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = userInfo?.user || userInfo;
    if (!userData || (userData.role !== "admin" && userData.role !== "staff")) {
      toast.warning("Bạn không có quyền truy cập trang này!");
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
  
  const showDeleteConfirm = (id) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteOk = async () => {
    if (userToDelete) {
      try {
        // Thông báo đang xử lý
        const loadingToast = toast.loading("Đang xóa người dùng...");
        
        await axios.delete(`/api/users/staff/${userToDelete}`, {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        });
        
        // Dismiss loading toast và hiển thị success
        toast.dismiss(loadingToast);
        toast.success("🗑️ Đã xóa người dùng thành công!");
        
        fetchUsers();
      } catch (error) {
        toast.error(`❌ Xóa người dùng thất bại: ${error.response?.data?.message || "Lỗi không xác định"}`);
        console.error("Delete user error:", error);
      }
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    toast.info("Đã hủy thao tác xóa");
  };

  const handleRemoveUser = async (id) => {
    showDeleteConfirm(id);
  };

  const handleAddUser = async (values) => {
    try {
      // Thông báo đang xử lý
      const loadingToast = toast.loading("Đang thêm tài khoản mới...");
      
      const endpoint = values.role === "staff" ? "/api/users/staff" : "/api/users";
      await axios.post(endpoint, values, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      
      // Dismiss loading toast và hiển thị success
      toast.dismiss(loadingToast);
      toast.success(`✅ Đã thêm ${values.role === "staff" ? "nhân viên" : "người dùng"} "${values.name}" thành công!`);
      
      setIsAddModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      toast.error(`❌ Thêm người dùng thất bại: ${error.response?.data?.message || "Vui lòng kiểm tra lại thông tin"}`);
      console.error("Add user error:", error);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    toast.info("📝 Điền thông tin để thêm tài khoản mới");
  };

  const handleCancelAddModal = () => {
    setIsAddModalOpen(false);
    form.resetFields();
    toast.info("Đã hủy thêm tài khoản");
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    const roleNames = {
      all: "Tất cả",
      user: "User",
      staff: "Staff",
      admin: "Admin"
    };
    toast.info(`🔍 Đang hiển thị: ${roleNames[value]}`);
  };

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
        return null;
      },
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý User & Staff</h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li><Link to="/admin/dashboard" className="font-medium">Dashboard /</Link></li>
            <li className="font-medium text-blue-600">Users</li>
          </ol>
        </nav>
      </div>

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
              onChange={handleRoleFilterChange}
              className="w-full md:w-40"
            >
              <Option value="all">Tất cả Role</Option>
              <Option value="user">User</Option>
              <Option value="staff">Staff</Option>
              <Option value="admin">Admin</Option>
            </Select>
            {(userInfo?.user?.role === 'admin' || userInfo?.role === 'admin') && (
              <Button type="primary" icon={<FiPlus />} onClick={handleOpenAddModal}>
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

      <Modal 
        title="Add New Account" 
        open={isAddModalOpen} 
        onCancel={handleCancelAddModal} 
        footer={null} 
        centered
      >
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

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteOk}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        centered
      >
        <p>Bạn có chắc muốn xóa người dùng này?</p>
      </Modal>
    </div>
  );
}

export default UserStaffManagement;