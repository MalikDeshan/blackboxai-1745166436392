const express = require('express');
const Message = require('../models/Message');
const { authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Send a message (only doctors and patients can send messages)
router.post('/', authorizeRoles(['doctor', 'patient']), async (req, res) => {
  try {
    const { recipientId, encryptedContent } = req.body;
    if (!recipientId || !encryptedContent) {
      return res.status(400).json({ message: 'Recipient and encrypted content are required' });
    }
    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      encryptedContent,
    });
    await message.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get messages for logged-in user
router.get('/', authorizeRoles(['doctor', 'patient']), async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    }).sort({ createdAt: -1 }).populate('sender', 'username role').populate('recipient', 'username role');
    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
