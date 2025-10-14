const express = require('express');
const router = express.Router();

const Contact = require('../models/contact'); 

router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // Kiểm tra các trường bắt buộc
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Tạo contact mới
    const newContact = new Contact({
      name,
      email,
      subject,
      message,
    });

    // Lưu vào database
    await newContact.save();

    res.status(201).json({ message: 'Contact message sent successfully', contact: newContact });
  } catch (error) {
    res.status(500).json({ message: 'Error sending contact message', error });
  }
});

module.exports = router;