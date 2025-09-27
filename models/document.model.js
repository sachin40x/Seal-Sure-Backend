const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  fileType: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true 
  },
  documentType: { 
    type: String, 
    enum: ['Aadhaar Card', 'PAN Card', 'Bank Statement', 'ITR', 'Passport', 'Driving License', 'Other'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Accepted', 'Rejected', 'Under Review'],
    default: 'Pending' 
  },
  validationResults: {
    status: { 
      type: String, 
      enum: ['Valid', 'Invalid', 'Suspicious'],
      default: 'Valid'
    },
    confidence: { 
      type: Number, 
      min: 0, 
      max: 100,
      default: 0
    },
    issues: [{ 
      type: String 
    }],
    recommendations: [{ 
      type: String 
    }],
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  detectedTables: [{
    bbox: [Number], // [x, y, width, height]
    type: String,
    confidence: Number,
    description: String
  }],
  resultImagePath: String,
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  processedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String,
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
documentSchema.index({ userId: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ uploadedAt: -1 });
documentSchema.index({ 'validationResults.status': 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = { Document };
