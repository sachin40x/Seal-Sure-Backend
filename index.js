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
    'https://your-netlify-app.netlify.app', // Replace with your Netlify URL
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use('/api', userRouter); // Correctly mount the user router
app.use('/api', detectRouter); // Mount the detect router
app.use('/api/documents', documentRouter); // Mount the document router
app.use('/api/analytics', analyticsRouter); // Mount the analytics router

// Serve static files from uploads and outputs directories
app.use('/api/uploads', express.static('uploads'));
app.use('/api/outputs', express.static('outputs'));

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Mongoose is connected"))
    .catch((err) => console.log("Error in connecting Mongoose:", err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);  // Correct the string format
});
