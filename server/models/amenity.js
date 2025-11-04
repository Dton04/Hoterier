const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '', trim: true },
  icon: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

amenitySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Amenity', amenitySchema);