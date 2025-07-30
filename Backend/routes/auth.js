const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (JPEG, JPG, PNG)!'));
        }
    }
});

// Register route
router.post('/register', upload.single('universityId'), async (req, res) => {
    try {
        console.log('Registration request received:', {
            body: req.body,
            file: req.file ? { filename: req.file.filename, size: req.file.size } : 'No file'
        });

        const { username, email, password, role } = req.body;
        const universityIdImage = req.file ? req.file.filename : null;

        // Validation
        if (!username || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!universityIdImage) {
            return res.status(400).json({ message: 'University ID image is required' });
        }

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if this is the first admin user
        let isApproved = false;
        if (role === 'admin') {
            const [existingAdmins] = await pool.execute(
                'SELECT COUNT(*) as adminCount FROM users WHERE role = "admin" AND is_approved = 1'
            );
            
            // Auto-approve if this is the first approved admin
            if (existingAdmins[0].adminCount === 0) {
                isApproved = true;
                console.log('🔑 Auto-approving first admin user');
            }
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, role, university_id_image, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, universityIdImage, isApproved]
        );

        const message = isApproved 
            ? 'Admin account created and auto-approved! You can login now.'
            : 'User registered successfully. Pending admin approval.';

        res.status(201).json({ 
            message,
            userId: result.insertId,
            isApproved
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Clean up uploaded file if registration fails
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError);
            }
        }
        
        res.status(500).json({ 
            message: 'Server error during registration',
            error: error.message 
        });
    }
});

// Login route with enhanced error handling
// Enhanced Login Route
// Enhanced Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Both email and password are required',
                errorCode: 'MISSING_CREDENTIALS'
            });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
                errorCode: 'INVALID_EMAIL'
            });
        }

        // Check JWT_SECRET configuration
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET not configured');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error',
                errorCode: 'SERVER_ERROR'
            });
        }

        // Find user with case-insensitive email comparison
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal whether email exists for security
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                errorCode: 'AUTH_FAILED'
            });
        }

        const user = users[0];

        // Check account approval status
        if (!user.is_approved) {
            return res.status(403).json({
                success: false,
                message: 'Account pending approval',
                errorCode: 'ACCOUNT_PENDING'
            });
        }

        // Verify password with timing-safe comparison
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            // Log failed attempt (you might want to implement attempt limiting)
            console.warn(`Failed login attempt for user ${user.email}`);
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                errorCode: 'AUTH_FAILED'
            });
        }

        // Generate JWT token with additional security claims
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role,
                iss: 'your-app-name',  // Issuer
                aud: 'your-app-client' // Audience
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '8h', // Shorter expiration for better security
                algorithm: 'HS256' // Explicit algorithm specification
            }
        );

        // Set secure HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        console.log('Login successful for user:', user.email, 'Role:', user.role);

        // Successful login response - ALWAYS return token for frontend
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isApproved: user.is_approved
            },
            // Always return token for frontend authentication
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Generic error message to avoid leaking sensitive info
        res.status(500).json({ 
            success: false,
            message: 'Authentication failed',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Test route to verify everything is working
router.get('/test', async (req, res) => {
    try {
        // Test database connection
        const [result] = await pool.execute('SELECT COUNT(*) as userCount FROM users');
        
        res.json({
            message: 'Auth service is working',
            database: 'Connected',
            userCount: result[0].userCount,
            jwtSecret: process.env.JWT_SECRET ? 'Configured' : 'Missing',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            message: 'Auth service test failed',
            error: error.message
        });
    }
});

module.exports = router;