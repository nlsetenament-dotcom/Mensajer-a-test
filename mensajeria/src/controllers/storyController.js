const Story = require('../models/Story');

exports.createStory = async (req, res) => {
  try {
    const { content, type, bgColor } = req.body;
    if (!content) return res.status(400).json({ message: 'Contenido obligatorio.' });
    const s = await Story.create({ author: req.user._id, content, type: type||'text', bgColor: bgColor||'#6366f1' });
    await s.populate('author', 'username avatar');
    res.status(201).json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getStories = async (req, res) => {
  try { res.json(await Story.find().sort({ createdAt: -1 }).populate('author', 'username avatar')); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyStories = async (req, res) => {
  try { res.json(await Story.find({ author: req.user._id }).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.viewStory = async (req, res) => {
  try {
    const s = await Story.findById(req.params.id).populate('author', 'username avatar').populate('views', 'username');
    if (!s) return res.status(404).json({ message: 'Historia no encontrada o expirada.' });
    if (!s.views.some(v => v._id.toString() === req.user._id.toString())) { s.views.push(req.user._id); await s.save(); }
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteStory = async (req, res) => {
  try {
    const s = await Story.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'No encontrada.' });
    if (s.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'No autorizado.' });
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Historia eliminada.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
