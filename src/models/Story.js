const mongoose = require('mongoose');
const s = new mongoose.Schema({
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['image','text'], default: 'text' },
  content: { type: String, required: true },
  bgColor: { type: String, default: '#6366f1' },
  views:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
s.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = mongoose.model('Story', s);
