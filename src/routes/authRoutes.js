// src/routes/authRoutes.js
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/authController');
r.post('/register', c.register);
r.post('/login', c.login);
r.post('/forgot-password', c.forgotPassword);
r.post('/reset-password/:token', c.resetPassword);
r.put('/change-password', protect, c.changePassword);
module.exports = r;
