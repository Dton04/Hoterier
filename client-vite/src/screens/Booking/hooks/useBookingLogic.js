// src/pages/Booking/hooks/useBookingLogic.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";

/**
 * Schema xác thực (giữ nguyên như bản cũ)
 */
const bookingSchema = yup.object().shape({
  name: yup.string().required("Vui lòng nhập họ và tên").min(2, "Tên phải có ít nhất 2 ký tự"),
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  phone: yup.string().required("Vui lòng nhập số điện thoại"),
  checkin: yup
    .date()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .typeError("Ngày nhận phòng không hợp lệ")
    .required("Vui lòng chọn ngày nhận phòng"),

  checkout: yup
    .date()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .typeError("Ngày trả phòng không hợp lệ")
    .required("Vui lòng chọn ngày trả phòng")
    .min(yup.ref("checkin"), "Ngày trả phòng phải sau ngày nhận phòng"),

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
export default function useBookingLogic({ roomid, navigate, initialData }) {
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

  const [roomsNeeded, setRoomsNeeded] = useState(1);
  const [collectedVouchers, setCollectedVouchers] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newBookingId, setNewBookingId] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [bookingDetails, setBookingDetails] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(null);

  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState(null);

  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // Fetch collected vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.token) return;

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        const { data } = await axios.get("/api/discounts/my-vouchers", config);
        setCollectedVouchers(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách voucher:", error);
      }
    };
    fetchVouchers();
  }, []);

  // Lấy festival từ location hoặc localStorage (giữ y nguyên)
  const festival =
    location?.state?.festival ||
    JSON.parse(localStorage.getItem("festival")) ||
    null;

  // ---------- Helpers ----------
  const handleServiceChange = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // ---------- Real-time Availability Check ----------
  const checkAvailability = async () => {
    try {
      const checkin = getValues("checkin");
      const checkout = getValues("checkout");
      const roomsBooked = Number(getValues("roomsBooked") || 1);

      if (!roomid || !checkin || !checkout) return;

      const response = await axios.post("/api/rooms/check-availability", {
        roomid,
        checkin,
        checkout,
        roomsNeeded: roomsBooked
      });

      return response.data;
    } catch (err) {
      return { available: false, message: "Lỗi kiểm tra phòng trống" };
    }
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

      // ===== MULTI-ROOM CASE =====
      if (initialData?.isMultiRoom === true && initialData?.selectedRooms?.length > 0) {
        try {
          // Fetch hotel info từ room đầu tiên
          const firstRoom = initialData.selectedRooms[0];

          if (!firstRoom?.roomid) {
            throw new Error("Invalid room ID in multi-room selection");
          }

          const { data } = await axios.post("/api/rooms/getroombyid", { roomid: firstRoom.roomid });

          if (data.hotel && data.hotel.imageurls) {
            data.imageurls = data.hotel.imageurls;
          }

          // Tính tổng giá multi-room
          const checkin = new Date(initialData?.checkin || new Date());
          const checkout = new Date(initialData?.checkout || new Date());
          const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)) || 1;

          const multiRoomTotal = initialData.selectedRooms.reduce((sum, sRoom) => {
            const pricePerNight =
              sRoom.discountedPrice ??
              (sRoom.rentperday - (sRoom.festivalDiscountPerDay || 0)) ??
              sRoom.rentperday;

            return sum + pricePerNight * sRoom.roomsBooked * days;
          }, 0);


          setRoom({
            ...data,
            name: `${initialData.selectedRooms.length} phòng được chọn`,
            rentperday: multiRoomTotal / days,
            isMultiRoom: true,
            selectedRooms: initialData.selectedRooms,
          });

          setTotalAmount(multiRoomTotal);
          setValue("roomType", "Multi-Room");

          return;
        } catch (multiErr) {
          console.error("Error in multi-room fetch:", multiErr);
          setError(true);
          return;
        }
      }

      // ===== SINGLE-ROOM CASE =====
      if (!roomid) {
        setError(true);
        return;
      }

      const { data } = await axios.post("/api/rooms/getroombyid", { roomid });

      if (data.hotel) {
        data.hotelId = data.hotel._id;
      }

      // 👇 BỔ SUNG ĐOẠN NÀY ĐỂ FE NHẬN ĐÚNG hotel.imageurls
      if (data.hotel && data.hotel.imageurls) {
        data.hotel.imageurls = data.hotel.imageurls.map((url) =>
          url.startsWith("http")
            ? url
            : `${window.location.origin}/${url.replace(/^\/+/, "")}`
        );
      }

      // ------------------ FIX FESTIVAL DISCOUNT CHỈ ÁP DỤNG KHÁCH SẠN ĐÚNG ------------------

      let adjustedRoom = { ...data };
      adjustedRoom.originalRentperday = data.rentperday; // luôn giữ giá gốc
      adjustedRoom.festivalDiscountPerDay = 0;
      adjustedRoom.discountApplied = null;

      // Kiểm tra festival có hợp lệ & có áp cho hotel này không
      const isApplicableFestival =
        festival &&
        Array.isArray(festival.applicableHotels) &&
        festival.applicableHotels.map(id => id.toString()).includes(data.hotelId.toString());


      // Nếu festival KHÔNG áp dụng cho khách sạn này → xoá khỏi localStorage
      if (festival && !isApplicableFestival) {
        localStorage.removeItem("festival");
      }

      // Chỉ áp dụng festival nếu đúng khách sạn
      if (isApplicableFestival) {
        let dailyDiscount = 0;

        if (festival.discountType === "percentage") {
          dailyDiscount = Math.round(data.rentperday * (festival.discountValue / 100));
        } else if (festival.discountType === "fixed") {
          dailyDiscount = festival.discountValue;
        }

        adjustedRoom.festivalDiscountPerDay = dailyDiscount;
        adjustedRoom.discountApplied =
          festival.discountValue +
          (festival.discountType === "percentage" ? "%" : " VND");
      }

      // ------------------ END FIX ------------------


      setRoom(adjustedRoom);

      if (initialData.people && adjustedRoom.maxcount) {
        const autoRooms = Math.ceil(Number(initialData.people) / adjustedRoom.maxcount);
        setRoomsNeeded(autoRooms);
        setValue("roomsBooked", autoRooms);
      }

      setValue("roomType", adjustedRoom.type || "");

      if (adjustedRoom.availabilityStatus !== "available") {
        await fetchSuggestions(adjustedRoom._id, adjustedRoom.type);
      }

      // tính tổng tiền ban đầu (dùng giá đã giảm sau festival)
      const checkin = new Date(adjustedRoom.checkin || new Date());
      const checkout = new Date(adjustedRoom.checkout || new Date());
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

      const discountedDailyRate = Math.max(0, adjustedRoom.originalRentperday - adjustedRoom.festivalDiscountPerDay);

      // TotalAmount ban đầu là giá đã giảm * số ngày * số phòng
      setTotalAmount(discountedDailyRate * days * (adjustedRoom.roomsBooked || 1));
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [roomid, setValue]);

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
      if (!discountCode) {
        toast.error("Vui lòng nhập mã giảm giá");
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo?.token) {
        toast.error("Bạn cần đăng nhập để áp dụng mã giảm giá");
        return;
      }

      const checkin = getValues("checkin");
      const checkout = getValues("checkout");
      const roomsBooked = Number(getValues("roomsBooked") || 1);

      if (!checkin || !checkout) {
        toast.error("Vui lòng chọn ngày nhận phòng & trả phòng trước khi áp mã");
        return;
      }

      // Tính số ngày
      const days = Math.ceil(
        (new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)
      ) || 1;

      // Giá gốc + Festival
      const originalDailyRate = room.originalRentperday || room.rentperday;
      const festivalDiscountTotal =
        (room.festivalDiscountPerDay || 0) * days * roomsBooked;

      const bookingValue = Math.max(
        0,
        originalDailyRate * days * roomsBooked - festivalDiscountTotal
      );

      // Gọi API có token
      const { data } = await axios.post(
        "/api/discounts/apply",
        {
          discountCodes: [discountCode],
          bookingValue,
          hotelId: room.hotelId || room?.hotel?._id,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setDiscountResult(data);

      // Tính tổng mới sau voucher + dịch vụ
      const finalTotal =
        Math.max(0, bookingValue - data.totalDiscountAmount) +
        calculateServiceCost();

      setTotalAmount(finalTotal);

      toast.success(
        `Áp mã thành công! Giảm ${data.totalDiscountAmount.toLocaleString()} VND`
      );
    } catch (err) {
      console.error("Lỗi áp mã:", err);
      toast.error(
        err.response?.data?.message ||
        "Không áp dụng được mã giảm giá. Vui lòng thử lại."
      );
      setDiscountResult(null);
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



      const adultsRaw = Number(data.adults);
      const childrenRaw = Number(data.children);

      // Lấy danh sách tuổi trẻ em từ localStorage
      const bookingInfo = JSON.parse(localStorage.getItem("bookingInfo"));
      const childrenAges = bookingInfo?.childrenAges || [];

      // Quy đổi theo Booking.com:
      let totalAdults = adultsRaw;
      let totalChildren = 0;

      childrenAges.forEach((age) => {
        if (age >= 6) {
          totalAdults += 1;
        } else if (age >= 2) {
          totalChildren += 1;
        }

      });

      const totalGuests = totalAdults + totalChildren;

      const calculatedRoomsNeeded = Math.ceil(
        totalGuests / (room?.maxcount || 1)
      );


      const roomsBooked = Number(data.roomsBooked) || 1;

      if (initialData?.isMultiRoom === true) {

        // Tính tổng sức chứa thật sự của tất cả phòng
        const totalCapacity = initialData.selectedRooms.reduce(
          (sum, r) => sum + r.maxcount * r.roomsBooked,
          0
        );

        if (totalGuests > totalCapacity) {
          toast.error(
            `Combo phòng chứa tối đa ${totalCapacity} khách. 
        Bạn đang có ${totalGuests} khách nên không thể đặt combo này.`,
            { duration: 3500 }
          );
          setLoading(false);
          return;
        }

      } else {
        // =========================
        // SINGLE ROOM VALIDATION (giữ nguyên)
        // =========================
        if (roomsBooked < calculatedRoomsNeeded) {
          setRoomsNeeded(calculatedRoomsNeeded);
          toast.error(
            `Phòng tối đa ${room.maxcount} người/phòng. 
        Bạn có ${totalGuests} khách → cần tối thiểu ${calculatedRoomsNeeded} phòng.`,
            { duration: 3500 }
          );
          setLoading(false);
          return;
        }
      }


      setRoomsNeeded(roomsBooked);

      const checkinDate = new Date(`${data.checkin}T14:00:00`);
      const checkoutDate = new Date(`${data.checkout}T12:00:00`);

      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)) || 1;

      if (days <= 0) {
        toast.error("Ngày trả phòng phải sau ngày nhận phòng.");

        setLoading(false);
        return;
      }

      // Giá cơ bản (Dùng giá gốc)
      const originalDailyRate = room.originalRentperday || room.rentperday;
      const basePriceTotal = originalDailyRate * days * roomsNeeded;

      // Giảm giá Festival
      const festivalDiscountTotal = (room.festivalDiscountPerDay || 0) * days * roomsNeeded;

      // Giá sau khi áp dụng Festival Discount (để tính tổng)
      const priceAfterFestival = Math.max(0, basePriceTotal - festivalDiscountTotal);

      // Dịch vụ
      const servicesCost = calculateServiceCost();

      // Voucher
      const voucherDiscount =
        discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0;

      // Tổng cuối
      const finalAmount = Math.max(0, priceAfterFestival + servicesCost - voucherDiscount);

      // Reset payment ui
      setPaymentStatus(null);
      setBankInfo(null);
      setTimeRemaining(null);
      setPaymentExpired(false);
      setPointsEarned(null);

      // ===== KIỂM TRA MULTI-ROOM =====
      // Nếu initialData có isMultiRoom flag -> dùng /book-multi endpoint
      if (initialData?.isMultiRoom === true && initialData?.selectedRooms?.length > 0) {
        // MULTI-ROOM FLOW
        const selectedRoomsData = initialData.selectedRooms.map((sRoom) => ({
          roomid: sRoom.roomid,
          roomType: sRoom.roomType,
          roomsBooked: sRoom.roomsBooked,
          checkin: data.checkin,
          checkout: data.checkout,
        }));

        const bookingResponse = await axios.post("/api/bookings/book-multi", {
          rooms: selectedRoomsData,
          customer: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            adults: totalAdults,
            children: totalChildren,
            specialRequest: data.specialRequest,
            paymentMethod: data.paymentMethod,
            diningServices: selectedServices,
            appliedVouchers:
              discountResult?.appliedDiscounts?.map((d) => ({
                code: d.code || d.id,
                discount: d.discount,
              })) || [],
          },
        });

        setBookingId(bookingResponse.data.booking._id);
        setNewBookingId(bookingResponse.data.booking._id);
        setBookingDetails({
          roomName: `${initialData.selectedRooms.length} phòng được chọn`,
          checkin: data.checkin,
          checkout: data.checkout,
          diningServices: selectedServices,
        });

        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("bookingId", bookingResponse.data.booking._id);
        localStorage.setItem("bookedRoomId", "multi-room");

        //Gửi email xác nhận multi-room
        try {
          await axios.post("/api/bookings/mail/booking-confirmation", {
            bookingId: bookingResponse.data.booking._id,
            email: data.email,
            name: data.name,
            roomName: `${initialData.selectedRooms.length} phòng đặt chung`,
            checkin: data.checkin,
            checkout: data.checkout,
            totalAmount: bookingResponse.data.booking.totalAmount,
            paymentMethod: data.paymentMethod,
          });
        } catch (mailErr) {
          console.warn("Không gửi được email xác nhận:", mailErr);
        }

        // Xử lý payment method (giống single-room)
        const paymentMethod = data.paymentMethod;
        const paymentResult = bookingResponse.data.paymentResult || {};

        if (paymentMethod === "vnpay") {
          // VNPay logic - chuyển hướng đến URL từ BE
          try {
            toast.success(" Đặt phòng thành công! Đang chuyển đến VNPay...");

            // Get bookingId from response (support both single-room and multi-room)
            const bookingId = bookingResponse.data.booking?._id || bookingResponse.data.bookingId;
            const totalAmount = bookingResponse.data.totalAmount || bookingResponse.data.booking?.totalAmount;
            const orderId = `BOOKING-${Date.now()}`;

            if (!bookingId) {
              throw new Error("Không có bookingId từ server");
            }
            if (!totalAmount) {
              throw new Error("Không có số tiền từ server");
            }

            const vnpayResponse = await axios.post("/api/vnpay/create-payment", {
              amount: totalAmount,
              orderId: orderId,
              orderInfo: `Thanh toán đặt phòng - ${bookingId}`,
              bookingId: bookingId,
            });
            if (vnpayResponse.data.payUrl) {
              window.location.href = vnpayResponse.data.payUrl;
            } else {
              throw new Error("Không nhận được URL thanh toán từ VNPay");
            }
          } catch (vnErr) {
            console.error("Lỗi VNPay:", vnErr);
            setBookingStatus({
              type: "error",
              message: vnErr.response?.data?.message || "Lỗi khởi tạo thanh toán VNPay",
            });
          }
        } else if (paymentMethod === "mobile_payment") {
          // MoMo logic - chuyển hướng đến URL từ BE
          try {
            setBookingStatus({ type: "info", message: "Đang chuyển hướng đến cổng thanh toán MoMo..." });

            // Get bookingId from response (support both single-room and multi-room)
            const bookingId = bookingResponse.data.booking?._id || bookingResponse.data.bookingId;
            const totalAmount = bookingResponse.data.totalAmount || bookingResponse.data.booking?.totalAmount;
            const orderId = `BOOKING-${Date.now()}`;

            if (!bookingId) {
              throw new Error("Không có bookingId từ server");
            }
            if (!totalAmount) {
              throw new Error("Không có số tiền từ server");
            }

            const momoResponse = await axios.post("/api/momo/create-payment", {
              amount: totalAmount,
              orderId: orderId,
              orderInfo: `Thanh toán đặt phòng - ${bookingId}`,
              bookingId: bookingId,
            });
            if (momoResponse.data.payUrl) {
              window.location.href = momoResponse.data.payUrl;
            } else {
              throw new Error("Không nhận được URL thanh toán từ MoMo");
            }
          } catch (moErr) {
            console.error("Lỗi MoMo:", moErr);
            setBookingStatus({
              type: "error",
              message: moErr.response?.data?.message || "Lỗi khởi tạo thanh toán MoMo",
            });
          }
        } else if (paymentMethod === "bank_transfer") {
          setPaymentStatus("pending");
          if (bookingResponse.data.paymentResult?.bankInfo) {
            setBankInfo(bookingResponse.data.paymentResult.bankInfo);
          }
          toast.success(" Đặt phòng thành công! Vui lòng chuyển khoản theo thông tin hiển thị.");
        } else if (paymentMethod === "cash") {
          setPaymentStatus("paid");
          setPointsEarned(bookingResponse.data.pointsEarned || 0);
          toast.success(" Đặt phòng thành công! Thanh toán tại quầy lễ tân.");
        }

        return;
      }

      // ===== SINGLE-ROOM FLOW (giữ nguyên) =====
      // Gọi API đặt phòng (giữ nguyên endpoint & payload)
      const bookingResponse = await axios.post("/api/bookings/bookroom", {
        roomid,
        hotelId: room.hotelId,
        ...data,
        adults: totalAdults,
        children: totalChildren,
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

      // Gửi email xác nhận đặt phòng cho tất cả phương thức
      try {
        await axios.post("/api/bookings/mail/booking-confirmation", {
          bookingId: bookingResponse.data.booking._id,
          email: data.email,
          name: data.name,
          roomName: room.name,
          checkin: data.checkin,
          checkout: data.checkout,
          totalAmount: finalAmount,
          paymentMethod: data.paymentMethod,
        });




      } catch (mailErr) {
        console.warn("Không gửi được email xác nhận:", mailErr);
      }


      // Xử lý theo phương thức thanh toán (Single-room)
      if (data.paymentMethod === "mobile_payment") {
        try {
          toast.success("Đặt phòng thành công! Đang chuyển đến MoMo...");
          const orderId = `BOOKING-${Date.now()}`;
          const bookingId = bookingResponse.data.booking._id;

          if (!bookingId) {
            throw new Error("Không có bookingId từ server");
          }

          const momoResponse = await axios.post("/api/momo/create-payment", {
            amount: bookingResponse.data.booking.totalAmount,
            orderId,
            orderInfo: `Thanh toán đặt phòng ${room.name}`,
            bookingId: bookingId,
          });

          if (momoResponse.data.payUrl) {
            window.location.href = momoResponse.data.payUrl;
          } else {
            throw new Error(momoResponse.data.message || "Không nhận được URL thanh toán từ MoMo");
          }
        } catch (moErr) {
          console.error("Lỗi MoMo:", moErr);
          setBookingStatus({
            type: "error",
            message: moErr.response?.data?.message || "Lỗi khởi tạo thanh toán MoMo",
          });
        }
      } else if (data.paymentMethod === "vnpay") {
        try {
          setBookingStatus({ type: "info", message: "Đang chuyển hướng đến cổng thanh toán VNPay..." });
          const orderId = `BOOKING-${Date.now()}`;
          const bookingId = bookingResponse.data.booking._id;

          if (!bookingId) {
            throw new Error("Không có bookingId từ server");
          }

          const vnpayResponse = await axios.post("/api/vnpay/create-payment", {
            amount: bookingResponse.data.booking.totalAmount,
            orderId,
            orderInfo: `Thanh toán đặt phòng ${room.name}`,
            bookingId: bookingId,
          });

          if (vnpayResponse.data.payUrl) {
            window.location.href = vnpayResponse.data.payUrl;
          } else {
            throw new Error(vnpayResponse.data.message || "Không nhận được URL thanh toán từ VNPay");
          }
        } catch (vnErr) {
          console.error("Lỗi VNPay:", vnErr);
          setBookingStatus({
            type: "error",
            message: vnErr.response?.data?.message || "Lỗi khởi tạo thanh toán VNPay",
          });
        }
      } else {
        //Nếu là thanh toán tiền mặt (CHỈ HIỆN TOAST)
        if (data.paymentMethod === "cash") {

          toast.success(" Đặt phòng thành công! Thanh toán tại quầy lễ tân khi nhận phòng.", {
            duration: 3500,
          });

          setPaymentStatus("pending");

          // ❌ Không dùng bookingStatus nữa
          return;
        }



        toast.success("Đặt phòng thành công! Booking của bạn đã được xác nhận.");

        setPaymentStatus(bookingResponse.data.booking.paymentStatus);

        if (data.paymentMethod === "bank_transfer" && bookingResponse.data.paymentResult?.bankInfo) {
          setBankInfo(bookingResponse.data.paymentResult.bankInfo);
        }
      }


      // Bank transfer: hiện thông tin ngân hàng
      if (data.paymentMethod === "bank_transfer" && bookingResponse.data.paymentResult?.bankInfo) {
        setBankInfo(bookingResponse.data.paymentResult.bankInfo);
      }

      // Tự động tích điểm khi đã paid (không phải bank)
      if (data.paymentMethod !== "bank_transfer") {
        const bookingCheck = await axios.get(`/api/bookings/${bookingResponse.data.booking._id}`);
        if (bookingCheck.data.status === "confirmed" && bookingCheck.data.paymentStatus === "paid") {
          const pointsResult = await accumulatePoints(bookingResponse.data.booking._id);
          if (pointsResult.success) {
            setPointsEarned(pointsResult.pointsEarned);
            toast.success(`🎉 Thanh toán thành công! Bạn được cộng ${pointsEarned} điểm.`);
            setTimeout(() => navigate(`/reviews`), 5000);
          } else {
            setTimeout(() => navigate(`/reviews`), 5000);
          }
        } else {
          toast("⏳ Đặt phòng đang chờ xác nhận...");
        }
      }
    } catch (err) {
      console.error("Lỗi đặt phòng:", err);
      const errorMessage =
        err.response?.data?.message || "Lỗi khi đặt phòng hoặc tạo hóa đơn thanh toán. Vui lòng thử lại.";
      toast.error(errorMessage);

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
        toast.success(`🎉 Thanh toán thành công! Bạn được cộng ${pointsEarned} điểm.`);

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
        setValue("adults", initialData.people ? Number(initialData.people) : (bookingInfo?.adults || 2));

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
    handleSimulatePayment,
    handleCheckPaymentStatus,

    // utils
    formatDate,
    fetchRoomData,
    checkAvailability,
    collectedVouchers,

    // services
    selectedServices,
    availableServices,
    handleServiceChange,
    calculateServiceCost,

    // discount
    applyDiscountCode,

    // booking
    onSubmit,
    roomsNeeded,
    setRoomsNeeded,
  };
}
