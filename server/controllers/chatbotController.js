function normalizeVietnamese(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // loại bỏ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}



// server/controllers/chatbotController.js
const Hotel = require("../models/hotel");
const Region = require("../models/region");
const Room = require("../models/room");
const Booking = require("../models/booking");
const axios = require("axios");

/** 🧩 Hàm tính giá thấp nhất */
function getLowestPrice(hotel) {
  if (!hotel?.rooms?.length) return null;
  const prices = hotel.rooms
    .map((r) => Number(r.rentperday || r.discountedPrice || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

/** 🧩 Nhận diện ý định */
function detectIntent(msg) {
  const text = msg.toLowerCase();
  if (text.includes("đặt") || text.includes("book")) return "booking";
  if (["có", "ok", "xác nhận", "đồng ý"].some((w) => text.includes(w)))
    return "confirm";
  return "search";
}

/** 🧩 Trích thông tin cơ bản */
async function extractInfo(msg) {
  const regions = await Region.find({}, "name").lean();
  const region = regions.find((r) =>
    msg.toLowerCase().includes(r.name.toLowerCase())
  );

  const peopleMatch = msg.match(/(\d+)\s*(?:người|khách)/i);
  const people = peopleMatch ? parseInt(peopleMatch[1]) : null;

  const dateMatch = msg.match(/(\d{1,2})[\/\-](\d{1,2})/g);
  const checkin = dateMatch?.[0] || null;
  const checkout = dateMatch?.[1] || null;

  return { region, people, checkin, checkout };
}

/** 💬 Bộ não chatbot chính */
exports.chatBotReply = async (req, res) => {
  try {
    const { message, context = {} } = req.body || {};
    if (!message)
      return res.status(400).json({ reply: "Thiếu nội dung tin nhắn" });

    const intent = detectIntent(message);
    const prev = context || {};

    console.log("📩 MESSAGE:", message);
    console.log("📦 CONTEXT:", context);

    /** ==================== 2️⃣ KHI CHỌN PHÒNG ==================== */
    // Khi người dùng chọn phòng, hỏi phương thức thanh toán
    if (
      message.toLowerCase().includes("chọn") &&
      context?.hotelId &&
      context?.roomId &&
      !context.paymentMethod &&
      context.stage !== "choose_payment" && // ✅ tránh bị lặp khi đang thanh toán
      !message.toLowerCase().includes("tiền mặt") &&
      !message.toLowerCase().includes("chuyển khoản") &&
      !message.toLowerCase().includes("vnpay") &&
      !message.toLowerCase().includes("momo") // ✅ loại trừ trường hợp chọn phương thức
    ) {
      const room = await Room.findById(context.roomId)
        .populate("hotelId", "name")
        .lean();

      if (!room) {
        return res.json({ reply: "Không tìm thấy phòng bạn chọn." });
      }

      return res.json({
        reply: `🛏️ Bạn đã chọn phòng *${room.name}* tại khách sạn *${room.hotelId.name}*.\nBạn muốn thanh toán bằng cách nào ạ? 💳`,
        suggest: [
          { id: "cash", name: "💵 Tiền mặt tại quầy" },
          { id: "bank_transfer", name: "🏦 Chuyển khoản ngân hàng" },
          { id: "vnpay", name: "💳 VNPay" },
          { id: "mobile_payment", name: "📱 MoMo" },
        ],
        context: { ...context, stage: "choose_payment" },
      });
    }



    /** ==================== 2️⃣ KHI CHỌN KHÁCH SẠN ==================== */
    if (
      message.toLowerCase().includes("chọn") &&
      (context.hotelId || prev.hotelId) &&
      !context.roomId
    ) {
      const hotelId = context.hotelId || prev.hotelId;

      let hotel = await Hotel.findById(hotelId).lean();
      if (!hotel) {
        return res.json({ reply: "Không tìm thấy khách sạn bạn chọn." });
      }

      // ✅ Dùng đúng API giống HotelDetail
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const hotelWithRooms = await axios.get(
        `${baseUrl}/api/hotels/${hotelId}/rooms`
      );

      hotel = hotelWithRooms.data.hotel;
      const rooms = hotelWithRooms.data.rooms || [];

      if (!rooms.length) {
        return res.json({
          reply: `Rất tiếc, khách sạn *${hotel.name}* hiện không còn phòng trống. Bạn muốn chọn khách sạn khác không?`,
        });
      }

      const topRooms = rooms.slice(0, 5).map((r) => ({
        id: r._id,
        name: r.name,
        price: r.rentperday || 0,
        amenities: r.amenities?.slice(0, 3) || [],
        image: r.imageurls?.[0] || "",
      }));

      const roomList = topRooms
        .map(
          (r, i) =>
            `${i + 1}. ${r.name} - ${r.price?.toLocaleString()}₫/đêm (${r.amenities.join(", ")})`
        )
        .join("\n");

      return res.json({
        reply: `🏨 Bạn đã chọn khách sạn *${hotel.name}*.\nDưới đây là các phòng khả dụng:\n${roomList}\n\nBạn muốn chọn phòng nào để đặt ạ?`,
        suggest: topRooms.map((r) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          image: r.image,
        })),
        // ✅ Giữ lại cả hotelId để FE dùng tiếp
        context: { ...context, hotelId, hotelName: hotel.name },
      });
    }

    /** ==================== 4️⃣ KHI CHỌN PHƯƠNG THỨC THANH TOÁN ==================== */
    if (
      context.stage === "choose_payment" &&
      (
        message.toLowerCase().includes("chọn") ||
        message.toLowerCase().includes("thanh toán") ||
        message.toLowerCase().includes("tiền mặt") ||
        message.toLowerCase().includes("momo") ||
        message.toLowerCase().includes("vnpay") ||
        message.toLowerCase().includes("chuyển khoản")
      )
    ) {
      console.log("💳 Người dùng chọn phương thức thanh toán:", message);

      const methodMap = {
        cash: "Tiền mặt tại quầy",
        bank_transfer: "Chuyển khoản ngân hàng",
        vnpay: "VNPay",
        mobile_payment: "MoMo",
      };
      let chosenMethod = null;
      const text = normalizeVietnamese(message);

      if (text.includes("tien mat")) chosenMethod = "cash";
      else if (text.includes("chuyen khoan")) chosenMethod = "bank_transfer";
      else if (text.includes("vnpay")) chosenMethod = "vnpay";
      else if (text.includes("momo")) chosenMethod = "mobile_payment";
      else if (text.includes("thanh toan")) chosenMethod = "cash"; // fallback




      if (!chosenMethod) {
        return res.json({
          reply:
            "Vui lòng chọn phương thức thanh toán hợp lệ (Tiền mặt, VNPay, MoMo, hoặc Chuyển khoản).",
        });
      }

      const room = await Room.findById(context.roomId)
        .populate("hotelId", "name")
        .lean();
      if (!room) {
        return res.json({ reply: "Không tìm thấy phòng bạn chọn." });
      }


      // 🧠 Chuẩn hóa ngày nhận và trả phòng (fix lỗi Invalid time value)
      function parseDate(input) {
        if (!input) return null;

        // nếu dạng "25/10" hoặc "25-10" thì thêm năm hiện tại
        const parts = input.split(/[\/\-]/).map((p) => p.trim());
        if (parts.length === 2) {
          const [d, m] = parts;
          const y = new Date().getFullYear();
          return new Date(`${y}-${m}-${d}`);
        }

        // nếu có đủ 3 phần ngày/tháng/năm
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return new Date(`${y}-${m}-${d}`);
        }

        // fallback: parse bình thường
        return new Date(input);
      }

      // 🧠 Tạo booking thật
      const checkinDate = parseDate(context.checkin);
      const checkoutDate = parseDate(context.checkout);

      const bookingPayload = {
        roomid: room._id,
        checkin: checkinDate ? checkinDate.toISOString() : new Date().toISOString(),
        checkout: checkoutDate
          ? checkoutDate.toISOString()
          : new Date(Date.now() + 86400000).toISOString(),
        adults: context.people || 2,
        children: 0,
        name: "Khách hàng chatbot",
        email: "guest@chatbot.ai",
        phone: "0000000000",
        paymentMethod: chosenMethod,
        roomsBooked: 1,
        totalAmount: room.rentperday,
      };


      let newBooking;
      try {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const bookingRes = await axios.post(`${baseUrl}/api/bookings/bookroom`, bookingPayload);
        newBooking = bookingRes.data?.booking || bookingRes.data;

        if (!newBooking?._id) {
          console.error("⚠️ Lỗi: API bookroom không trả booking hợp lệ", bookingRes.data);
          return res.json({
            reply: "Có lỗi khi tạo đơn đặt phòng, vui lòng thử lại sau.",
          });
        }
      } catch (err) {
        console.error("❌ Lỗi khi tạo booking:", err.message);
        return res.json({
          reply: "Xin lỗi, hệ thống đang gặp sự cố khi tạo đơn. Vui lòng thử lại sau.",
        });
      }


      // ✅ Xử lý redirect cho các cổng thanh toán
      if (chosenMethod === "vnpay") {
        const vnpayRes = await axios.post(`${baseUrl}/api/vnpay/create-payment`, {
          amount: newBooking.totalAmount,
          orderId: `VNP${Date.now()}`,
          orderInfo: `Thanh toán phòng ${room.name}`,
          bookingId: newBooking._id,
        });

        return res.json({
          reply: `💳 Đang chuyển hướng đến cổng thanh toán VNPay...`,
          redirect: vnpayRes.data.payUrl,
        });
      }

      if (chosenMethod === "mobile_payment") {
        try {
          const momoRes = await axios.post(`${baseUrl}/api/momo/create-payment`, {
            amount: newBooking.totalAmount,
            orderId: `MOMO${Date.now()}`,
            orderInfo: `Thanh toán phòng ${room.name}`,
            bookingId: newBooking._id,
          });

          if (!momoRes.data?.payUrl) {
            console.error("⚠️ MoMo không trả về payUrl:", momoRes.data);
            return res.json({
              reply: "Không thể kết nối tới MoMo. Vui lòng chọn phương thức khác.",
            });
          }

          return res.json({
            reply: `📱 Đang chuyển hướng đến cổng thanh toán MoMo...`,
            redirect: momoRes.data.payUrl,
          });
        } catch (err) {
          console.error("❌ Lỗi MoMo:", err.message);
          return res.json({
            reply: "Hệ thống MoMo hiện không khả dụng. Vui lòng chọn phương thức khác.",
          });
        }
      }


      if (chosenMethod === "bank_transfer") {
        return res.json({
          reply: `🏦 Đặt phòng thành công!\nVui lòng chuyển khoản theo hướng dẫn trên trang chi tiết đơn hàng.`,
          redirect: `/bookingscreen/${room._id}?bookingId=${newBooking._id}`,
        });
      }

      // Mặc định tiền mặt
      return res.json({
        reply: `✅ Đặt phòng thành công!\nPhòng *${room.name}* tại *${room.hotelId.name}* đã được giữ chỗ.\nPhương thức thanh toán: *${methodMap[chosenMethod]}*.\nBạn có thể thanh toán tại quầy khi nhận phòng.`,
        redirect: `/`,
        context: { ...context, stage: null }, // ✅ reset để tránh lặp
      });

    }


    /** ==================== 1️⃣ FLOW TÌM / ĐẶT KHÁCH SẠN ==================== */
    if (intent === "booking" || intent === "search") {
      const { region, people, checkin, checkout } = await extractInfo(message);

      if (!region && !prev.region)
        return res.json({
          reply:
            "Bạn muốn tìm khách sạn ở khu vực nào ạ? (VD: Đà Lạt, Hà Nội, Nha Trang...)",
          expect: "region",
          context: prev,
        });

      if (!people && !prev.people)
        return res.json({
          reply: `Bạn đi mấy người${region ? ` đến ${region.name}` : ""
            } vậy ạ?`,
          expect: "people",
          context: { ...prev, region: region?.name || prev.region },
        });

      if ((!checkin || !checkout) && (!prev.checkin || !prev.checkout))
        return res.json({
          reply:
            "Bạn muốn nhận và trả phòng ngày nào? (VD: 1/10 - 3/10)",
          expect: "date",
          context: {
            ...prev,
            region: region?.name || prev.region,
            people: people || prev.people,
          },
        });

      const regionObj =
        region || (await Region.findOne({ name: prev.region }).lean());
      if (!regionObj)
        return res.json({
          reply: `Mình không tìm thấy khu vực ${prev.region} rồi 😢`,
        });

      const hotels = await Hotel.find({ region: regionObj._id })
        .populate("region", "name")
        .populate("rooms")
        .lean();

      if (!hotels.length)
        return res.json({
          reply: `Hiện chưa có khách sạn nào ở ${regionObj.name}.`,
        });

      const list = hotels
        .slice(0, 5)
        .map(
          (h, i) =>
            `${i + 1}. ${h.name} (${h.starRating || 3}⭐) - giá từ ${getLowestPrice(h)?.toLocaleString() || "N/A"
            }₫`
        )
        .join("\n");

      return res.json({
        reply: `Dưới đây là một số khách sạn ở ${regionObj.name} phù hợp cho ${people || prev.people
          } người:\n${list}\n\nBạn muốn xem khách sạn nào ạ?`,
        suggest: hotels.map((h) => ({ id: h._id, name: h.name })),
        context: {
          region: regionObj.name,
          people: people || prev.people,
          checkin: checkin || prev.checkin,
          checkout: checkout || prev.checkout,
        },
      });
    }





    /** ==================== 4️⃣ MẶC ĐỊNH ==================== */
    return res.json({
      reply:
        "Xin chào 👋! Tôi có thể giúp bạn tìm và đặt khách sạn. Bạn muốn đi đâu ạ?",
    });
  } catch (err) {
    console.error("❌ Chatbot error:", err.message);
    res.status(500).json({
      reply: "Xin lỗi, tôi đang bận. Vui lòng thử lại sau.",
      error: err.message,
    });
  }
};
