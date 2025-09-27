const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true,
    unique: true
  },
  documentsProcessed: { 
    type: Number, 
    default: 0 
  },
  documentsAccepted: {
    type: Number,
    default: 0
  },
  documentsRejected: {
    type: Number,
    default: 0
  },
  documentsUnderReview: {
    type: Number,
    default: 0
  },
  modelIdentified: { 
    type: String 
  },
  documentTypeDistribution: {
    'Aadhaar Card': { type: Number, default: 0 },
    'PAN Card': { type: Number, default: 0 },
    'Bank Statement': { type: Number, default: 0 },
    'ITR': { type: Number, default: 0 },
    'Passport': { type: Number, default: 0 },
    'Driving License': { type: Number, default: 0 },
    'Other': { type: Number, default: 0 }
  },
  performance: { 
    type: Number, 
    min: 0, 
    max: 100,
    default: 0
  },
  totalUsers: { 
    type: Number, 
    default: 0 
  },
  totalDocuments: { 
    type: Number, 
    default: 0 
  },
  averageProcessingTime: {
    type: Number, // in seconds
    default: 0
  },
  systemHealth: {
    cpu: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    disk: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['Healthy', 'Warning', 'Critical'],
      default: 'Healthy'
    }
  },
  errorCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, { 
  timestamps: true 
});

// Indexes
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ performance: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = { Analytics };
