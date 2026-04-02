const User = require('../models/User');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `avatar_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Solo imágenes')), limits: { fileSize: 5 * 1024 * 1024 } });
exports.upload = upload;

exports.getMe = async (req, res) => {
  try { res.json(await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpires')); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username avatar bio createdAt');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bio, username } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { bio, username }, { new: true, runValidators: true }).select('-password');
    res.json({ message: 'Perfil actualizado.', user });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Username ya en uso.' });
    res.status(500).json({ message: e.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió archivo.' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true }).select('-password');
    res.json({ message: 'Avatar actualizado.', avatar: user.avatar });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Escribe algo para buscar.' });
    const users = await User.find({ username: { $regex: q, $options: 'i' }, _id: { $ne: req.user._id } }).select('username avatar bio').limit(20);
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
