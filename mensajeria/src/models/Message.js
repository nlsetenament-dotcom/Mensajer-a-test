const mongoose = require('mongoose');
const DAYS = parseInt(process.env.MSG_DELETE_DAYS) || 20;
const s = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['text','image','audio'], default: 'text' },
  content:  { type: String, required: true },
  read:     { type: Boolean, default: false },
}, { timestamps: true });
s.index({ createdAt: 1 }, { expireAfterSeconds: DAYS * 86400 });
module.exports = mongoose.model('Message', s);
