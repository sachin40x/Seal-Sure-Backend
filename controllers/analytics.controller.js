const { Analytics } = require('../models/analytics.model');
const { Document } = require('../models/document.model');
const { User } = require('../models/user.model');
const mongoose = require('mongoose');

// Get daily analytics
exports.getDailyAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Analytics.find({
      date: { $gte: startDate }
    }).sort({ date: -1 });

    res.json(analytics);

  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({ error: 'Error fetching daily analytics' });
  }
};

// Get performance metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();

    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const metrics = await Document.aggregate([
      {
        $match: {
          uploadedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          acceptedDocuments: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
          rejectedDocuments: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          pendingDocuments: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          averageConfidence: { $avg: '$validationResults.confidence' },
          averageProcessingTime: { $avg: { $subtract: ['$processedAt', '$uploadedAt'] } }
        }
      }
    ]);

    const documentTypeDistribution = await Document.aggregate([
      {
        $match: {
          uploadedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      metrics: metrics[0] || {
        totalDocuments: 0,
        acceptedDocuments: 0,
        rejectedDocuments: 0,
        pendingDocuments: 0,
        averageConfidence: 0,
        averageProcessingTime: 0
      },
      documentTypeDistribution
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Error fetching performance metrics' });
  }
};

// Get document type statistics
exports.getDocumentTypeStats = async (req, res) => {
  try {
    const stats = await Document.aggregate([
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          averageConfidence: { $avg: '$validationResults.confidence' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(stats);

  } catch (error) {
    console.error('Error fetching document type stats:', error);
    res.status(500).json({ error: 'Error fetching document type stats' });
  }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const pendingDocuments = await Document.countDocuments({ status: 'Pending' });
    const processingDocuments = await Document.countDocuments({ status: 'Processing' });

    // Calculate success rate
    const totalProcessed = await Document.countDocuments({
      status: { $in: ['Accepted', 'Rejected'] }
    });
    const acceptedDocuments = await Document.countDocuments({ status: 'Accepted' });
    const successRate = totalProcessed > 0 ? (acceptedDocuments / totalProcessed) * 100 : 0;

    // Get recent error count
    const recentErrors = await Document.countDocuments({
      'validationResults.status': 'Invalid',
      uploadedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    const systemHealth = {
      totalUsers,
      totalDocuments,
      pendingDocuments,
      processingDocuments,
      successRate: Math.round(successRate * 100) / 100,
      recentErrors,
      status: successRate > 80 ? 'Healthy' : successRate > 60 ? 'Warning' : 'Critical',
      lastUpdated: new Date()
    };

    res.json(systemHealth);

  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Error fetching system health' });
  }
};

// Update daily analytics (called by cron job)
exports.updateDailyAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    
    const todayStats = await Document.aggregate([
      {
        $match: {
          uploadedAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          documentsProcessed: { $sum: 1 },
          documentsAccepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
          documentsRejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          documentsUnderReview: { $sum: { $cond: [{ $eq: ['$status', 'Under Review'] }, 1, 0] } },
          averageConfidence: { $avg: '$validationResults.confidence' }
        }
      }
    ]);

    const documentTypeDistribution = await Document.aggregate([
      {
        $match: {
          uploadedAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = todayStats[0] || {
      documentsProcessed: 0,
      documentsAccepted: 0,
      documentsRejected: 0,
      documentsUnderReview: 0,
      averageConfidence: 0
    };

    const performance = stats.documentsProcessed > 0 
      ? (stats.documentsAccepted / stats.documentsProcessed) * 100 
      : 0;

    const analyticsData = {
      date: today,
      documentsProcessed: stats.documentsProcessed,
      documentsAccepted: stats.documentsAccepted,
      documentsRejected: stats.documentsRejected,
      documentsUnderReview: stats.documentsUnderReview,
      documentTypeDistribution: documentTypeDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      performance: Math.round(performance * 100) / 100,
      totalUsers,
      totalDocuments,
      averageProcessingTime: 0, // Calculate based on your processing logic
      systemHealth: {
        status: performance > 80 ? 'Healthy' : performance > 60 ? 'Warning' : 'Critical'
      },
      successRate: Math.round(performance * 100) / 100
    };

    await Analytics.findOneAndUpdate(
      { date: today },
      analyticsData,
      { upsert: true, new: true }
    );

    res.json({ message: 'Daily analytics updated successfully', analytics: analyticsData });

  } catch (error) {
    console.error('Error updating daily analytics:', error);
    res.status(500).json({ error: 'Error updating daily analytics' });
  }
};
