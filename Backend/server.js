const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin'); // Add this line

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test database connection
testConnection();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Add this line

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend server is running!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Test your API at: http://localhost:${PORT}/api/test`);
    console.log(`📁 Uploads accessible at: http://localhost:${PORT}/uploads/`);
    console.log(`👥 Admin routes available at: http://localhost:${PORT}/api/admin/`);
});

console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DB_HOST:', process.env.DB_HOST);