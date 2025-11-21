const Hotel = require("../models/hotel");
const Region = require("../models/region");
const Room = require("../models/room");
const Booking = require("../models/booking");
const axios = require("axios");
require("dotenv").config();

/**Hàm chuẩn hóa tiếng Việt */
function normalizeVietnamese(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** Hàm tính giá thấp nhất */
function getLowestPrice(hotel) {
  if (!hotel?.rooms?.length) return null;
  const prices = hotel.rooms
    .map((r) => Number(r.rentperday || r.discountedPrice || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

/** Hàm gọi API chatbot**/
async function callGeminiChatbot(messages) {
  console.log("API Key Loaded:", process.env.GEMINI_API_KEY ? "Có" : "Không tìm thấy");
  try {
    const userMessage = messages[messages.length - 1].content;

    // TÁI TẠO systemPrompt để ghép vào nội dung user (vì 'config' không được hỗ trợ qua HTTP)
    const systemPrompt =
      "Bạn là Hotelier — trợ lý khách sạn thân thiện, vui vẻ, nói chuyện tự nhiên và lịch sự bằng tiếng Việt, trả lời ngắn gọn, rõ ràng. Nếu người dùng hỏi chuyện cá nhân hoặc ngoài lề (buồn, vui, học, thời tiết, v.v...) hãy trò chuyện tự nhiên, khéo léo, có cảm xúc. Giới hạn câu trả lời của bạn dưới 500 ký tự.";

    const GEMINI_MODEL = "gemini-2.5-flash";
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // GHÉP systemPrompt VÀO CÙNG userMessage
    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nNgười dùng nói: ${userMessage}` }]
      }
    ];

    const response = await axios.post(
      GEMINI_ENDPOINT,
      {
        contents: contents,
        // *** ĐÃ LOẠI BỎ KHỐI CONFIG/SYSTEM INSTRUCTION GÂY LỖI 400 ***
      },
      {
        timeout: 45000,
      }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return reply || "Xin lỗi, tôi chưa hiểu ý bạn nói (lỗi phản hồi AI).";
  } catch (err) {
    console.error("⚠️ Lỗi gọi Gemini API (Status):", err.response?.status);
    console.error("⚠️ Lỗi gọi Gemini API (Data):", err.response?.data);
    return "API Gemini hiện đang gặp sự cố, bạn thử lại sau nhé!";
  }
}



/**  Nhận diện intent */
async function detectIntent(msg) {
  const text = normalizeVietnamese(msg);

  // Các từ khóa ngoài lề
  const generalWords = [
    "buon", "vui", "met", "hoc", "yeu", "cam xuc", "thoi tiet",
    "cong nghe", "tam su", "ban la ai", "ke chuyen", "toi co nen"
  ];
  if (generalWords.some((w) => text.includes(w))) return "general";

  // Các từ khóa booking
  if (text.includes("dat") || text.includes("book") || text.includes("phong"))
    return "booking";

  // Từ khóa khách sạn
  if (text.includes("khach san") || text.includes("du lich") || text.includes("o dau"))
    return "search";

  // Kiểm tra region trong DB
  const regions = await Region.find({}, "name").lean();
  if (regions.some((r) => text.includes(normalizeVietnamese(r.name))))
    return "search";

  // Xác nhận
  if (["ok", "co", "dong y", "xac nhan"].some((w) => text.includes(w)))
    return "confirm";

  return "general";
}

/** Tách thông tin cơ bản*/
async function extractInfo(msg) {
  const regions = await Region.find({}, "name").lean();
  const lowerMsg = msg.toLowerCase();

  const region = regions.find((r) =>
    lowerMsg.includes(r.name.toLowerCase())
  );

  // 1. Cố gắng bắt số người có kèm từ khóa 'nguoi'/'khach'
  let people = null;
  const peopleMatch = lowerMsg.match(/(\d+)\s*(?:nguoi|khach)/i);
  if (peopleMatch) {
    people = parseInt(peopleMatch[1]);
  }

  // 2. Nếu không tìm thấy, kiểm tra xem tin nhắn có phải là SỐ ĐƠN LẺ không
  if (!people) {
    const singleNumberMatch = lowerMsg.match(/^\s*(\d+)\s*$/);
    if (singleNumberMatch) {
      const number = parseInt(singleNumberMatch[1]);
      if (number >= 1 && number <= 100) {
        people = number;
      }
    }
  }

  const dateMatch = lowerMsg.match(/(\d{1,2})[\/\-](\d{1,2})/g);
  const checkinRaw = dateMatch?.[0] || null;
  const checkoutRaw = dateMatch?.[1] || null;

  // Lấy năm hiện tại để tạo ngày hợp lệ (Mục đích: new Date() có thể parse)
  const currentYear = new Date().getFullYear();

  // Hàm chuyển đổi D/M sang YYYY-MM-DD
  const formatDmToYyyyMmDd = (dm) => {
    if (!dm) return null;
    const [day, month] = dm.split(/[\/\-]/);
    if (!day || !month) return null;
    // Đảm bảo month/day có 2 chữ số (MM/DD)
    return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const checkin = formatDmToYyyyMmDd(checkinRaw);
  const checkout = formatDmToYyyyMmDd(checkoutRaw);

  return { region, people, checkin, checkout };
}

/**Chatbot chính */

exports.chatBotReply = async (req, res) => {
  try {
    const { message, context = {} } = req.body || {};
    if (!message) return res.status(400).json({ reply: "Thiếu tin nhắn" });

    console.log("USER:", message);

    let intent = await detectIntent(message); // Dùng let
    const prev = context || {};

    // --- DUY TRÌ CONTEXTUAL INTENT ---
    if (prev.region && intent === "general") {
      console.log("Duy trì intent: Đã có khu vực, chuyển từ general -> search");
      intent = "search";
    }

    // --- 1. XỬ LÝ CÂU HỎI NGOÀI LỀ (GENERAL) ---
    if (intent === "general") {
      console.log(" Gọi Gemini cho câu hỏi ngoài lề...");
      try {
        const aiReply = await callGeminiChatbot([
          { role: "user", content: message },
        ]);
        return res.json({ reply: aiReply });
      } catch (err) {
        console.error("❌ Gemini error:", err.message);
        return res.json({
          reply: "Hệ thống AI đang hơi bận 😅, bạn thử hỏi lại sau vài giây nhé!",
        });
      }
    }

    // --- 2. XỬ LÝ LUỒNG ĐẶT PHÒNG/CHỌN PHÒNG (PRIORITY) ---

    // Nếu đủ thông tin người dùng thì đặt phòng luôn
    if (
      prev.hotelId && prev.roomId &&
      prev.name && prev.email && prev.phone && prev.paymentMethod &&
      prev.checkin && prev.checkout && prev.people
    ) {
      try {
        console.log("🤖 Chatbot đang tự động tạo booking...");
        const bookingData = {
          roomid: prev.roomId,
          hotelId: prev.hotelId,
          name: prev.name,
          email: prev.email,
          phone: prev.phone,
          checkin: prev.checkin,
          checkout: prev.checkout,
          people: prev.people,
          paymentMethod: prev.paymentMethod,
        };

        const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
        const response = await axios.post(`${BASE_URL}/api/bookings/bookroom`, bookingData);

        if (response.data?.booking) {
          return res.json({
            reply: `🎉 Đặt phòng thành công cho ${prev.name}!\nPhương thức thanh toán: ${prev.paymentMethod === "cash" ? "Tiền mặt" : "Trực tuyến"}.\nEmail xác nhận đã gửi tới ${prev.email}.`,
            context: {},
          });
        } else {
          return res.json({
            reply: "Không thể xác nhận đặt phòng, vui lòng thử lại hoặc đặt thủ công trên trang thanh toán.",
          });
        }
      } catch (err) {
        console.error("❌ Lỗi tạo booking tự động:", err.message);
        return res.json({
          reply: " Xin lỗi, hệ thống chưa thể tạo booking tự động. Vui lòng thử lại hoặc đặt thủ công trên trang thanh toán.",
        });
      }
    }

    // Hỏi thêm thông tin nếu thiếu
    if (prev.hotelId && prev.roomId && (!prev.name || !prev.email || !prev.phone || !prev.paymentMethod)) {
      return res.json({
        reply: "💬 Tôi cần thêm một vài thông tin:\n- Họ tên\n- Email\n- Số điện thoại\n- Phương thức thanh toán (cash, bank_transfer, momo, vnpay)",
        context: prev,
      });
    }



    // 2b. FLOW: Xử lý khi người dùng CHỌN KHÁCH SẠN (tìm kiếm phòng)
    if (prev.hotelId && !prev.roomId) {
      console.log("FLOW: Đã chọn khách sạn, đang tìm phòng...");

      // KHÔNG CẦN HỎI NGÀY Ở ĐÂY NỮA, VÌ NÓ ĐÃ ĐƯỢC HỎI Ở BƯỚC 3C DƯỚI ĐÂY
      // Mục đích là để luồng search cơ bản (3) phải cung cấp đủ ngày trước khi hiển thị khách sạn.
      // Nếu người dùng bỏ qua ngày, luồng (3) sẽ quay lại hỏi ngày.

      // Tiếp tục luồng tìm phòng khi đã có ngày
      const hotel = await Hotel.findById(prev.hotelId).populate("rooms").lean();

      if (!hotel)
        return res.json({ reply: "Khách sạn không hợp lệ.", context: { region: prev.region, people: prev.people } });

      const roomsList = hotel.rooms
        .filter((r) => r.rentperday > 0)
        .slice(0, 5)
        .map(
          (r, i) =>
            `${i + 1}. ${r.roomType} (${r.adults || 'N/A'} người) - ${Number(r.rentperday).toLocaleString()}₫/đêm`
        )
        .join("\n");

      if (!roomsList)
        return res.json({ reply: `Xin lỗi, khách sạn ${hotel.name} hiện không còn phòng trống.`, context: { region: prev.region, people: prev.people } });

      return res.json({
        reply: `Tuyệt vời! Tại **${hotel.name}**, chúng tôi có những phòng sau (tối đa 5 phòng): \n${roomsList}\n\nVui lòng chọn phòng để tiếp tục.`,
        suggest: hotel.rooms.slice(0, 5).map((r) => ({
          id: r._id,
          name: r.roomType,
          price: r.rentperday,
        })),
        context: prev, // Giữ nguyên context, chờ roomId
      });
    }

    // --- 3. XỬ LÝ LUỒNG TÌM KIẾM/HỎI THÔNG TIN (SEARCH/BOOKING) ---
    if (intent === "search" || intent === "booking") {
      // Tách thông tin từ tin nhắn mới
      const { region, people, checkin, checkout } = await extractInfo(message);

      // Cập nhật context (Quan trọng: Lưu date nếu có trong tin nhắn mới)
      const updatedContext = {
        ...prev,
        region: region?.name || prev.region,
        people: people || prev.people,
        checkin: checkin || prev.checkin,
        checkout: checkout || prev.checkout,
      };

      // 3a. Kiểm tra và hỏi khu vực
      if (!updatedContext.region) {
        return res.json({
          reply: "Bạn muốn tìm khách sạn ở khu vực nào ạ? (VD: Đà Lạt, Hà Nội...)",
          expect: "region",
          context: updatedContext,
        });
      }

      // 3b. Kiểm tra và hỏi số người (chỉ hỏi nếu chưa có)
      if (!updatedContext.people) {
        return res.json({
          reply: `Bạn đi mấy người${region ? ` đến ${region.name}` : ""} vậy ạ?`,
          expect: "people",
          context: updatedContext,
        });
      }

      // 3c. Kiểm tra và hỏi ngày
      if (!updatedContext.checkin || !updatedContext.checkout) {
        return res.json({
          reply: "Bạn muốn nhận và trả phòng ngày nào ạ? (VD: 1/10 - 3/10)",
          expect: "date",
          context: updatedContext,
        });
      }

      // 3d. Truy vấn và hiển thị khách sạn (Đã đủ thông tin)
      const regionObj = await Region.findOne({ name: updatedContext.region }).lean();
      if (!regionObj)
        return res.json({ reply: `Mình không tìm thấy khu vực ${updatedContext.region} rồi 😢` });

      const hotels = await Hotel.find({ region: regionObj._id }).populate("rooms").lean();

      if (!hotels.length)
        return res.json({ reply: `Hiện chưa có khách sạn nào ở ${regionObj.name}.` });

      const list = hotels
        .slice(0, 5)
        .map(
          (h, i) =>
            `${i + 1}. ${h.name} (${h.starRating || 3}⭐) - giá từ ${getLowestPrice(h)?.toLocaleString() || "N/A"}₫`
        )
        .join("\n");

      return res.json({
        reply: `Dưới đây là một số khách sạn ở ${regionObj.name} phù hợp cho ${updatedContext.people} người:\n${list}\n\nBạn muốn xem khách sạn nào ạ?`,
        suggest: hotels.map((h) => ({ id: h._id, name: h.name })),
        context: updatedContext,
      });
    }

    // --- 4. FALLBACK ---
    return res.json({
      reply:
        "Tôi chưa hiểu rõ lắm. Bạn muốn tìm khách sạn, đặt phòng hay hỏi điều gì khác ạ?",
    });
  } catch (err) {
    console.error("❌ Chatbot error:", err.message);
    res.status(500).json({
      reply: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.",
    });
  }
};
