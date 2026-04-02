const mongoose = require('mongoose');
const DAYS = parseInt(process.env.MSG_DELETE_DAYS) || 20;
const s = new mongoose.Schema({
  group:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['text','image','audio'], default: 'text' },
  content: { type: String, required: true },
}, { timestamps: true });
s.index({ createdAt: 1 }, { expireAfterSeconds: DAYS * 86400 });
module.exports = mongoose.model('GroupMessage', s);
