const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre obligatorio.' });
    const members = [req.user._id, ...(memberIds || []).filter(id => id !== req.user._id.toString())];
    const group = await Group.create({ name, description, admin: req.user._id, members });
    await group.populate('members', 'username avatar');
    res.status(201).json(group);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('admin', 'username avatar').populate('members', 'username avatar').sort({ updatedAt: -1 });
    res.json(groups);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('admin', 'username avatar').populate('members', 'username avatar');
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado.' });
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) return res.status(403).json({ message: 'No eres miembro.' });
    res.json(group);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado.' });
    if (group.admin.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Solo el admin puede agregar.' });
    const u = await User.findById(req.body.userId);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (group.members.map(m=>m.toString()).includes(req.body.userId)) return res.status(400).json({ message: 'Ya es miembro.' });
    group.members.push(req.body.userId); await group.save();
    res.json({ message: `${u.username} agregado.` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado.' });
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    if (group.admin.toString() === req.user._id.toString() && group.members.length > 0) group.admin = group.members[0];
    if (group.members.length === 0) { await Group.findByIdAndDelete(group._id); return res.json({ message: 'Grupo eliminado.' }); }
    await group.save(); res.json({ message: 'Saliste del grupo.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.sendGroupMessage = async (req, res) => {
  try {
    const { content, type } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado.' });
    if (!group.members.some(m => m.toString() === req.user._id.toString())) return res.status(403).json({ message: 'No eres miembro.' });
    if (!content) return res.status(400).json({ message: 'Mensaje vacío.' });
    const msg = await GroupMessage.create({ group: group._id, sender: req.user._id, content, type: type || 'text' });
    await msg.populate('sender', 'username avatar');
    res.status(201).json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado.' });
    if (!group.members.some(m => m.toString() === req.user._id.toString())) return res.status(403).json({ message: 'No eres miembro.' });
    const page = parseInt(req.query.page) || 1;
    const msgs = await GroupMessage.find({ group: group._id }).sort({ createdAt: 1 }).skip((page-1)*50).limit(50).populate('sender', 'username avatar');
    res.json({ page, count: msgs.length, messages: msgs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
