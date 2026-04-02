const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const tok = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const pub = u => ({ id: u._id, username: u.username, email: u.email, avatar: u.avatar, bio: u.bio, createdAt: u.createdAt });

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    if (await User.findOne({ $or: [{ email }, { username }] })) return res.status(400).json({ message: 'Email o username ya en uso.' });
    const user = await User.create({ username, email, password });
    res.status(201).json({ token: tok(user._id), user: pub(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos.' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Credenciales incorrectas.' });
    res.json({ token: tok(user._id), user: pub(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) return res.status(401).json({ message: 'Contraseña actual incorrecta.' });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Mínimo 6 caracteres.' });
    user.password = newPassword; await user.save();
    res.json({ message: 'Contraseña actualizada.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ message: 'Si el email existe recibirás el token.' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });
    res.json({ message: 'Token generado.', resetToken });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Token inválido o expirado.' });
    user.password = req.body.newPassword;
    user.resetPasswordToken = undefined; user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ token: tok(user._id), message: 'Contraseña restablecida.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
