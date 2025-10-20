// src/pages/Booking/hooks/useBookingLogic.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

/**
 * Schema xác thực (giữ nguyên như bản cũ)
 */
const bookingSchema = yup.object().shape({
  name: yup.string().required("Vui lòng nhập họ và tên").min(2, "Tên phải có ít nhất 2 ký tự"),
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  phone: yup.string().required("Vui lòng nhập số điện thoại"),
  checkin: yup.date().required("Vui lòng chọn ngày nhận phòng"),
  checkout: yup
    .date()
    .required("Vui lòng chọn ngày trả phòng")
    .min(yup.ref("checkin"), "Ngày trả phòng phải sau ngày nhận phòng"),
  adults: yup.number().required("Vui lòng chọn số người lớn").min(1, "Phải có ít nhất 1 người lớn"),
  children: yup.number().default(0),
  roomType: yup.string().required("Vui lòng chọn loại phòng"),
  specialRequest: yup.string().nullable(),
  paymentMethod: yup
    .string()
    .required("Vui lòng chọn phương thức thanh toán")
    .oneOf(["cash", "credit_card", "bank_transfer", "mobile_payment", "vnpay"], "Phương thức thanh toán không hợp lệ"),
  discountCode: yup.string().nullable(),
  diningServices: yup.array().of(yup.string()).nullable(),
});

/**
 * Hook gom toàn bộ logic đặt phòng để UI component dùng lại
 * - GIỮ NGUYÊN: gọi API, tính tiền, discount, dịch vụ, momo/vnpay, bank transfer, tích điểm
 * - TÁCH KHỎI UI: không chứa Tailwind/Bootstrap; chỉ dữ liệu và handler
 */
export default function useBookingLogic({ roomid, navigate, location }) {
  // react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      checkin: "",
      checkout: "",
      adults: 1,
      children: 0,
      roomType: "",
      specialRequest: "",
      paymentMethod: "cash",
      discountCode: "",
      diningServices: [],
      roomsBooked: 1,
    },
  });

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);

  const [paymentStatus, setPaymentStatus] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [paymentExpired, setPaymentExpired] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newBookingId, setNewBookingId] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [bookingDetails, setBookingDetails] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(null);

  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState(null);

  const [totalAmount, setTotalAmount] = useState(null);

  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  const [roomsNeeded, setRoomsNeeded] = useState(1);

  // Lấy festival từ location hoặc localStorage (giữ y nguyên)
  const festival =
    location?.state?.festival || JSON.parse(localStorage.getItem("festival")) || null;

  // ---------- Helpers ----------
  const handleServiceChange = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateServiceCost = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = availableServices.find((s) => s._id === serviceId);
      return total + (service ? service.price : 0);
    }, 0);
  };

  const fetchSuggestions = useCallback(async (rId, roomType) => {
    try {
      setLoadingSuggestions(true);
      const response = await axios.get("/api/rooms/suggestions", {
        params: { roomId: rId, roomType },
      });
      setSuggestions(response.data);
    } catch (err) {
      console.error("Lỗi khi lấy phòng gợi ý:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    const vietnamTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return vietnamTime.toISOString().split("T")[0];
  };

  // ---------- Fetch room ----------
  const fetchRoomData = useCallback(async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      setLoading(true);
      const { data } = await axios.post("/api/rooms/getroombyid", { roomid });

      // Áp dụng giảm giá festival (nếu có) — GIỮ LOGIC
      let adjustedRoom = { ...data };
      if (festival && festival.discountType && festival.discountValue) {
        adjustedRoom.originalRentperday = adjustedRoom.rentperday;

        if (festival.discountType === "percentage") {
          adjustedRoom.rentperday = Math.round(
            adjustedRoom.rentperday * (1 - festival.discountValue / 100)
          );
          adjustedRoom.discountApplied = `${festival.discountValue}%`;
        } else if (festival.discountType === "fixed") {
          adjustedRoom.rentperday = Math.max(0, adjustedRoom.rentperday - festival.discountValue);
          adjustedRoom.discountApplied = `${festival.discountValue.toLocaleString()} VND`;
        }
      }

      setRoom(adjustedRoom);
      setValue("roomType", adjustedRoom.type || "");

      if (adjustedRoom.availabilityStatus !== "available") {
        await fetchSuggestions(adjustedRoom._id, adjustedRoom.type);
      }

      // tổng tiền ban đầu (chưa dịch vụ)
      const checkin = new Date(adjustedRoom.checkin || new Date());
      const checkout = new Date(adjustedRoom.checkout || new Date());
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      setTotalAmount(adjustedRoom.rentperday * days);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [roomid, setValue, festival, fetchSuggestions]);

  // ---------- Accumulate points ----------
  const accumulatePoints = useCallback(async (bookingIdArg) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        return { success: false, message: "Vui lòng đăng nhập để tích điểm" };
      }

      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      const bookingCheck = await axios.get(`/api/bookings/${bookingIdArg}`, config);
      if (bookingCheck.data.status !== "confirmed" || bookingCheck.data.paymentStatus !== "paid") {
        return { success: false, message: "Đặt phòng chưa đủ điều kiện để tích điểm" };
        }

      const response = await axios.post("/api/bookings/checkout", { bookingId: bookingIdArg }, config);
      return {
        success: true,
        pointsEarned: response.data.pointsEarned,
        totalPoints: response.data.totalPoints,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Lỗi khi tích điểm",
      };
    }
  }, []);

  // ---------- Apply discount code ----------
  const applyDiscountCode = async () => {
    try {
      setLoading(true);
      setBookingStatus(null);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const bookingData = {
        roomid,
        checkin: new Date(document.getElementById("checkin").value),
        checkout: new Date(document.getElementById("checkout").value),
        userId: userInfo?.id,
      };
      const identifiers = [discountCode];

      const response = await axios.post("/api/discounts/apply", {
        bookingData,
        identifiers,
      });

      setDiscountResult(response.data);
      setTotalAmount(response.data.totalAmount + calculateServiceCost());
      setBookingStatus({
        type: "success",
        message: `Áp dụng mã giảm giá thành công! Tổng giảm: ${response.data.appliedDiscounts
          .reduce((sum, d) => sum + d.discount, 0)
          .toLocaleString()} VND`,
      });
    } catch (err) {
      setDiscountResult(null);
      setBookingStatus({
        type: "error",
        message: err.response?.data?.message || "Lỗi khi áp dụng mã giảm giá. Vui lòng kiểm tra lại mã.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Submit booking ----------
  const onSubmit = async (data) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.token) {
      setBookingStatus({
        type: "error",
        message: "Bạn cần đăng nhập để thực hiện đặt phòng.",
      });
      return;
    }
    try {
      setLoading(true);
      setBookingStatus(null);

      const totalGuests = Number(data.adults) + Number(data.children || 0);
      const calculatedRoomsNeeded = Math.ceil(totalGuests / (room?.maxcount || 1));
      const roomsBooked = Number(data.roomsBooked) || 1;
      setRoomsNeeded(roomsBooked);

      // Tính số ngày ở (chuẩn checkin 14:00 / checkout 12:00)
      const checkinDate = new Date(data.checkin);
      checkinDate.setHours(14, 0, 0, 0);
      const checkoutDate = new Date(data.checkout);
      checkoutDate.setHours(12, 0, 0, 0);
      const days = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)) || 1;

      if (days <= 0) {
        setBookingStatus({
          type: "error",
          message: "Ngày trả phòng phải sau ngày nhận phòng.",
        });
        setLoading(false);
        return;
      }

      // Giá cơ bản
      const dailyRate = room.rentperday;
      const baseAmount = dailyRate * days * roomsNeeded;

      // Dịch vụ
      const servicesCost = calculateServiceCost();

      // Voucher
      const voucherDiscount =
        discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0;

      // Tổng cuối
      const finalAmount = Math.max(0, baseAmount + servicesCost - voucherDiscount);

      // Reset payment ui
      setPaymentStatus(null);
      setBankInfo(null);
      setTimeRemaining(null);
      setPaymentExpired(false);
      setPointsEarned(null);

      // Gọi API đặt phòng (giữ nguyên endpoint & payload)
      const bookingResponse = await axios.post("/api/bookings/bookroom", {
        roomid,
        hotelId: room.hotelId,
        ...data,
        adults: Number(data.adults),
        children: Number(data.children) || 0,
        roomsBooked,
        totalAmount: finalAmount,
        diningServices: selectedServices,
        appliedVouchers:
          discountResult?.appliedDiscounts?.map((d) => ({
            code: d.code || d.id,
            discount: d.discount,
          })) || [],
        voucherDiscount:
          discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0,
      });

      setBookingId(bookingResponse.data.booking._id);
      setNewBookingId(bookingResponse.data.booking._id);
      setBookingDetails({
        roomName: room.name,
        checkin: data.checkin,
        checkout: data.checkout,
        diningServices: selectedServices,
      });

      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("bookingId", bookingResponse.data.booking._id);
      localStorage.setItem("bookedRoomId", roomid);

      // Xử lý theo phương thức thanh toán
      if (data.paymentMethod === "mobile_payment") {
        setBookingStatus({ type: "info", message: "Đang tạo hóa đơn thanh toán MoMo..." });

        const orderId = `BOOKING-${roomid}-${new Date().getTime()}`;
        const orderInfo = `Thanh toán đặt phòng ${room.name}`;
        const amount =
          finalAmount ||
          Math.max(
            0,
            (discountResult?.totalAmount || room.rentperday * days * roomsNeeded) +
              servicesCost -
              voucherDiscount
          );

        const momoResponse = await axios.post("/api/momo/create-payment", {
          amount: amount.toString(),
          orderId,
          orderInfo,
          bookingId: bookingResponse.data.booking._id,
        });

        if (momoResponse.data.payUrl) {
          setBookingStatus({
            type: "success",
            message: "Đang chuyển hướng đến trang thanh toán MoMo. Vui lòng hoàn tất thanh toán.",
          });
          setPaymentStatus("pending");
          window.location.href = momoResponse.data.payUrl;
        } else {
          throw new Error(momoResponse.data.message || "Lỗi khi tạo hóa đơn MoMo");
        }
      } else if (data.paymentMethod === "vnpay") {
        setBookingStatus({ type: "info", message: "Đang tạo hóa đơn thanh toán VNPay..." });

        const orderId = `BOOKING-${roomid}-${new Date().getTime()}`;
        const orderInfo = `Thanh toán đặt phòng ${room.name}`;
        const amount =
          finalAmount ||
          Math.max(
            0,
            (discountResult?.totalAmount || room.rentperday * days * roomsNeeded) +
              servicesCost -
              voucherDiscount
          );

        const vnpayResponse = await axios.post("/api/vnpay/create-payment", {
          amount: amount.toString(),
          orderId,
          orderInfo,
          bookingId: bookingResponse.data.booking._id,
        });

        if (vnpayResponse.data.payUrl) {
          setBookingStatus({
            type: "success",
            message: "Đang chuyển hướng đến trang thanh toán VNPay. Vui lòng hoàn tất thanh toán.",
          });
          setPaymentStatus("pending");
          window.location.href = vnpayResponse.data.payUrl;
        } else {
          throw new Error(vnpayResponse.data.message || "Lỗi khi tạo hóa đơn VNPay");
        }
      } else {
        setBookingStatus({
          type: "success",
          message: "Đặt phòng thành công! Vui lòng kiểm tra thông tin thanh toán.",
        });
        setPaymentStatus(bookingResponse.data.booking.paymentStatus);

        // Bank transfer: hiện thông tin ngân hàng
        if (data.paymentMethod === "bank_transfer" && bookingResponse.data.paymentResult?.bankInfo) {
          setBankInfo({
            ...bookingResponse.data.paymentResult.bankInfo,
            amount: (discountResult?.totalAmount || room.rentperday || 50000) + servicesCost,
          });
        }

        // Tự động tích điểm khi đã paid (không phải bank)
        if (data.paymentMethod !== "bank_transfer") {
          const bookingCheck = await axios.get(`/api/bookings/${bookingResponse.data.booking._id}`);
          if (bookingCheck.data.status === "confirmed" && bookingCheck.data.paymentStatus === "paid") {
            const pointsResult = await accumulatePoints(bookingResponse.data.booking._id);
            if (pointsResult.success) {
              setPointsEarned(pointsResult.pointsEarned);
              setBookingStatus({
                type: "success",
                message: `Thanh toán thành công! Bạn đã nhận được ${pointsResult.pointsEarned} điểm. Đang chuyển hướng đến trang đánh giá...`,
              });
              setTimeout(() => navigate(`/reviews`), 5000);
            } else {
              setTimeout(() => navigate(`/reviews`), 5000);
            }
          } else {
            setBookingStatus({
              type: "warning",
              message: "Đặt phòng đang chờ xác nhận. Bạn sẽ có thể gửi đánh giá sau khi thanh toán hoàn tất.",
            });
          }
        }
      }
    } catch (err) {
      console.error("Lỗi đặt phòng:", err);
      const errorMessage =
        err.response?.data?.message || "Lỗi khi đặt phòng hoặc tạo hóa đơn thanh toán. Vui lòng thử lại.";
      setBookingStatus({ type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Simulate success payment (for bank) ----------
  const handleSimulatePayment = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      await axios.put(`/api/bookings/${bookingId}/confirm`);
      setPaymentStatus("paid");

      const pointsResult = await accumulatePoints(bookingId);
      if (pointsResult.success) {
        setPointsEarned(pointsResult.pointsEarned);
        setBookingStatus({
          type: "success",
          message: `Thanh toán thành công! Bạn đã nhận được ${pointsResult.pointsEarned} điểm. Đang chuyển hướng đến trang đánh giá...`,
        });
      } else {
        setBookingStatus({
          type: "warning",
          message: `Thanh toán thành công, Đang chuyển hướng đến trang đánh giá...`,
        });
      }
      setTimeout(() => navigate(`/reviews`), 3000);
    } catch (err) {
      console.error("Lỗi khi giả lập thanh toán:", err);
      setBookingStatus({
        type: "error",
        message: err.response?.data?.message || "Lỗi khi giả lập thanh toán. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Manual check payment status ----------
  const handleCheckPaymentStatus = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${bookingId}`);
      setPaymentStatus(response.data.paymentStatus);

      if (response.data.paymentStatus === "paid" && response.data.status === "confirmed") {
        const pointsResult = await accumulatePoints(bookingId);
        if (pointsResult.success) {
          setPointsEarned(pointsResult.pointsEarned);
          setBookingStatus({
            type: "success",
            message: `Thanh toán đã được xác nhận! Bạn đã nhận được ${pointsResult.pointsEarned} điểm. Đang chuyển hướng đến trang đánh giá...`,
          });
          setTimeout(() => navigate(`/reviews`), 3000);
        } else {
          setBookingStatus({
            type: "warning",
            message: `Thanh toán đã được xác nhận, nhưng không thể tích điểm: ${pointsResult.message}. Đang chuyển hướng đến trang đánh giá...`,
          });
          setTimeout(() => navigate(`/reviews`), 3000);
        }
      } else {
        setBookingStatus({
          type: "info",
          message: "Thanh toán chưa được xác nhận. Vui lòng kiểm tra lại sau.",
        });
      }
    } catch (err) {
      setBookingStatus({
        type: "error",
        message: err.response?.data?.message || "Lỗi khi kiểm tra trạng thái thanh toán. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Effects ----------
  // 1) fetch room
  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // 2) fetch services theo hotelId
  useEffect(() => {
    const fetchServices = async () => {
      try {
        if (!room?.hotelId) return;
        const response = await axios.get(`/api/services/hotel/${room.hotelId}`);
        setAvailableServices(response.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách dịch vụ:", err);
      }
    };
    fetchServices();
  }, [room]);

  // 3) fill user info + location state / localStorage
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setValue("name", userInfo.name || "");
      setValue("email", userInfo.email || "");
      setValue("phone", userInfo.phone || "");
    }

    const locationState = window.history.state?.usr;
    if (locationState) {
      setValue("checkin", formatDate(locationState.checkin));
      setValue("checkout", formatDate(locationState.checkout));
      setValue("adults", locationState.adults || 2);
      setValue("children", locationState.children || 0);
      setValue("roomType", locationState.roomType || "");
      setValue("roomsBooked", locationState.rooms || 1);
      setRoomsNeeded(locationState.rooms || 1);
    } else {
      const bookingInfo = JSON.parse(localStorage.getItem("bookingInfo"));
      if (bookingInfo) {
        setValue("checkin", formatDate(bookingInfo.checkin));
        setValue("checkout", formatDate(bookingInfo.checkout));
        setValue("adults", bookingInfo.adults || 2);
        setValue("children", bookingInfo.children || 0);
        setValue("roomsBooked", bookingInfo.rooms || 1);
        setRoomsNeeded(bookingInfo.rooms || 1);
      }
    }
  }, [setValue]);

  // 4) countdown payment deadline (bank transfer)
  useEffect(() => {
    let interval;
    if (bookingId && paymentStatus === "pending" && bankInfo) {
      const timeoutId = setTimeout(() => {
        interval = setInterval(async () => {
          try {
            const response = await axios.get(`/api/bookings/${bookingId}/payment-deadline`);
            const { timeRemaining: remaining, expired } = response.data;
            setTimeRemaining(remaining);
            setPaymentExpired(expired);

            if (expired) {
              setBookingStatus({
                type: "error",
                message: "Thời gian thanh toán đã hết. Đặt phòng đã bị hủy.",
              });
              setPaymentStatus("canceled");
              clearInterval(interval);
            }
          } catch (err) {
            console.error("Lỗi khi kiểm tra thời gian thanh toán:", err);
            setBookingStatus({
              type: "error",
              message: "Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.",
            });
            clearInterval(interval);
          }
        }, 10000);
      }, 5000);

      return () => {
        clearTimeout(timeoutId);
        if (interval) clearInterval(interval);
      };
    }
  }, [bookingId, paymentStatus, bankInfo, setBookingStatus]);

  // ---------- Public API (return cho UI component) ----------
  return {
    // form
    register,
    handleSubmit,
    errors,
    setValue,
    getValues,
    watch,

    // data
    loading,
    room,
    error,

    bookingStatus,
    setBookingStatus,

    paymentStatus,
    bankInfo,
    bookingId,
    timeRemaining,
    paymentExpired,

    showCancelModal,
    setShowCancelModal,

    newBookingId,
    setNewBookingId,

    suggestions,
    loadingSuggestions,

    bookingDetails,
    pointsEarned,

    discountCode,
    setDiscountCode,
    discountResult,

    totalAmount,
    setTotalAmount,

    selectedServices,
    setSelectedServices,
    availableServices,

    roomsNeeded,
    setRoomsNeeded,

    // handlers
    handleServiceChange,
    calculateServiceCost,
    applyDiscountCode,
    onSubmit,
    handleSimulatePayment,
    handleCheckPaymentStatus,

    // utils
    formatDate,
    fetchRoomData,
  };
}
