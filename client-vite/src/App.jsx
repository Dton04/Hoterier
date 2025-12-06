import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { Toaster } from 'react-hot-toast';

import { Provider, useSelector } from 'react-redux';
import store from './redux/store';
import ChatBubble from './components/chat/ChatBubble';
import ChatBot from "./components/chatbot/ChatBot";
import UnifiedChat from "./components/chat/UnifiedChat";

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
import ProfileManagement from "./components/Profile/ProfileManagement";
import ProfileDetails from "./components/Profile/ProfileDetails";
import GoogleCallBack from "./screens/Auth/GoogleCallBack";
import FacebookCallBack from "./screens/Auth/FacebookCallBack";
import Membership from "./components/Membership";
import HotelResults from "./components/HotelResult/HotelResults";
import Rewards from "./components/Rewards";
import VerifyOTP from "./screens/Auth/VerifyOTP";
import PointsPage from './components/PointsPage';
import Favorites from './components/Favorites';
import HotelDetail from "./components/hoteldetail/HotelDetail";
import Review from "./screens/Review";
import DiscountsPage from "./screens/DiscountsPage";
import FestivalHotels from "./screens/FestivalHotels";



// Import Admin Screens
import AdminDashboard from "./components/GUI admin/Dashboards/AdminDashboard";
import StaffDashboard from "./components/GUI staff/StaffDashboard";
import StaffHotelManagement from "./components/GUI staff/StaffHotelManagement";
import StaffHotelRoomManagement from "./components/GUI staff/StaffHotelRoomManagement";
import StaffBookings from "./components/GUI staff/StaffBookings";
import StaffCreateHotel from "./components/GUI staff/StaffCreateHotel"; // ✅ Import Mới
import StaffChatPage from "./components/GUI staff/StaffChatPage"; // ✅ Import StaffChatPage
import UserStaffManagement from "./components/GUI admin/Users/UserStaffManagement";

import AdminBookings from "./components/GUI admin/Bookings/AdminBookings";
import HotelManagement from "./components/GUI admin/Hotels/HotelManagement";
import AdminApproveHotel from "./components/GUI admin/Hotels/AdminApproveHotel"; // ✅ Import Mới
import HotelRoomManagement from "./components/GUI admin/Hotels/HotelRoomManagement";
import ServiceManagement from "./components/GUI admin/Hotels/ServiceManagement";
import AdminDiscounts from "./components/GUI admin/Discounts/AdminDiscounts";
import AdminRewards from "./components/GUI admin/Discounts/AdminRewards";
import ReviewManagement from "./components/GUI admin/Bookings/ReviewManagement";
import AdminRegions from "./components/GUI admin/Regions/AdminRegions";
import AmenityManagement from "./components/GUI admin/Hotels/AmenityManagement";
import HotelServiceManagement from "./components/GUI admin/Hotels/HotelServiceManagement";
import AdminNotifications from "./components/GUI admin/Notifications/AdminNotifications";
import ChatHistoryAdmin from "./components/GUI admin/Chats/ChatHistoryAdmin";
import MyChatHistory from "./components/Pages/MyChatHistory";
import UserChatPage from "./components/Pages/UserChatPage";



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
  let userInfo = null;
  try {
    const raw = localStorage.getItem("userInfo");
    const parsed = raw ? JSON.parse(raw) : null;
    userInfo = parsed?.user || parsed;
  } catch { }
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
      <UnifiedChat />

      <Outlet />
    </main>
    <Footer />
    {/* Mount ChatBubble dùng Portal */}

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
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2500,
          style: { fontSize: "15px" }
        }}
      />
      <Router>
        <Routes>
          {/* === CÁC ROUTE CỦA NGƯỜI DÙNG === */}
          {/* Các route này sẽ tự động có Navbar và Footer */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Homescreen />} />
            <Route path="/home" element={<Homescreen />} />

            <Route path="/hotel-results" element={<HotelResults />} />

            {/* <Route path="/book/:roomid" element={<Bookingscreen />} /> */}

            <Route path="/ourteam" element={<OurTeam />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<Registerscreen />} />
            <Route path="/auth/google/callback" element={<GoogleCallBack />} />
            <Route path="/auth/facebook/callback" element={<FacebookCallBack />} />
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
            <Route path="/my-chat-history" element={<UserRoute><MyChatHistory /></UserRoute>} />
            <Route path="/chat" element={<UserRoute><UserChatPage /></UserRoute>} />
          </Route>


          {/* === CÁC ROUTE CỦA ADMIN === */}
          {/* Các route này sẽ tự động có AdminLayout */}
          <Route path="/admin" element={<AdminLayoutWrapper />}>
            <Route index element={<AdminDashboard />} /> {/* Trang mặc định khi vào /admin */}
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserStaffManagement />} />

            <Route path="bookings" element={<AdminBookings />} />
            <Route path="hotels" element={<HotelManagement />} />
            <Route path="approve-hotels" element={<AdminApproveHotel />} /> {/* ✅ Route Mới */}
            <Route path="hotel/:hotelId/rooms" element={<HotelRoomManagement />} />
            <Route path="hotel-services" element={<HotelServiceManagement />} />
            <Route path="services" element={<ServiceManagement />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="rewards" element={<AdminRewards />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="regions" element={<AdminRegions />} />
            <Route path="amenities" element={<AmenityManagement />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="chat-history" element={<ChatHistoryAdmin />} />
          </Route>

          {/* === CÁC ROUTE CỦA STAFF (tái sử dụng AdminLayout) === */}
          <Route path="/staff" element={
            <ProtectedRoute>
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            </ProtectedRoute>
          }>
            <Route index element={<StaffDashboard />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="hotels" element={<StaffHotelManagement />} />
            <Route path="create-hotel" element={<StaffCreateHotel />} /> {/* ✅ Route Mới */}
            <Route path="hotel/:hotelId/rooms" element={<StaffHotelRoomManagement />} />
            <Route path="bookings" element={<StaffBookings />} />
            <Route path="chat" element={<StaffChatPage />} />
          </Route>


          {/* === ROUTE RIÊNG CHO TRANG THANH TOÁN === */}
          <Route element={<BookingLayout />}>
            <Route path="/book/:roomid" element={<Bookingscreen />} />
            <Route path="/book/multi-room" element={<Bookingscreen />} />
          </Route>

        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
