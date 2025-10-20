
// import React, { useState, useEffect, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useLocation } from "react-router-dom";
// import axios from "axios";
// import { useForm } from "react-hook-form";
// import * as yup from "yup";
// import { yupResolver } from "@hookform/resolvers/yup";

// import Loader from "../components/Loader";
// import CancelConfirmationModal from "../components/CancelConfirmationModal";
// import SuggestionCard from "../components/SuggestionCard";
// import AlertMessage from "../components/AlertMessage";
// import { Carousel } from "react-bootstrap";

// // // Định nghĩa danh sách dịch vụ có sẵn
// // const availableServices = [
// //   { id: "breakfast", name: "Bữa sáng", price: 100000 },
// //   { id: "airport_shuttle", name: "Đưa đón sân bay", price: 500000 },
// //   { id: "spa", name: "Dịch vụ spa", price: 300000 },
// //   { id: "room_service", name: "Dịch vụ phòng", price: 200000 },
// // ];

// // Định nghĩa schema xác thực
// const bookingSchema = yup.object().shape({
//   name: yup.string().required("Vui lòng nhập họ và tên").min(2, "Tên phải có ít nhất 2 ký tự"),
//   email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
//   phone: yup.string().required("Vui lòng nhập số điện thoại"),
//   checkin: yup.date().required("Vui lòng chọn ngày nhận phòng"),
//   checkout: yup
//     .date()
//     .required("Vui lòng chọn ngày trả phòng")
//     .min(yup.ref("checkin"), "Ngày trả phòng phải sau ngày nhận phòng"),
//   adults: yup.number().required("Vui lòng chọn số người lớn").min(1, "Phải có ít nhất 1 người lớn"),
//   children: yup.number().default(0),
//   roomType: yup.string().required("Vui lòng chọn loại phòng"),
//   specialRequest: yup.string().nullable(),
//   paymentMethod: yup
//     .string()
//     .required("Vui lòng chọn phương thức thanh toán")
//     .oneOf(["cash", "credit_card", "bank_transfer", "mobile_payment", "vnpay"], "Phương thức thanh toán không hợp lệ"),
//   discountCode: yup.string().nullable(),
//   diningServices: yup.array().of(yup.string()).nullable(),
// });

// function Bookingscreen() {
//   const { roomid } = useParams();
//   const navigate = useNavigate();
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     getValues,
//   } = useForm({
//     resolver: yupResolver(bookingSchema),
//     defaultValues: {
//       name: "",
//       email: "",
//       phone: "",
//       checkin: "",
//       checkout: "",
//       adults: 1,
//       children: 0,
//       roomType: "",
//       specialRequest: "",
//       paymentMethod: "cash",
//       discountCode: "",
//       diningServices: [],
//     },
//   });

//   const [loading, setLoading] = useState(true);
//   const [room, setRoom] = useState(null);
//   const [error, setError] = useState(false);
//   const [bookingStatus, setBookingStatus] = useState(null);
//   const [paymentStatus, setPaymentStatus] = useState(null);
//   const [bankInfo, setBankInfo] = useState(null);
//   const [bookingId, setBookingId] = useState(null);
//   const [timeRemaining, setTimeRemaining] = useState(null);
//   const [paymentExpired, setPaymentExpired] = useState(false);
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [newBookingId, setNewBookingId] = useState(null);
//   const [suggestions, setSuggestions] = useState([]);
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const [bookingDetails, setBookingDetails] = useState(null);
//   const [pointsEarned, setPointsEarned] = useState(null);
//   const [discountCode, setDiscountCode] = useState("");
//   const [discountResult, setDiscountResult] = useState(null);
//   const [totalAmount, setTotalAmount] = useState(null);
//   const [selectedServices, setSelectedServices] = useState([]); // State để lưu dịch vụ được chọn
//   const [availableServices, setAvailableServices] = useState([]);
//   const [roomsNeeded, setRoomsNeeded] = useState(1);
//   const location = useLocation();
//   const festival = location.state?.festival || JSON.parse(localStorage.getItem("festival")) || null;


//   // Hàm xử lý chọn dịch vụ
//   const handleServiceChange = (serviceId) => {
//     setSelectedServices((prev) =>
//       prev.includes(serviceId)
//         ? prev.filter((id) => id !== serviceId)
//         : [...prev, serviceId]
//     );
//   };

//   // Hàm tính tổng chi phí dịch vụ
//   const calculateServiceCost = () => {
//     return selectedServices.reduce((total, serviceId) => {
//       const service = availableServices.find((s) => s._id === serviceId);
//       return total + (service ? service.price : 0);
//     }, 0);
//   };
//   // Hàm lấy gợi ý phòng
//   const fetchSuggestions = useCallback(async (roomId, roomType) => {
//     try {
//       setLoadingSuggestions(true);
//       const response = await axios.get("/api/rooms/suggestions", {
//         params: { roomId, roomType },
//       });
//       setSuggestions(response.data);
//     } catch (error) {
//       console.error("Lỗi khi lấy phòng gợi ý:", error);
//     } finally {
//       setLoadingSuggestions(false);
//     }
//   }, []);

//   // Hàm lấy dữ liệu phòng
//   const fetchRoomData = useCallback(async () => {
//     window.scrollTo({ top: 0, behavior: "smooth" });
//     try {
//       setLoading(true);
//       const { data } = await axios.post("/api/rooms/getroombyid", { roomid });

//       // Nếu có festival, áp dụng giảm giá tự động
//       let adjustedRoom = { ...data };
//       if (festival && festival.discountType && festival.discountValue) {
//         adjustedRoom.originalRentperday = adjustedRoom.rentperday;

//         if (festival.discountType === "percentage") {
//           adjustedRoom.rentperday = Math.round(
//             adjustedRoom.rentperday * (1 - festival.discountValue / 100)
//           );
//           adjustedRoom.discountApplied = `${festival.discountValue}%`;
//         } else if (festival.discountType === "fixed") {
//           adjustedRoom.rentperday = Math.max(0, adjustedRoom.rentperday - festival.discountValue);
//           adjustedRoom.discountApplied = `${festival.discountValue.toLocaleString()} VND`;
//         }
//       }

//       setRoom(adjustedRoom);
//       setValue("roomType", adjustedRoom.type || "");
//       if (adjustedRoom.availabilityStatus !== "available") {
//         await fetchSuggestions(adjustedRoom._id, adjustedRoom.type);
//       }
//       // Tính tổng tiền ban đầu (chưa bao gồm dịch vụ)
//       const checkin = new Date(adjustedRoom.checkin || new Date());
//       const checkout = new Date(adjustedRoom.checkout || new Date());
//       const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
//       setTotalAmount(adjustedRoom.rentperday * days);
//     } catch (error) {
//       setError(true);
//     } finally {
//       setLoading(false);
//     }
//   }, [roomid, setValue, festival, fetchSuggestions]);


//   const accumulatePoints = useCallback(async (bookingId) => {
//     try {
//       const userInfo = JSON.parse(localStorage.getItem("userInfo"));
//       if (!userInfo || !userInfo.token) {
//         return { success: false, message: "Vui lòng đăng nhập để tích điểm" };
//       }

//       const config = {
//         headers: { Authorization: `Bearer ${userInfo.token}` },
//       };

//       const bookingCheck = await axios.get(`/api/bookings/${bookingId}`, config);
//       if (bookingCheck.data.status !== "confirmed" || bookingCheck.data.paymentStatus !== "paid") {
//         return { success: false, message: "Đặt phòng chưa đủ điều kiện để tích điểm" };
//       }

//       const response = await axios.post("/api/bookings/checkout", { bookingId }, config);
//       return {
//         success: true,
//         pointsEarned: response.data.pointsEarned,
//         totalPoints: response.data.totalPoints,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Lỗi khi tích điểm",
//       };
//     }
//   }, []);

//   // Hàm áp dụng mã giảm giá
//   const applyDiscountCode = async () => {
//     try {
//       setLoading(true);
//       setBookingStatus(null);

//       const userInfo = JSON.parse(localStorage.getItem("userInfo"));
//       const bookingData = {
//         roomid,
//         checkin: new Date(document.getElementById("checkin").value),
//         checkout: new Date(document.getElementById("checkout").value),
//         userId: userInfo?.id,
//       };
//       const identifiers = [discountCode];

//       const response = await axios.post("/api/discounts/apply", {
//         bookingData,
//         identifiers,
//       });

//       setDiscountResult(response.data);
//       setTotalAmount(response.data.totalAmount + calculateServiceCost()); // Cộng thêm chi phí dịch vụ
//       setBookingStatus({
//         type: "success",
//         message: `Áp dụng mã giảm giá thành công! Tổng giảm: ${response.data.appliedDiscounts.reduce(
//           (sum, d) => sum + d.discount,
//           0
//         ).toLocaleString()} VND`,
//       });
//     } catch (error) {
//       setDiscountResult(null);
//       setBookingStatus({
//         type: "error",
//         message: error.response?.data?.message || "Lỗi khi áp dụng mã giảm giá. Vui lòng kiểm tra lại mã.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRoomData();
//   }, [fetchRoomData]);

//   useEffect(() => {
//     const fetchServices = async () => {
//       try {
//         if (!room?.hotelId) return;
//         const response = await axios.get(`/api/services/hotel/${room.hotelId}`);
//         setAvailableServices(response.data || []);
//       } catch (error) {
//         console.error("Lỗi khi lấy danh sách dịch vụ:", error);
//       }
//     };

//     fetchServices();
//   }, [room]);


//   // Tách riêng effect xử lý user info và location state
//   useEffect(() => {
//     // Lấy thông tin từ user đã đăng nhập
//     const userInfo = JSON.parse(localStorage.getItem("userInfo"));
//     if (userInfo) {
//       setValue("name", userInfo.name || "");
//       setValue("email", userInfo.email || "");
//       setValue("phone", userInfo.phone || "");
//     }

//     // Ưu tiên lấy từ location state
//     const locationState = window.history.state?.usr;

//     if (locationState) {
//       setValue("checkin", formatDate(locationState.checkin));
//       setValue("checkout", formatDate(locationState.checkout));
//       setValue("adults", locationState.adults || 2);
//       setValue("children", locationState.children || 0);
//       setValue("roomType", locationState.roomType || "");
//       setValue("roomsBooked", locationState.rooms || 1);
//     } else {
//       // Nếu không có locationState thì fallback từ localStorage
//       const bookingInfo = JSON.parse(localStorage.getItem("bookingInfo"));
//       if (bookingInfo) {
//         setValue("checkin", formatDate(bookingInfo.checkin));
//         setValue("checkout", formatDate(bookingInfo.checkout));
//         setValue("adults", bookingInfo.adults || 2);
//         setValue("children", bookingInfo.children || 0);
//         setValue("roomsBooked", bookingInfo.rooms || 1);
//       }
//     }
//   }, [setValue]);
//   const formatDate = (date) => {
//     if (!date) return "";
//     const d = new Date(date);
//     if (isNaN(d)) return "";
//     // Chuyển đổi về múi giờ Việt Nam (UTC+7)
//     const vietnamTime = new Date(d.getTime() + (7 * 60 * 60 * 1000));
//     return vietnamTime.toISOString().split("T")[0];
//   };

//   useEffect(() => {
//     let interval;
//     if (bookingId && paymentStatus === "pending" && bankInfo) {
//       // Set timeout cho lần check đầu tiên sau 5 giây
//       const timeoutId = setTimeout(() => {
//         interval = setInterval(async () => {
//           try {
//             const response = await axios.get(`/api/bookings/${bookingId}/payment-deadline`);
//             const { timeRemaining: remaining, expired } = response.data;
//             setTimeRemaining(remaining);
//             setPaymentExpired(expired);

//             if (expired) {
//               setBookingStatus({
//                 type: "error",
//                 message: "Thời gian thanh toán đã hết. Đặt phòng đã bị hủy.",
//               });
//               setPaymentStatus("canceled");
//               clearInterval(interval);
//             }
//           } catch (error) {
//             console.error("Lỗi khi kiểm tra thời gian thanh toán:", error);
//             setBookingStatus({
//               type: "error",
//               message: "Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.",
//             });
//             clearInterval(interval);
//           }
//         }, 10000); // Tăng interval lên 10 giây
//       }, 5000);

//       return () => {
//         clearTimeout(timeoutId);
//         if (interval) clearInterval(interval);
//       };
//     }
//   }, [bookingId, paymentStatus, bankInfo]);

//   const onSubmit = async (data) => {
//     const userInfo = JSON.parse(localStorage.getItem("userInfo"));
//     if (!userInfo || !userInfo.token) {
//       setBookingStatus({
//         type: "error",
//         message: "Bạn cần đăng nhập để thực hiện đặt phòng.",
//       });
//       return;
//     }
//     try {
//       setLoading(true);
//       setBookingStatus(null);
//       const totalGuests = Number(data.adults) + Number(data.children || 0);
//       const calculatedRoomsNeeded = Math.ceil(totalGuests / room.maxcount);
//       const roomsBooked = Number(data.roomsBooked) || 1;
//       setRoomsNeeded(roomsBooked);


//       // Tính số ngày ở 
//       const checkinDate = new Date(data.checkin);
//       checkinDate.setHours(14, 0, 0, 0); 
//       const checkoutDate = new Date(data.checkout);
//       checkoutDate.setHours(12, 0, 0, 0); 
//       // Tính số ngày ở (không tính phần thời gian)
//       const days = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)) || 1;

//       // Nếu ngày không hợp lệ
//       if (days <= 0) {
//         setBookingStatus({
//           type: "error",
//           message: "Ngày trả phòng phải sau ngày nhận phòng.",
//         });
//         setLoading(false);
//         return;
//       }

//       // ✅ Tính giá sau festival (nếu có)
//       let dailyRate = room.rentperday;
      

//       // ✅ Tính tiền phòng cơ bản
//       const baseAmount = dailyRate * days * roomsNeeded;

//       // ✅ Tính chi phí dịch vụ
//       const servicesCost = calculateServiceCost();

//       // ✅ Tính tổng giảm giá từ voucher (nếu có)
//       const voucherDiscount =
//         discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0;

//       // ✅ Tổng tiền cuối cùng
//       const totalAmount = Math.max(0, baseAmount + servicesCost - voucherDiscount);



//       setPaymentStatus(null);
//       setBankInfo(null);
//       setTimeRemaining(null);
//       setPaymentExpired(false);
//       setPointsEarned(null);

//       // Gửi yêu cầu đặt phòng với danh sách dịch vụ
//       const bookingResponse = await axios.post("/api/bookings/bookroom", {
//         roomid,
//         hotelId: room.hotelId,
//         ...data,
//         adults: Number(data.adults),
//         children: Number(data.children) || 0,
//         roomsBooked,
//         totalAmount,
//         diningServices: selectedServices, // Gửi danh sách dịch vụ được chọn
//         appliedVouchers: discountResult?.appliedDiscounts?.map((d) => ({
//           code: d.code || d.id,
//           discount: d.discount,
//         })) || [],
//         voucherDiscount: discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0,
//       });

//       setBookingId(bookingResponse.data.booking._id);
//       setNewBookingId(bookingResponse.data.booking._id);
//       setBookingDetails({
//         roomName: room.name,
//         checkin: data.checkin,
//         checkout: data.checkout,
//         diningServices: selectedServices, // Lưu dịch vụ vào bookingDetails
//       });

//       localStorage.setItem("userEmail", data.email);
//       localStorage.setItem("bookingId", bookingResponse.data.booking._id);
//       localStorage.setItem("bookedRoomId", roomid);

//       if (data.paymentMethod === "mobile_payment") {
//         setBookingStatus({
//           type: "info",
//           message: "Đang tạo hóa đơn thanh toán MoMo...",
//         });

//         const orderId = `BOOKING-${roomid}-${new Date().getTime()}`;
//         const orderInfo = `Thanh toán đặt phòng ${room.name}`;
//         const amount =
//   totalAmount ||
//   Math.max(
//     0,
//     (discountResult?.totalAmount || room.rentperday * days * roomsNeeded) +
//       calculateServiceCost() -
//       (discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0)
//   );


//         const momoResponse = await axios.post("/api/momo/create-payment", {
//           amount: amount.toString(),
//           orderId,
//           orderInfo,
//           bookingId: bookingResponse.data.booking._id,
//         });

//         if (momoResponse.data.payUrl) {
//           setBookingStatus({
//             type: "success",
//             message: "Đang chuyển hướng đến trang thanh toán MoMo. Vui lòng hoàn tất thanh toán.",
//           });
//           setPaymentStatus("pending");
//           window.location.href = momoResponse.data.payUrl;
//         } else {
//           throw new Error(momoResponse.data.message || "Lỗi khi tạo hóa đơn MoMo");
//         }
//       } else if (data.paymentMethod === "vnpay") {
//         setBookingStatus({
//           type: "info",
//           message: "Đang tạo hóa đơn thanh toán VNPay...",
//         });

//         const orderId = `BOOKING-${roomid}-${new Date().getTime()}`;
//         const orderInfo = `Thanh toán đặt phòng ${room.name}`;
//         const amount =
//   totalAmount ||
//   Math.max(
//     0,
//     (discountResult?.totalAmount || room.rentperday * days * roomsNeeded) +
//       calculateServiceCost() -
//       (discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0)
//   );


//         const vnpayResponse = await axios.post("/api/vnpay/create-payment", {
//           amount: amount.toString(),
//           orderId,
//           orderInfo,
//           bookingId: bookingResponse.data.booking._id,
//         });

//         if (vnpayResponse.data.payUrl) {
//           setBookingStatus({
//             type: "success",
//             message: "Đang chuyển hướng đến trang thanh toán VNPay. Vui lòng hoàn tất thanh toán.",
//           });
//           setPaymentStatus("pending");
//           window.location.href = vnpayResponse.data.payUrl;
//         } else {
//           throw new Error(vnpayResponse.data.message || "Lỗi khi tạo hóa đơn VNPay");
//         }
//       } else {
//         setBookingStatus({
//           type: "success",
//           message: "Đặt phòng thành công! Vui lòng kiểm tra thông tin thanh toán.",
//         });
//         setPaymentStatus(bookingResponse.data.booking.paymentStatus);

//         if (data.paymentMethod === "bank_transfer" && bookingResponse.data.paymentResult?.bankInfo) {
//           setBankInfo({
//             ...bookingResponse.data.paymentResult.bankInfo,
//             amount: (discountResult?.totalAmount || room.rentperday || 50000) + calculateServiceCost(),
//           });
//         }

//         // Kiểm tra và tích điểm nếu thanh toán hoàn tất
//         if (data.paymentMethod !== "bank_transfer") {
//           const bookingCheck = await axios.get(`/api/bookings/${bookingResponse.data.booking._id}`);
//           if (bookingCheck.data.status === "confirmed" && bookingCheck.data.paymentStatus === "paid") {
//             const pointsResult = await accumulatePoints(bookingResponse.data.booking._id);
//             if (pointsResult.success) {
//               setPointsEarned(pointsResult.pointsEarned);
//               setBookingStatus({
//                 type: "success",
//                 message: `Thanh toán thành công! Bạn đã nhận được ${pointsResult.pointsEarned} điểm. Đang chuyển hướng đến trang đánh giá...`,
//               });
//               setTimeout(() => {
//                 navigate(
//                   `/reviews`
//                 );
//               }, 5000);
//             } else {

//               setTimeout(() => {
//                 navigate(
//                   `/reviews`
//                 );
//               }, 5000);
//             }
//           } else {
//             setBookingStatus({
//               type: "warning",
//               message: "Đặt phòng đang chờ xác nhận. Bạn sẽ có thể gửi đánh giá sau khi thanh toán hoàn tất.",
//             });
//           }
//         }
//       }
//     } catch (error) {
//       const errorMessage = error.response?.data?.message || "Lỗi khi đặt phòng hoặc tạo hóa đơn thanh toán. Vui lòng thử lại.";
//       setBookingStatus({
//         type: "error",
//         message: errorMessage,
//       });
//       console.error("Lỗi đặt phòng:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSimulatePayment = async () => {
//     if (!bookingId) return;
//     try {
//       setLoading(true);
//       const response = await axios.put(`/api/bookings/${bookingId}/confirm`);
//       setPaymentStatus("paid");

//       // Tích điểm sau khi xác nhận thanh toán
//       const pointsResult = await accumulatePoints(bookingId);
//       if (pointsResult.success) {
//         setPointsEarned(pointsResult.pointsEarned);
//         setBookingStatus({
//           type: "success",
//           message: `Thanh toán thành công! Bạn đã nhận được ${pointsResult.pointsEarned} điểm. Đang chuyển hướng đến trang đánh giá...`,
//         });
//       } else {
//         setBookingStatus({
//           type: "warning",
//           message: `Thanh toán thành công, Đang chuyển hướng đến trang đánh giá...`,
//         });
//       }

//       setTimeout(() => {
//         navigate(`/reviews`);
//       }, 3000);
//     } catch (error) {
//       console.error("Lỗi khi giả lập thanh toán:", error);
//       setBookingStatus({
//         type: "error",
//         message: error.response?.data?.message || "Lỗi khi giả lập thanh toán. Vui lòng thử lại.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCheckPaymentStatus = async () => {
//     if (!bookingId) return;
//     try {
//       setLoading(true);
//       const response = await axios.get(`/api/bookings/${bookingId}`);
//       setPaymentStatus(response.data.paymentStatus);

//       if (response.data.paymentStatus === "paid" && response.data.status === "confirmed") {
//         const pointsResult = await accumulatePoints(bookingId);
//         if (pointsResult.success) {
//           setPointsEarned(pointsResult.pointsEarned);
//           setBookingStatus({
//             type: "success",
//             message: `Thanh toán đã được xác nhận! Bạn đã nhận được ${pointsResult.pointsEarned} điểm. Đang chuyển hướng đến trang đánh giá...`,
//           });
//           setTimeout(() => {
//             navigate(`/reviews`);
//           }, 3000);
//         } else {
//           setBookingStatus({
//             type: "warning",
//             message: `Thanh toán đã được xác nhận, nhưng không thể tích điểm: ${pointsResult.message}. Đang chuyển hướng đến trang đánh giá...`,
//           });
//           setTimeout(() => {
//             navigate(`/reviews`);
//           }, 3000);
//         }
//       } else {
//         setBookingStatus({
//           type: "info",
//           message: "Thanh toán chưa được xác nhận. Vui lòng kiểm tra lại sau.",
//         });
//       }
//     } catch (error) {
//       setBookingStatus({
//         type: "error",
//         message: error.response?.data?.message || "Lỗi khi kiểm tra trạng thái thanh toán. Vui lòng thử lại.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderPaymentStatus = () => {
//     if (!paymentStatus) return null;
//     let iconClass, statusText;
//     switch (paymentStatus) {
//       case "paid":
//         iconClass = "fas fa-check-circle text-success";
//         statusText = "Đã thanh toán";
//         break;
//       case "pending":
//         iconClass = "fas fa-hourglass-half text-warning";
//         statusText = "Đang chờ thanh toán";
//         break;
//       case "canceled":
//         iconClass = "fas fa-times-circle text-danger";
//         statusText = "Đã hủy";
//         break;
//       default:
//         return null;
//     }
//     return (
//       <div className="payment-status d-flex align-items-center mt-3">
//         <i className={`${iconClass} me-2`} style={{ fontSize: "24px" }}></i>
//         <span className="status-text">{statusText}</span>
//       </div>
//     );
//   };

//   const renderBankInfo = () => {
//     if (!bankInfo) return null;
//     return (
//       <div className="bank-info mt-3 p-3 border rounded">
//         <h4>Thông tin thanh toán qua ngân hàng</h4>
//         <p><strong>Ngân hàng:</strong> {bankInfo.bankName}</p>
//         <p><strong>Số tài khoản:</strong> {bankInfo.accountNumber}</p>
//         <p><strong>Chủ tài khoản:</strong> {bankInfo.accountHolder}</p>
//         <p><strong>Số tiền:</strong> {bankInfo.amount.toLocaleString()} VND</p>
//         <p><strong>Nội dung chuyển khoản:</strong> {bankInfo.content}</p>
//         {timeRemaining !== null && !paymentExpired && (
//           <p>
//             <strong>Thời gian còn lại:</strong> {Math.floor(timeRemaining / 60)} phút {timeRemaining % 60} giây
//           </p>
//         )}
//         <p className="text-warning">
//           Vui lòng chuyển khoản để hoàn tất thanh toán. Đặt phòng sẽ được xác nhận sau khi chúng tôi nhận được tiền.
//         </p>
//         {!paymentExpired && paymentStatus === "pending" && (
//           <>
//             <button
//               className="btn btn-primary mt-3 me-2"
//               onClick={handleSimulatePayment}
//               disabled={loading}
//             >
//               {loading ? "Đang xử lý..." : "Giả lập thanh toán thành công"}
//             </button>
//             <button
//               className="btn btn-secondary mt-3"
//               onClick={handleCheckPaymentStatus}
//               disabled={loading}
//             >
//               {loading ? "Đang kiểm tra..." : "Kiểm tra trạng thái thanh toán"}
//             </button>
//           </>
//         )}
//       </div>
//     );
//   };

//   const renderPointsEarned = () => {
//     if (!pointsEarned) return null;
//     return (
//       <div className="points-earned mt-3 p-3 bg-success text-white rounded">
//         <h5>Chúc mừng!</h5>
//         <p>Bạn đã nhận được <strong>{pointsEarned} điểm</strong> cho lần đặt phòng này.</p>
//       </div>
//     );
//   };

//   const handleOpenCancelModal = () => {
//     setShowCancelModal(true);
//   };

//   const handleConfirmSuccess = () => {
//     setShowCancelModal(false);
//     setBookingStatus({
//       type: "success",
//       message: "Đã hủy đặt phòng thành công.",
//     });
//     setNewBookingId(null);
//     setBookingDetails(null);
//   };

//   const handleCloseAlert = () => {
//     setBookingStatus(null);
//   };

//   return (
//     <div className="booking-page">
//       <div className="container">
//         <div className="booking-header text-center">
//           <h2 className="subtitle">
//             <span className="line"></span>
//             ĐẶT PHÒNG
//             <span className="line"></span>
//           </h2>
//           <h1 className="title">
//             Trải nghiệm <span>NGHỈ DƯỠNG CAO CẤP</span>
//           </h1>
//         </div>

//         {bookingStatus && (
//           <AlertMessage
//             type={bookingStatus?.type}
//             message={bookingStatus?.message}
//             onClose={handleCloseAlert}
//           />
//         )}

//         {renderPointsEarned()}

//         {loading ? (
//           <Loader loading={loading} />
//         ) : error ? (
//           <div className="alert alert-danger text-center">Lỗi khi tải dữ liệu phòng.</div>
//         ) : (
//           <div className="row">
//             <div className="col-md-6">
//               <div className="booking-images-vertical">
//                 {room.imageurls?.slice(0, 4).map((url, idx) => (
//                   <div key={idx} className="image-wrapper-vertical mb-3">
//                     <img
//                       src={url}
//                       alt={`Phòng ${idx + 1}`}
//                       className="img-fluid vertical-room-image"
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div className="col-md-6">
//               {renderPaymentStatus()}
//               {renderBankInfo()}
//               <div className="booking-screen-wrapper">
//                 {!localStorage.getItem("userInfo") && (
//                   <div className="alert alert-warning text-center">
//                     Vui lòng <a href="/login">đăng nhập</a> để đặt phòng.
//                   </div>
//                 )}

//                 <form className="booking-screen" onSubmit={handleSubmit(onSubmit)}>
//                   <div className="row">
//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <input
//                           type="text"
//                           className={`form-control ${errors.name ? "is-invalid" : ""}`}
//                           {...register("name")}
//                           placeholder="Họ và tên"
//                         />
//                         {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <input
//                           type="email"
//                           className={`form-control ${errors.email ? "is-invalid" : ""}`}
//                           {...register("email")}
//                           placeholder="Email của bạn"
//                         />
//                         {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="row">
//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <input
//                           type="tel"
//                           className={`form-control ${errors.phone ? "is-invalid" : ""}`}
//                           {...register("phone")}
//                           placeholder="Số điện thoại"
//                         />
//                         {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <select
//                           className={`form-control ${errors.roomType ? "is-invalid" : ""}`}
//                           {...register("roomType")}
//                         >
//                           <option value="" disabled>
//                             Chọn loại phòng
//                           </option>
//                           <option value={room.type}>{room.type}</option>
//                         </select>
//                         {errors.roomType && <div className="invalid-feedback">{errors.roomType.message}</div>}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="row">
//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <label className="form-label">Nhận phòng (từ 14:00)</label>
//                         <input
//                           type="date"
//                           id="checkin"
//                           className={`form-control ${errors.checkin ? "is-invalid" : ""}`}
//                           {...register("checkin")}
//                           placeholder="Ngày nhận phòng"
//                           min={new Date().toISOString().split("T")[0]}
//                           onChange={(e) => {
//                             const date = new Date(e.target.value);
//                             date.setHours(14, 0, 0, 0);
//                             setValue("checkin", date);
//                           }}
//                         />
//                         {errors.checkin && <div className="invalid-feedback">{errors.checkin.message}</div>}
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <label className="form-label">Trả phòng (trước 12:00)</label>
//                         <input
//                           type="date"
//                           id="checkout"
//                           className={`form-control ${errors.checkout ? "is-invalid" : ""}`}
//                           {...register("checkout")}
//                           placeholder="Ngày trả phòng"
//                           min={getValues("checkin")}
//                           onChange={(e) => {
//                             const date = new Date(e.target.value);
//                             date.setHours(12, 0, 0, 0);
//                             setValue("checkout", date);
//                           }}
//                         />
//                         {errors.checkout && <div className="invalid-feedback">{errors.checkout.message}</div>}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="row">
//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <select
//                           className={`form-control ${errors.adults ? "is-invalid" : ""}`}
//                           {...register("adults", { required: "Vui lòng chọn số người lớn" })}
//                         >
//                           <option value="" disabled>
//                             Chọn số người lớn
//                           </option>
//                           {[...Array(99).keys()].map((num) => (
//                             <option key={num + 1} value={num + 1}>
//                               {num + 1} Người lớn
//                             </option>
//                           ))}
//                         </select>
//                         {errors.adults && (
//                           <div className="invalid-feedback">{errors.adults.message}</div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="col-md-6">
//                       <div className="form-group">
//                         <select
//                           className={`form-control ${errors.children ? "is-invalid" : ""}`}
//                           {...register("children", { required: "Vui lòng chọn số trẻ em" })}
//                         >
//                           <option value="" disabled>
//                             Chọn số trẻ em
//                           </option>
//                           {[...Array(100).keys()].map((num) => (
//                             <option key={num} value={num}>
//                               {num} Trẻ em
//                             </option>
//                           ))}
//                         </select>
//                         {errors.children && (
//                           <div className="invalid-feedback">{errors.children.message}</div>
//                         )}
//                       </div>
//                     </div>

//                   </div>

//                   <div className="col-md-6">
//                     <div className="form-group">
//                       <label className="form-label">Số phòng</label>
//                       <select
//                         className={`form-control ${errors.roomsBooked ? "is-invalid" : ""}`}
//                         {...register("roomsBooked", { required: "Vui lòng chọn số phòng" })}
//                         onChange={(e) => setRoomsNeeded(Number(e.target.value))}
//                       >
//                         <option value="" disabled>
//                           Chọn số phòng
//                         </option>
//                         {[...Array(room.quantity).keys() || 0].map((num) => (
//                           <option key={num + 1} value={num + 1}>
//                             {num + 1} phòng
//                           </option>
//                         ))}
//                       </select>
//                       {errors.roomsBooked && (
//                         <div className="invalid-feedback">{errors.roomsBooked.message}</div>
//                       )}
//                     </div>
//                   </div>

//                   <div className="form-group">
//                     <label htmlFor="paymentMethod">Phương thức thanh toán</label>
//                     <select
//                       className={`form-control ${errors.paymentMethod ? "is-invalid" : ""}`}
//                       {...register("paymentMethod")}
//                     >
//                       <option value="cash">Tiền mặt</option>
//                       <option value="credit_card">Thẻ tín dụng</option>
//                       <option value="bank_transfer">Tài khoản ngân hàng</option>
//                       <option value="mobile_payment">MoMo</option>
//                       <option value="vnpay">VNPay</option>
//                     </select>
//                     {errors.paymentMethod && <div className="invalid-feedback">{errors.paymentMethod.message}</div>}
//                   </div>
//                   <div className="form-group">
//                     <label htmlFor="discountCode">Mã giảm giá</label>
//                     <div className="input-group">
//                       <input
//                         type="text"
//                         className={`form-control ${errors.discountCode ? "is-invalid" : ""}`}
//                         {...register("discountCode")}
//                         placeholder="Nhập mã giảm giá"
//                         value={discountCode}
//                         onChange={(e) => setDiscountCode(e.target.value)}
//                       />
//                       <button
//                         type="button"
//                         className="btn btn-outline-primary"
//                         onClick={applyDiscountCode}
//                         disabled={loading || !discountCode}
//                       >
//                         {loading ? "Đang áp dụng..." : "Áp dụng"}
//                       </button>
//                     </div>
//                     {errors.discountCode && <div className="invalid-feedback">{errors.discountCode.message}</div>}
//                     {discountResult && (
//                       <div className="mt-2">
//                         <p>
//                           <strong>Tổng tiền trước giảm giá:</strong>{" "}
//                           {(room.rentperday * Math.ceil((new Date(document.getElementById("checkout")?.value || new Date()) - new Date(document.getElementById("checkin")?.value || new Date())) / (1000 * 60 * 60 * 24))).toLocaleString()} VND
//                         </p>
//                         <p>
//                           <strong>Giảm giá:</strong>{" "}
//                           {(discountResult?.appliedDiscounts || []).reduce((sum, d) => sum + d.discount, 0).toLocaleString()} VND
//                         </p>
//                         <p>
//                           <strong>Chi phí dịch vụ:</strong>{" "}
//                           {calculateServiceCost().toLocaleString()} VND
//                         </p>
//                         <p>
//                           <strong>Tổng tiền sau giảm giá:</strong> {(discountResult.totalAmount + calculateServiceCost()).toLocaleString()} VND
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                   <div className="form-group">
//                     <label>Dịch vụ bổ sung</label>
//                     <div className="services-list">
//                       {availableServices.length > 0 ? (
//                         availableServices.map((service) => (
//                           <div key={service._id} className="form-check">
//                             <input
//                               type="checkbox"
//                               className="form-check-input"
//                               id={service._id}
//                               value={service._id}
//                               checked={selectedServices.includes(service._id)}
//                               onChange={() => handleServiceChange(service._id)}
//                             />
//                             <label className="form-check-label" htmlFor={service._id}>
//                               {service.name} ({service.price?.toLocaleString() || 0} VND)
//                             </label>
//                           </div>
//                         ))
//                       ) : (
//                         <p>Không có dịch vụ khả dụng</p>
//                       )}

//                     </div>
//                   </div>
//                   <div className="form-group">
//                     <textarea
//                       className={`form-control ${errors.specialRequest ? "is-invalid" : ""}`}
//                       {...register("specialRequest")}
//                       placeholder="Yêu cầu đặc biệt"
//                       rows="3"
//                     />
//                     {errors.specialRequest && <div className="invalid-feedback">{errors.specialRequest.message}</div>}
//                   </div>
//                   <div className="center-button">
//                     <button
//                       type="submit"
//                       className="btn btn-book-now"
//                       disabled={
//                         loading ||
//                         room.availabilityStatus !== "available" ||
//                         !localStorage.getItem("userInfo")
//                       }
//                     >
//                       {loading ? "Đang xử lý..." : "ĐẶT PHÒNG NGAY"}
//                     </button>

//                   </div>

//                   {bookingStatus?.type === "success" && newBookingId && (
//                     <button
//                       type="button"
//                       className="btn btn-danger mt-2"
//                       onClick={handleOpenCancelModal}
//                     >
//                       Hủy Đặt Phòng
//                     </button>
//                   )}
//                 </form>

//                 {room && (
//                   <div className="room-preview mb-4 p-3 border rounded shadow-sm bg-light">
//                     <div className="row align-items-center">
//                       <div className="col-md-4">
//                         <img
//                           src={room.imageurls[0]}
//                           alt={room.name}
//                           className="img-fluid rounded"
//                           style={{ maxHeight: "250px", objectFit: "cover", width: "100%" }}
//                         />
//                       </div>
//                       <div className="col-md-8">
//                         <h5 className="fw-bold mb-2">{room.name}</h5>
//                         <p className="mb-1">
//                           Loại phòng: <strong>{room.type}</strong>
//                         </p>
//                         <p className="mb-1">
//                           Giá thuê mỗi ngày:{" "}
//                           {room.originalRentperday ? (
//                             <>
//                               <span className="text-muted text-decoration-line-through">
//                                 {room.originalRentperday.toLocaleString()} VND
//                               </span>{" "}
//                               <strong className="text-danger">
//                                 {room.rentperday.toLocaleString()} VND
//                               </strong>{" "}
//                               <span className="text-success ms-2">
//                                 (Đã giảm {room.discountApplied})
//                               </span>
//                             </>
//                           ) : (
//                             <strong>{room.rentperday.toLocaleString()} VND</strong>
//                           )}
//                         </p>

//                         <p className="mb-1">
//                           Số phòng cần đặt: <strong>{roomsNeeded}</strong>
//                         </p>
//                         <p className="mb-0 text-primary fw-bold">
//                           Tổng tiền (chưa giảm giá):{" "}
//                           {(
//                             room.rentperday *
//                             roomsNeeded *
//                             Math.ceil(
//                               (new Date(getValues("checkout")) - new Date(getValues("checkin"))) /
//                               (1000 * 60 * 60 * 24)
//                             )
//                           ).toLocaleString()}{" "}
//                           VND
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//               </div>
//             </div>
//           </div>
//         )}
        

//         {room && room.availabilityStatus !== "available" && (
//           <div className="suggestions-container">
//             <h5>Các phòng tương tự có sẵn</h5>
//             {loadingSuggestions ? (
//               <Loader loading={loadingSuggestions} />
//             ) : suggestions.length > 0 ? (
//               <div className="row">
//                 {suggestions.map((sug) => (
//                   <div className="col-md-4 mb-3" key={sug._id}>
//                     <SuggestionCard room={sug} />
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p>Không có phòng tương tự khả dụng vào lúc này.</p>
//             )}
//           </div>
//         )}

//         <CancelConfirmationModal
//           show={showCancelModal}
//           onHide={() => setShowCancelModal(false)}
//           bookingId={newBookingId}
//           onConfirmSuccess={handleConfirmSuccess}
//           bookingDetails={bookingDetails}
//         />
//       </div>
//     </div>
//   );
// }

// export default Bookingscreen;