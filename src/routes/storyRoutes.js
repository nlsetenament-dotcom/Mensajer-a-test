// src/routes/storyRoutes.js
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/storyController');
r.post('/', protect, c.createStory);
r.get('/', protect, c.getStories);
r.get('/me', protect, c.getMyStories);
r.get('/:id', protect, c.viewStory);
r.delete('/:id', protect, c.deleteStory);
module.exports = r;
