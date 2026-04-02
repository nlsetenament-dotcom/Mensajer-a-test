const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const s = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '', maxlength: 150 },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });
s.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10); next();
});
s.methods.matchPassword = function(p) { return bcrypt.compare(p, this.password); };
module.exports = mongoose.model('User', s);
