// src/routes/chatRoutes.js
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/chatController');
r.get('/', protect, c.getConversations);
r.post('/send', protect, c.sendMessage);
r.get('/:userId', protect, c.getChatHistory);
r.put('/:userId/read', protect, c.markAsRead);
module.exports = r;
