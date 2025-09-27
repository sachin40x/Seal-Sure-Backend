const path = require('path');
const fs = require('fs');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.pdf', '.doc', '.docx'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

// Validate file type
exports.validateFileType = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  const mimeType = req.file.mimetype;

  // Check if file extension is allowed
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return res.status(400).json({ 
      error: 'Invalid file type. Allowed types: JPG, PNG, GIF, BMP, PDF, DOC, DOCX',
      allowedTypes: ALLOWED_EXTENSIONS
    });
  }

  // Check MIME type
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(mimeType);

  if (!isImage && !isDocument) {
    return res.status(400).json({ 
      error: 'Invalid MIME type. File may be corrupted or not supported.',
      receivedType: mimeType
    });
  }

  // Store file type for later use
  req.fileType = isImage ? 'image' : 'document';
  next();
};

// Validate file size
exports.validateFileSize = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileSize = req.file.size;
  const fileType = req.fileType || 'document';

  const maxSize = fileType === 'image' ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  const maxSizeMB = Math.round(maxSize / (1024 * 1024));

  if (fileSize > maxSize) {
    return res.status(400).json({ 
      error: `File too large. Maximum size allowed: ${maxSizeMB}MB`,
      receivedSize: Math.round(fileSize / (1024 * 1024)) + 'MB',
      maxAllowed: maxSizeMB + 'MB'
    });
  }

  // Check minimum file size (to avoid empty files)
  if (fileSize < 1024) { // Less than 1KB
    return res.status(400).json({ 
      error: 'File too small. File may be corrupted or empty.',
      receivedSize: fileSize + ' bytes'
    });
  }

  next();
};

// Validate file integrity
exports.validateFileIntegrity = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Check if file exists and is readable
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({ error: 'File upload failed. File not found on server.' });
    }

    // Check file permissions
    fs.accessSync(req.file.path, fs.constants.R_OK);
    
    // Basic file header validation for images
    if (req.fileType === 'image') {
      const fileBuffer = fs.readFileSync(req.file.path);
      
      // Check for common image file headers
      const isJPEG = fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8;
      const isPNG = fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4E && fileBuffer[3] === 0x47;
      const isGIF = fileBuffer[0] === 0x47 && fileBuffer[1] === 0x49 && fileBuffer[2] === 0x46;
      const isBMP = fileBuffer[0] === 0x42 && fileBuffer[1] === 0x4D;

      if (!isJPEG && !isPNG && !isGIF && !isBMP) {
        return res.status(400).json({ 
          error: 'Invalid image file. File header does not match expected image format.',
          warning: 'File may be corrupted or not a valid image.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('File integrity check error:', error);
    return res.status(500).json({ error: 'Error validating file integrity' });
  }
};

// Sanitize filename
exports.sanitizeFilename = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Remove potentially dangerous characters
  const sanitizedFilename = req.file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit filename length

  // Update the file object
  req.file.originalname = sanitizedFilename;
  
  next();
};

// Check for malware patterns (basic)
exports.scanForMalware = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileContent = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1024)); // Check first 1KB

    // Basic suspicious patterns (this is very basic - in production use proper antivirus)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.write/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileContent)) {
        return res.status(400).json({ 
          error: 'File contains potentially malicious content.',
          warning: 'File has been rejected for security reasons.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Malware scan error:', error);
    // Don't block on scan errors, just log them
    next();
  }
};

// Combined validation middleware
exports.validateUpload = [
  exports.sanitizeFilename,
  exports.validateFileType,
  exports.validateFileSize,
  exports.validateFileIntegrity,
  exports.scanForMalware
];
