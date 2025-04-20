const express = require('express');
const multer = require('multer');
const { authorizeRoles } = require('../middleware/auth');
const router = express.Router();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload file to S3
router.post('/upload', authorizeRoles(['doctor', 'patient']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    const fileKey = `${uuidv4()}_${req.file.originalname}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ServerSideEncryption: 'AES256',
    };
    await s3.upload(params).promise();
    res.status(201).json({ message: 'File uploaded successfully', fileKey });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate signed URL for file download
router.get('/download/:fileKey', authorizeRoles(['doctor', 'patient']), async (req, res) => {
  try {
    const { fileKey } = req.params;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Expires: 60 * 5, // 5 minutes
    };
    const url = s3.getSignedUrl('getObject', params);
    res.json({ url });
  } catch (err) {
    console.error('File download error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
