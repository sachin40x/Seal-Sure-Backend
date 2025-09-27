const express = require('express');
const multer = require('multer');
const { uploadDocument, getDocumentsByUser, getDocumentById, updateDocumentStatus, deleteDocument, getDocumentStats } = require('../controllers/document.controller');
const { verifyToken } = require('../middleware/auth');
const { validateUpload } = require('../middleware/fileValidation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Document routes
router.post('/upload', verifyToken, upload.single('file'), validateUpload, uploadDocument);
router.get('/user/:userId', verifyToken, getDocumentsByUser);
router.get('/:id', verifyToken, getDocumentById);
router.put('/:id/status', verifyToken, updateDocumentStatus);
router.delete('/:id', verifyToken, deleteDocument);
router.get('/stats/:userId', verifyToken, getDocumentStats);

module.exports = router;
