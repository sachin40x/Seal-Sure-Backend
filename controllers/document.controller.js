const { Document } = require('../models/document.model');
const { Audit } = require('../models/audit.model');
const fs = require('fs');
const path = require('path');

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType, tags } = req.body;
    const userId = req.user?.userId; // From auth middleware

    const document = new Document({
      userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      documentType: documentType || 'Other',
      tags: tags ? tags.split(',') : [],
      status: 'Pending'
    });

    await document.save();

    // Log audit
    await Audit.create({
      userId,
      action: 'upload_document',
      documentId: document._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        documentType
      }
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        fileName: document.originalName,
        documentType: document.documentType,
        status: document.status,
        uploadedAt: document.uploadedAt
      }
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Error uploading document' });
  }
};

// Get documents by user
exports.getDocumentsByUser = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, status, documentType } = req.query;

    const filter = { userId };
    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;

    const documents = await Document.find(filter)
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-filePath'); // Don't expose file paths

    const total = await Document.countDocuments(filter);

    res.json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

// Get document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);

  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
};

// Update document status
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    const userId = req.user?.userId;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.status = status;
    if (reviewNotes) document.reviewNotes = reviewNotes;
    if (status === 'Accepted' || status === 'Rejected') {
      document.processedAt = new Date();
    }

    await document.save();

    // Log audit
    await Audit.create({
      userId,
      action: status === 'Accepted' ? 'accept_document' : 'reject_document',
      documentId: document._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { status, reviewNotes }
    });

    res.json({
      message: 'Document status updated successfully',
      document: {
        id: document._id,
        status: document.status,
        processedAt: document.processedAt
      }
    });

  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({ error: 'Error updating document status' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await Document.findByIdAndDelete(id);

    // Log audit
    await Audit.create({
      userId,
      action: 'delete_document',
      documentId: id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { fileName: document.originalName }
    });

    res.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
};

// Get document statistics
exports.getDocumentStats = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const stats = await Document.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          processing: { $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] } }
        }
      }
    ]);

    const documentTypeStats = await Document.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      stats: stats[0] || { total: 0, accepted: 0, rejected: 0, pending: 0, processing: 0 },
      documentTypeStats
    });

  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Error fetching document stats' });
  }
};
