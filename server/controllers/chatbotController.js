// controllers/chatbotController.js
const Hotel = require("../models/hotel");
const Region = require("../models/region");
const Room = require("../models/room");
const Booking = require("../models/booking");
const axios = require("axios");
require("dotenv").config();

/** 🧩 Hàm chuẩn hóa tiếng Việt */
function normalizeVietnamese(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** 🧩 Hàm tính giá thấp nhất */
function getLowestPrice(hotel) {
  if (!hotel?.rooms?.length) return null;
  const prices = hotel.rooms
    .map((r) => Number(r.rentperday || r.discountedPrice || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

/** 🧠 Hàm gọi OpenAI có retry */
async function callGPT(messages, maxRetries = 3) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await new Promise((r) => setTimeout(r, 1000 * i)); // delay tăng dần

      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages,
          temperature: 0.85,
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data.choices[0].message.content.trim();
    } catch (err) {
      if (err.response?.status === 429 && i < maxRetries) {
        console.warn(`⚠️ GPT bị quá tải, thử lại lần ${i + 1}...`);
        continue;
      }
      throw err;
    }
  }
  return "Hiện tại tôi hơi quá tải 😅, bạn thử lại sau nhé!";
}

/** 🧠 Nhận diện intent */
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

/** 🧩 Tách thông tin cơ bản */
async function extractInfo(msg) {
  const regions = await Region.find({}, "name").lean();
  const region = regions.find((r) =>
    msg.toLowerCase().includes(r.name.toLowerCase())
  );

  const peopleMatch = msg.match(/(\d+)\s*(?:nguoi|khach)/i);
  const people = peopleMatch ? parseInt(peopleMatch[1]) : null;

  const dateMatch = msg.match(/(\d{1,2})[\/\-](\d{1,2})/g);
  const checkin = dateMatch?.[0] || null;
  const checkout = dateMatch?.[1] || null;

  return { region, people, checkin, checkout };
}

/** 🧠 Chatbot chính */
exports.chatBotReply = async (req, res) => {
  try {
    const { message, context = {} } = req.body || {};
    if (!message) return res.status(400).json({ reply: "Thiếu tin nhắn" });

    console.log("📩 USER:", message);

    const intent = await detectIntent(message);

    // Nếu là ngoài lề → GPT xử lý
    if (intent === "general") {
      console.log("💬 Gọi GPT cho câu hỏi ngoài lề...");
      try {
        const aiReply = await callGPT([
          {
            role: "system",
            content: `
              Bạn là Hotelier — trợ lý AI thân thiện, vui vẻ, tự nhiên như người thật.
              Nếu người dùng nói chuyện cá nhân (buồn, vui, học, tình yêu, thời tiết, v.v...) 
              → hãy trò chuyện tự nhiên, khéo léo, thêm chút cảm xúc, giống ChatGPT.
              Nếu họ hỏi về khách sạn hoặc du lịch → gợi ý lịch sự, nhẹ nhàng.
            `,
          },
          { role: "user", content: message },
        ]);
        return res.json({ reply: aiReply });
      } catch (err) {
        console.error("❌ GPT error:", err.message);
        return res.json({
          reply:
            "Hệ thống AI đang hơi bận 😅, bạn thử hỏi lại sau vài giây nhé!",
        });
      }
    }

    // FLOW: tìm / đặt khách sạn
    if (intent === "search" || intent === "booking") {
      const { region, people, checkin, checkout } = await extractInfo(message);
      const prev = context || {};

      if (!region && !prev.region) {
        return res.json({
          reply: "Bạn muốn tìm khách sạn ở khu vực nào ạ? (VD: Đà Lạt, Hà Nội...)",
          expect: "region",
          context: prev,
        });
      }

      if (!people && !prev.people) {
        return res.json({
          reply: `Bạn đi mấy người${region ? ` đến ${region.name}` : ""} vậy ạ?`,
          expect: "people",
          context: { ...prev, region: region?.name || prev.region },
        });
      }

      if ((!checkin || !checkout) && (!prev.checkin || !prev.checkout)) {
        return res.json({
          reply: "Bạn muốn nhận và trả phòng ngày nào ạ? (VD: 1/10 - 3/10)",
          expect: "date",
          context: {
            ...prev,
            region: region?.name || prev.region,
            people: people || prev.people,
          },
        });
      }

      const regionObj =
        region || (await Region.findOne({ name: prev.region }).lean());
      if (!regionObj)
        return res.json({
          reply: `Mình không tìm thấy khu vực ${prev.region} rồi 😢`,
        });

      const hotels = await Hotel.find({ region: regionObj._id })
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
            `${i + 1}. ${h.name} (${h.starRating || 3}⭐) - giá từ ${
              getLowestPrice(h)?.toLocaleString() || "N/A"
            }₫`
        )
        .join("\n");

      return res.json({
        reply: `Dưới đây là một số khách sạn ở ${regionObj.name} phù hợp cho ${
          people || prev.people
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

    // Nếu không rơi vào case nào
    return res.json({
      reply:
        "Tôi chưa hiểu rõ lắm 😅. Bạn muốn tìm khách sạn, đặt phòng hay hỏi điều gì khác ạ?",
    });
  } catch (err) {
    console.error("❌ Chatbot error:", err.message);
    res.status(500).json({
      reply: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.",
    });
  }
};
