const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  action: { 
    type: String, 
    required: true,
    enum: [
      'login', 'logout', 'signup',
      'upload_document', 'delete_document', 'view_document',
      'accept_document', 'reject_document', 'review_document',
      'admin_action', 'system_error', 'security_alert'
    ]
  },
  documentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document' 
  },
  ipAddress: String,
  userAgent: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Warning'],
    default: 'Success'
  },
  resource: String, // API endpoint or resource accessed
  method: String, // HTTP method
  responseTime: Number, // in milliseconds
  errorMessage: String,
  sessionId: String
}, { 
  timestamps: true 
});

// Indexes for better query performance
auditSchema.index({ userId: 1 });
auditSchema.index({ action: 1 });
auditSchema.index({ timestamp: -1 });
auditSchema.index({ severity: 1 });
auditSchema.index({ status: 1 });

const Audit = mongoose.model('Audit', auditSchema);

module.exports = { Audit };
