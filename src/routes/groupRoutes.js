// src/routes/groupRoutes.js
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/groupController');
r.post('/', protect, c.createGroup);
r.get('/', protect, c.getMyGroups);
r.get('/:groupId', protect, c.getGroupById);
r.post('/:groupId/members', protect, c.addMember);
r.delete('/:groupId/leave', protect, c.leaveGroup);
r.post('/:groupId/messages', protect, c.sendGroupMessage);
r.get('/:groupId/messages', protect, c.getGroupMessages);
module.exports = r;
