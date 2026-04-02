// src/routes/userRoutes.js
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/userController');
r.get('/search', protect, c.searchUsers);
r.get('/me', protect, c.getMe);
r.put('/me', protect, c.updateProfile);
r.post('/avatar', protect, c.upload.single('avatar'), c.uploadAvatar);
r.get('/:id', protect, c.getUserById);
module.exports = r;
