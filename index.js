const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
const userRouter = require('./routes/user.route'); // Ensure this path is correct
const detectRouter = require('./routes/detect.route');
const documentRouter = require('./routes/document.route');
const analyticsRouter = require('./routes/analytics.route');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Use cors middleware
const allowedOrigins = [
    'http://localhost:5173',
    'https://sealsure.netlify.app', // Your actual Netlify frontend URL
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: true, // Allow all origins temporarily for debugging
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend API is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api', userRouter); // Correctly mount the user router
app.use('/api', detectRouter); // Mount the detect router
app.use('/api/documents', documentRouter); // Mount the document router
app.use('/api/analytics', analyticsRouter); // Mount the analytics router

// Serve static files from uploads and outputs directories
app.use('/api/uploads', express.static('uploads'));
app.use('/api/outputs', express.static('outputs'));

// MongoDB connection with better error handling
const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || 'mongodb+srv://sachinacz15_db_user:Sachin%409145@cluster0.amfz3ti.mongodb.net/sealsure_db?retryWrites=true&w=majority';
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUrl);
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.log("❌ MongoDB connection failed:", error.message);
        console.log("MONGO_URL:", process.env.MONGO_URL);
        console.log("Using fallback URL...");
        // Don't exit, let server start with fallback
    }
};

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
