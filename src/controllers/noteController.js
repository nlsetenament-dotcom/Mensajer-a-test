const Note = require('../models/Note');

exports.createNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Contenido obligatorio.' });
    const note = await Note.create({ author: req.user._id, content });
    await note.populate('author', 'username avatar');
    res.status(201).json(note);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const notes = await Note.find().sort({ createdAt: -1 }).skip((page-1)*20).limit(20).populate('author', 'username avatar');
    res.json({ page, count: notes.length, notes });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getNotesByUser = async (req, res) => {
  try {
    const notes = await Note.find({ author: req.params.userId }).sort({ createdAt: -1 }).populate('author', 'username avatar');
    res.json(notes);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Nota no encontrada.' });
    if (note.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'No autorizado.' });
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Nota eliminada.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
