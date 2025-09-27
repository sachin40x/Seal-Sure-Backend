const mongoose = require('mongoose');
const { Analytics } = require('../models/analytics.model');
require('dotenv').config();

const seedAnalytics = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/sealsure');
    
    // Clear existing analytics
    await Analytics.deleteMany({});
    
    // Create sample analytics data for the last 7 days
    const analyticsData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const documentsProcessed = Math.floor(Math.random() * 50) + 20;
      const documentsAccepted = Math.floor(documentsProcessed * (0.8 + Math.random() * 0.15));
      const documentsRejected = documentsProcessed - documentsAccepted;
      
      analyticsData.push({
        date: date,
        documentsProcessed: documentsProcessed,
        documentsAccepted: documentsAccepted,
        documentsRejected: documentsRejected,
        documentsUnderReview: Math.floor(Math.random() * 5),
        documentTypeDistribution: {
          'Aadhaar Card': Math.floor(Math.random() * 15) + 5,
          'PAN Card': Math.floor(Math.random() * 10) + 3,
          'Bank Statement': Math.floor(Math.random() * 20) + 8,
          'ITR': Math.floor(Math.random() * 8) + 2,
          'Passport': Math.floor(Math.random() * 5) + 1,
          'Driving License': Math.floor(Math.random() * 7) + 2,
          'Other': Math.floor(Math.random() * 3) + 1
        },
        performance: Math.round((documentsAccepted / documentsProcessed) * 100 * 100) / 100,
        totalUsers: 15 + Math.floor(Math.random() * 10),
        totalDocuments: 200 + Math.floor(Math.random() * 100),
        averageProcessingTime: Math.floor(Math.random() * 30) + 10,
        systemHealth: {
          status: Math.random() > 0.1 ? 'Healthy' : 'Warning'
        },
        successRate: Math.round((documentsAccepted / documentsProcessed) * 100 * 100) / 100
      });
    }
    
    await Analytics.insertMany(analyticsData);
    console.log('✅ Analytics data seeded successfully!');
    console.log(`📊 Created ${analyticsData.length} analytics records`);
    
  } catch (error) {
    console.error('❌ Error seeding analytics:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAnalytics();
