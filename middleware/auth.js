const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

// Check if user is admin (optional - for future admin features)
exports.checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Server error during admin check' });
  }
};

// Rate limiting middleware
exports.rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, value] of requests.entries()) {
      if (value < windowStart) {
        requests.delete(key);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(ip) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    
    next();
  };
};

// Optional: Check user ownership of resource
exports.checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.userId;
      
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      if (resource.userId && resource.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Server error during ownership check' });
    }
  };
};
