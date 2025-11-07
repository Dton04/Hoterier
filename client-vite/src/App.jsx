import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Provider } from 'react-redux';
import store from './redux/store';

// Import Layouts
import AdminLayout from "./components/admin dashboard/AdminLayout";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Import Screens & Components
import Homescreen from "./screens/Homescreen";

import Bookingscreen from "./screens/Booking/Bookingscreen";
import OurTeam from "./components/Pages/OurTeam";
import Contact from "./components/Contact";
import Registerscreen from "./screens/Auth/Registerscreen";
import LoginScreen from "./screens/Auth/Loginscreen";
import HistoryBookings from "./components/HistoryBookings";
import ProfileManagement from "./components/ProfileManagement";
import ProfileDetails from "./components/ProfileDetails";
import GoogleCallBack from "./screens/Auth/GoogleCallBack";
import FacebookCallBack from "./screens/Auth/FacebookCallBack";
import Membership from "./components/Membership";
import RoomResults from "./components/RoomResults";
import Rewards from "./components/Rewards";
import VNPaySuccess from "./components/VNPaySuccess";
import VerifyOTP from "./screens/Auth/VerifyOTP";
import PointsPage from './components/PointsPage';
import Favorites from './components/Favorites';
import HotelDetail from "./components/hoteldetail/HotelDetail";
import Review from "./screens/Review";
import DiscountsPage from "./screens/DiscountsPage";
import FestivalHotels from "./screens/FestivalHotels";

import ChatBot from "./components/chatbot/ChatBot";

// Import Admin Screens
import AdminDashboard from "./components/GUI admin/Dashboards/AdminDashboard";
import UserStaffManagement from "./components/GUI admin/Users/UserStaffManagement";

import AdminBookings from "./components/GUI admin/Bookings/AdminBookings";
import HotelManagement from "./components/GUI admin/Hotels/HotelManagement";
import HotelRoomManagement from "./components/GUI admin/Hotels/HotelRoomManagement";
import ServiceManagement from "./components/GUI admin/Hotels/ServiceManagement";
import AdminDiscounts from "./components/GUI admin/Discounts/AdminDiscounts";
import AdminRewards from "./components/GUI admin/Discounts/AdminRewards";
import ReviewManagement from "./components/GUI admin/Bookings/ReviewManagement";
import AdminRegions from "./components/GUI admin/Regions/AdminRegions";
import AmenityManagement from "./components/GUI admin/Hotels/AmenityManagement";
import HotelServiceManagement from "./components/GUI admin/Hotels/HotelServiceManagement";
import CreateRoomForm from "./components/CreateRoomForm";
import EditRoomForm from "./components/EditRoomForm";



// --- CÁC COMPONENT BẢO VỆ ROUTE (Sử dụng logic của file gốc) ---
const AdminRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  // Sử dụng logic kiểm tra 'isAdmin' cho tương thích
  return userInfo && userInfo.isAdmin ? children : <Navigate to="/" replace />;
};

const ProtectedRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  // Giữ lại logic kiểm tra 'role' cho staff nếu cần
  return userInfo && (userInfo.isAdmin || userInfo.role === "staff") ? children : <Navigate to="/" replace />;
};

const UserRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  return userInfo ? children : <Navigate to="/login" replace />;
};


// --- CÁC COMPONENT WRAPPER CHO LAYOUT ---


// Layout riêng cho trang đặt phòng (không Navbar, Footer, ChatBot)
const BookingLayout = () => (
<>
    <Navbar />
  <main className="bg-gray-50 min-h-screen">
    <Outlet />
  </main>
  </>
);


// Layout cho người dùng (có Navbar và Footer)
const UserLayout = () => (
  <>
    <Navbar />
    {/* Outlet là nơi các trang con của người dùng sẽ hiển thị */}
    <main className="pt-[70px] bg-gray-50 min-h-screen">


      <ChatBot />
      <Outlet />
    </main>
    <Footer />
  </>
);

// Layout cho Admin (chỉ có AdminLayout)
const AdminLayoutWrapper = () => (
  <AdminRoute>
    <AdminLayout>
      <Outlet /> {/* Các trang con của admin sẽ hiển thị ở đây */}
    </AdminLayout>
  </AdminRoute>
);


function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* === CÁC ROUTE CỦA NGƯỜI DÙNG === */}
          {/* Các route này sẽ tự động có Navbar và Footer */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Homescreen />} />
            <Route path="/home" element={<Homescreen />} />

            <Route path="/hotel-results" element={<RoomResults />} />

            {/* <Route path="/book/:roomid" element={<Bookingscreen />} /> */}

            <Route path="/ourteam" element={<OurTeam />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<Registerscreen />} />
            <Route path="/auth/google/callback" element={<GoogleCallBack />} />
            <Route path="/auth/facebook/callback" element={<FacebookCallBack />} />
            <Route path="/booking-success" element={<VNPaySuccess />} />
            <Route path="/hotel/:id" element={<HotelDetail />} />
            <Route path="/festival/:id" element={<FestivalHotels />} />
            <Route path="/discounts" element={<DiscountsPage />} />

            <Route path="/verify-otp" element={<VerifyOTP />} />

            {/* Các route cần đăng nhập của người dùng */}
            <Route path="/bookings" element={<UserRoute><HistoryBookings /></UserRoute>} />
            <Route path="/profile" element={<UserRoute><ProfileManagement /></UserRoute>} />
            <Route path="/profile/details" element={<UserRoute><ProfileDetails /></UserRoute>} />
            <Route path="/membership" element={<UserRoute><Membership /></UserRoute>} />
            <Route path="/rewards" element={<UserRoute><Rewards /></UserRoute>} />
            <Route path="/points" element={<UserRoute><PointsPage /></UserRoute>} />
            <Route path="/favorites" element={<UserRoute><Favorites /></UserRoute>} />
            <Route path="/reviews" element={<UserRoute><Review /></UserRoute>} />
          </Route>


          {/* === CÁC ROUTE CỦA ADMIN === */}
          {/* Các route này sẽ tự động có AdminLayout */}
          <Route path="/admin" element={<AdminLayoutWrapper />}>
            <Route index element={<AdminDashboard />} /> {/* Trang mặc định khi vào /admin */}
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserStaffManagement />} />

            <Route path="bookings" element={<AdminBookings />} />
            <Route path="hotels" element={<HotelManagement />} />
            <Route path="hotel/:hotelId/rooms" element={<HotelRoomManagement />} />
            <Route path="hotel-services" element={<HotelServiceManagement />} />
            <Route path="services" element={<ServiceManagement />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="rewards" element={<AdminRewards />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="regions" element={<AdminRegions />} />
            <Route path="amenities" element={<AmenityManagement />} />
            {/* Đã gỡ 2 route cũ ngoài Admin */}
            {/* <Route path="createroom" element={<CreateRoomForm />} /> */}
            {/* <Route path="editroom/:id" element={<EditRoomForm />} /> */}
          </Route>


          {/* === ROUTE RIÊNG CHO TRANG THANH TOÁN === */}
          <Route element={<BookingLayout />}>
            <Route path="/book/:roomid" element={<Bookingscreen />} />
          </Route>

        </Routes>
      </Router>
    </Provider>
  );
}

export default App;