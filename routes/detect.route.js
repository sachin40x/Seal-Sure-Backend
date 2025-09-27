const express = require('express');
const multer = require('multer');
const detectController = require('../controllers/detect.controller');

// Set up multer for image upload handling
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Route to handle image upload and manipulation detection
router.post('/detect-manipulation', upload.single('image'), detectController.detectManipulation);

// Route for document processing
router.post('/process-document', upload.single('document'), detectController.processDocument);

// Route for bank statement table detection
router.post('/detect-tables', upload.single('file'), detectController.detectTables);

module.exports = router;
