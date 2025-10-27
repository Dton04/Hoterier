import React, { useState } from "react";
import axios from "axios";
import { FaComments, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import botAvatar from "../../assets/images/chatbot.png"

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Xin chào 👋! Tôi là trợ lý Hotelier. Bạn muốn tìm khách sạn ở đâu ạ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/chatbot/chat", {
        message: input,
        context,
      });

      const botReply = data.reply || "Xin lỗi, tôi chưa hiểu ý bạn.";
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
      setSuggestions(data.suggest || []);
      setContext((prev) => ({
        ...prev,
        ...data.context,
        hotelId: data.context?.hotelId || prev.hotelId, // ✅ giữ lại hotelId
      }));


      if (data.redirect) {
        setTimeout(() => navigate(data.redirect), 1200);
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Xin lỗi, tôi đang bận. Vui lòng thử lại sau." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item) => {
    setSuggestions([]);
    setMessages((prev) => [...prev, { sender: "user", text: `Tôi chọn ${item.name}` }]);

    try {
      let newContext = { ...context };

      if (!context.hotelId) {
        newContext.hotelId = item.id; // Bước chọn khách sạn
      } else if (!context.roomId) {
        newContext.roomId = item.id; // Bước chọn phòng
      }



      const { data } = await axios.post("/api/chatbot/chat", {
        message: `Chọn ${item.name}`,
        context: newContext,
      });

      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
      setSuggestions(data.suggest || []);
      setContext({ ...newContext, ...data.context });

      if (data.redirect) setTimeout(() => navigate(data.redirect), 1000);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Có lỗi xảy ra, vui lòng thử lại." },
      ]);
    }
  };




  return (
    <div className="fixed bottom-6 right-6 z-50">

      {open && (
        <div className="bg-white w-80 sm:w-96 h-[520px] shadow-2xl rounded-xl flex flex-col border border-gray-200">
     
          <div className="bg-[#003580] text-white font-semibold p-3 rounded-t-xl flex justify-between items-center">
            <span>💬 Trợ lý Hotelier</span>
            <button onClick={() => setOpen(false)} className="text-black hover:text-red-300 text-lg">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm max-w-[80%] ${msg.sender === "bot"
                  ? "bg-blue-100 text-gray-800 self-start"
                  : "bg-[#0071c2] text-white self-end ml-auto"
                  }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && <p className="text-gray-400 text-xs italic">Đang nhập...</p>}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-gray-700 text-sm font-medium">🔍 Gợi ý:</p>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 shadow-sm flex items-center gap-2 p-2 transition"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-gray-800">{item.name}</span>
                      {item.price && (
                        <span className="text-blue-600 font-semibold">
                          {Number(item.price).toLocaleString()}₫ / đêm
                        </span>
                      )}
                    </div>
                  </button>
                ))}


              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-[#0071c2] hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}


      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-[#0071c2] hover:bg-blue-700 w-16 h-16 rounded-full shadow-xl flex items-center justify-center overflow-hidden transform transition-transform hover:scale-110"
        >
          <img
            src={botAvatar}
            alt="Chatbot"
            className="w-8 h-8 object-cover animate-spin rounded-full scale-125"
          />
        </button>
      )}


    </div>
  );
}

export default ChatBot;
