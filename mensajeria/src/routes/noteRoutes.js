// src/routes/noteRoutes.js
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/noteController');
r.post('/', protect, c.createNote);
r.get('/', protect, c.getAllNotes);
r.get('/user/:userId', protect, c.getNotesByUser);
r.delete('/:id', protect, c.deleteNote);
module.exports = r;
