const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type } = req.body;
    if (!receiverId || !content) return res.status(400).json({ message: 'Faltan datos.' });
    if (receiverId === req.user._id.toString()) return res.status(400).json({ message: 'No puedes escribirte a ti mismo.' });
    if (!(await User.findById(receiverId))) return res.status(404).json({ message: 'Destinatario no encontrado.' });
    const msg = await Message.create({ sender: req.user._id, receiver: receiverId, content, type: type || 'text' });
    await msg.populate('sender', 'username avatar');
    res.status(201).json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getChatHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const msgs = await Message.find({ $or: [{ sender: myId, receiver: userId }, { sender: userId, receiver: myId }] })
      .sort({ createdAt: 1 }).skip((page - 1) * 50).limit(50)
      .populate('sender', 'username avatar').populate('receiver', 'username avatar');
    res.json({ page, count: msgs.length, messages: msgs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany({ sender: req.params.userId, receiver: req.user._id, read: false }, { read: true });
    res.json({ message: 'Leídos.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getConversations = async (req, res) => {
  try {
    const myId = req.user._id;
    const msgs = await Message.find({ $or: [{ sender: myId }, { receiver: myId }] })
      .sort({ createdAt: -1 }).populate('sender', 'username avatar').populate('receiver', 'username avatar');
    const seen = new Set(); const convs = [];
    for (const msg of msgs) {
      const other = msg.sender._id.toString() === myId.toString() ? msg.receiver : msg.sender;
      if (!seen.has(other._id.toString())) {
        seen.add(other._id.toString());
        const unread = await Message.countDocuments({ sender: other._id, receiver: myId, read: false });
        convs.push({ user: other, lastMessage: { content: msg.content, type: msg.type, createdAt: msg.createdAt }, unread });
      }
    }
    res.json(convs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
