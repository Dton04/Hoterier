const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true, 
  },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true }, 
  description: { type: String, required: true },

  maxcount: { type: Number, required: true }, 
  beds: { type: Number, required: true },   
  baths: { type: Number, required: true },   

  rentperday: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 1 },

  phonenumber: { type: String, trim: true },

  imageurls: [{ type: String }],

  amenities: [{
    type: String,
    trim: true
  }],

  availabilityStatus: {
    type: String,
    enum: ["available", "maintenance", "busy"],
    default: "available",
  },

  dailyInventory: [
  {
    date: { type: String, required: true },    
    quantity: { type: Number, required: true },  
  }
],

  currentbookings: [
    {
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
      checkin: { type: Date, required: true },
      checkout: { type: Date, required: true },
      roomsBooked: { type: Number, default: 1},
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
