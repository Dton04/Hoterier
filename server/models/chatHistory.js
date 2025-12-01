const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema({
   userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

   messages: [
      {
         sender: { type: String, enum: ["user", "bot"], required: true },
         text: String,
         timestamp: { type: Date, default: Date.now },
         intent: { type: String, default: null },

         region: String,
         people: Number,
         checkin: String,
         checkout: String,

         hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", default: null },
         roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
      }
   ],

   createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
