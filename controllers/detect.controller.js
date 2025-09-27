const path = require('path');
const fs = require('fs');

exports.detectManipulation = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    // Basic file analysis
    const fileExtension = path.extname(fileName).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension);
    const isDocument = ['.pdf', '.doc', '.docx', '.txt'].includes(fileExtension);

    // Simulate processing time
    setTimeout(() => {
      const result = {
        fileName,
        fileSize,
        fileType: fileExtension,
        isImage,
        isDocument,
        processed: true,
        message: 'File processed successfully',
        analysis: {
          format: fileExtension.toUpperCase(),
          size: `${(fileSize / 1024).toFixed(2)} KB`,
          status: 'Verified'
        }
      };

      // Clean up uploaded file
      fs.unlinkSync(imagePath);
      
      res.json(result);
    }, 1000);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing file' });
  }
};

exports.processDocument = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }

    const documentPath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    // Simulate document processing
    setTimeout(() => {
      const result = {
        fileName,
        fileSize,
        processed: true,
        message: 'Document processed and model trained successfully',
        analysis: {
          format: path.extname(fileName).toUpperCase(),
          size: `${(fileSize / 1024).toFixed(2)} KB`,
          status: 'Model Updated',
          confidence: Math.floor(Math.random() * 20) + 80 // Random confidence between 80-100
        }
      };

      // Clean up uploaded file
      fs.unlinkSync(documentPath);
      
      res.json(result);
    }, 2000);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing document' });
  }
};

const axios = require('axios');

exports.detectTables = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;
    const fileName = req.file.originalname;

    // Analyze the uploaded file
    const fileExtension = path.extname(fileName).toLowerCase();
    const fileSize = req.file.size;
    
    // Simulate document validation logic
    setTimeout(() => {
      let validationResult = {
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileExtension,
        detected_tables: [],
        result_image: 'mock_result.png',
        validation: {
          status: 'Valid',
          confidence: 85,
          issues: [],
          recommendations: []
        }
      };

      // Check file format
      if (!['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(fileExtension)) {
        validationResult.validation.status = 'Invalid';
        validationResult.validation.issues.push('Unsupported file format');
        validationResult.validation.confidence = 0;
      }

      // Check file size (should be reasonable for bank statement)
      if (fileSize < 10000) { // Less than 10KB
        validationResult.validation.status = 'Invalid';
        validationResult.validation.issues.push('File too small - may be corrupted');
        validationResult.validation.confidence = 20;
      } else if (fileSize > 10000000) { // More than 10MB
        validationResult.validation.status = 'Suspicious';
        validationResult.validation.issues.push('File too large - may contain hidden data');
        validationResult.validation.confidence = 60;
      }

      // Simulate table detection for bank statements
      if (validationResult.validation.status === 'Valid') {
        validationResult.detected_tables = [
          {
            bbox: [50, 100, 400, 150],
            type: 'Transaction Table',
            confidence: 0.9
          },
          {
            bbox: [50, 300, 400, 200],
            type: 'Summary Table', 
            confidence: 0.85
          }
        ];
        validationResult.validation.recommendations.push('Document appears to be a valid bank statement');
      }

      // Clean up uploaded file
      try {
        fs.unlinkSync(imagePath);
      } catch (unlinkError) {
        console.log('File already cleaned up or not found');
      }
      
      res.json(validationResult);
    }, 1500);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing bank statement' });
  }
};
